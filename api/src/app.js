import { hostname } from 'node:os';
import express from 'express';
import cors from 'cors';
import { createMemoryStore } from './store.js';

/**
 * The API, as an Express app that is never started here.
 *
 * `server.js` listens; this file only builds. That split is what lets the tests
 * drive the real routes without binding a port, which is why the suite runs in
 * CI on a machine with nothing else on it.
 */
export function createApp({ store = createMemoryStore() } = {}) {
	const app = express();
	app.use(cors());
	app.use(express.json());

	// ── probes ──────────────────────────────────────────────────────────────
	//
	// Two, not one, because a cluster asks two different questions.
	// Liveness: "is this process wedged and in need of a restart?"
	// Readiness: "should traffic be sent here yet?"
	// One endpoint answering both is why a rolling update serves 502s for a few
	// seconds -- a container is alive long before it can reach its database.

	app.get('/health', (req, res) => res.json({ status: 'ok' }));

	app.get('/ready', async (req, res) => {
		try {
			await store.ready();
			res.json({ ready: true });
		} catch {
			res.status(503).json({ ready: false });
		}
	});

	// What this build is and where it thinks its data lives. The deck uses it to
	// show, from outside, that an image did not change when its configuration
	// did -- same tag, different answer here.
	app.get('/api/config', (req, res) => {
		res.json({
			version: process.env.APP_VERSION ?? 'dev',
			env: process.env.NODE_ENV ?? 'development',
			store: store.kind,
			// Which copy answered. On one machine it is noise; on a cluster with
			// several replicas it is the only way to see that the address in
			// front of them is doing its job.
			instance: hostname(),
			// NEVER the value. A config endpoint that prints its own secrets is
			// how a token ends up in a screenshot, and this one is on a slide.
			adminTokenSet: Boolean(process.env.ADMIN_TOKEN)
		});
	});

	// ── postcards ───────────────────────────────────────────────────────────

	app.get('/api/postcards', async (req, res, next) => {
		try {
			res.json(await store.all());
		} catch (err) {
			next(err);
		}
	});

	app.post('/api/postcards', async (req, res, next) => {
		const place = String(req.body?.place ?? '').trim();
		const message = String(req.body?.message ?? '').trim();
		if (!place || !message) {
			return res.status(400).json({ error: 'place and message are both required' });
		}
		if (place.length > 120) {
			return res.status(400).json({ error: 'place is at most 120 characters' });
		}
		try {
			res.status(201).json(await store.add({ place, message }));
		} catch (err) {
			next(err);
		}
	});

	// Deleting needs the admin token. It is the one route that does, which makes
	// it the route the secrets lesson is built on: it works on your machine
	// where you exported the variable, and 401s on the server until the unit
	// file hands it over.
	app.delete('/api/postcards/:id', async (req, res, next) => {
		const expected = process.env.ADMIN_TOKEN;
		if (!expected) {
			return res.status(503).json({ error: 'ADMIN_TOKEN is not configured on this server' });
		}
		if (req.get('x-admin-token') !== expected) {
			return res.status(401).json({ error: 'bad or missing x-admin-token' });
		}
		try {
			const gone = await store.remove(req.params.id);
			if (!gone) return res.status(404).json({ error: 'no postcard with that id' });
			res.status(204).end();
		} catch (err) {
			next(err);
		}
	});

	// A known 404, so a deck can show one without inventing a URL.
	app.use((req, res) => res.status(404).json({ error: `no route for ${req.method} ${req.path}` }));

	// Four arguments on purpose: Express decides this is an ERROR handler by
	// counting them. eslint.config.js knows, so no disable comment is needed.
	app.use((err, req, res, next) => {
		console.error(err);
		res.status(500).json({ error: 'something went wrong' });
	});

	return app;
}
