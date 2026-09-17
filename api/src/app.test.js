import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createMemoryStore } from './store.js';

/**
 * The routes, driven through a real Express app with no port bound.
 *
 * A fresh store per test: sharing one would make the suite order-dependent, and
 * an order-dependent suite fails in CI on a machine that happens to schedule
 * differently.
 */
let app;
let store;
const TOKEN = 'test-token';

beforeEach(() => {
	store = createMemoryStore({ seed: false });
	app = createApp({ store });
	process.env.ADMIN_TOKEN = TOKEN;
});

afterEach(() => {
	delete process.env.ADMIN_TOKEN;
	delete process.env.APP_VERSION;
});

const post = (body) => request(app).post('/api/postcards').send(body);

describe('probes', () => {
	it('is alive', async () => {
		const res = await request(app).get('/health');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 'ok' });
	});

	it('is ready when the store answers', async () => {
		const res = await request(app).get('/ready');
		expect(res.status).toBe(200);
		expect(res.body.ready).toBe(true);
	});

	it('is NOT ready when the store cannot answer', async () => {
		const broken = { ...store, ready: async () => { throw new Error('no database'); } };
		const res = await request(createApp({ store: broken })).get('/ready');
		expect(res.status).toBe(503);
		expect(res.body.ready).toBe(false);
	});
});

describe('GET /api/config', () => {
	it('reports the build and the store without leaking the token', async () => {
		process.env.APP_VERSION = '1.4.0';
		const res = await request(app).get('/api/config');
		expect(res.status).toBe(200);
		expect(res.body.version).toBe('1.4.0');
		expect(res.body.store).toBe('memory');
		expect(res.body.adminTokenSet).toBe(true);
		// The endpoint is on a slide. It must never print the value.
		expect(JSON.stringify(res.body)).not.toContain(TOKEN);
	});
});

describe('postcards', () => {
	it('starts empty and returns what was added, newest first', async () => {
		expect((await request(app).get('/api/postcards')).body).toEqual([]);

		await post({ place: 'Oslo', message: 'Cold. Bright.' });
		await post({ place: 'Porto', message: 'Warmer.' });

		const res = await request(app).get('/api/postcards');
		expect(res.status).toBe(200);
		expect(res.body.map((c) => c.place)).toEqual(['Porto', 'Oslo']);
		expect(res.body[0]).toHaveProperty('id');
		expect(res.body[0]).toHaveProperty('sentAt');
	});

	it('rejects a postcard with no place or no message', async () => {
		for (const body of [{}, { place: 'Oslo' }, { message: 'hi' }, { place: '  ', message: 'hi' }]) {
			const res = await post(body);
			expect(res.status).toBe(400);
		}
	});

	it('rejects a place longer than the column', async () => {
		const res = await post({ place: 'x'.repeat(121), message: 'hi' });
		expect(res.status).toBe(400);
	});
});

describe('DELETE /api/postcards/:id', () => {
	it('needs the admin token', async () => {
		const { body: made } = await post({ place: 'Oslo', message: 'Cold.' });

		expect((await request(app).delete(`/api/postcards/${made.id}`)).status).toBe(401);
		expect(
			(await request(app).delete(`/api/postcards/${made.id}`).set('x-admin-token', 'wrong')).status
		).toBe(401);

		const ok = await request(app).delete(`/api/postcards/${made.id}`).set('x-admin-token', TOKEN);
		expect(ok.status).toBe(204);
		expect((await request(app).get('/api/postcards')).body).toEqual([]);
	});

	it('404s for an id that is not there', async () => {
		const res = await request(app).delete('/api/postcards/nope').set('x-admin-token', TOKEN);
		expect(res.status).toBe(404);
	});

	it('503s when the server has no token configured at all', async () => {
		delete process.env.ADMIN_TOKEN;
		const res = await request(app).delete('/api/postcards/whatever');
		expect(res.status).toBe(503);
	});
});

describe('unknown routes', () => {
	it('404s as JSON, not as HTML', async () => {
		const res = await request(app).get('/api/nope');
		expect(res.status).toBe(404);
		expect(res.body.error).toContain('/api/nope');
	});
});
