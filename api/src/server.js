import { createApp } from './app.js';
import { createStore } from './store.js';

/**
 * The only file that listens.
 *
 * PORT comes from the environment because nothing else can: on a laptop it is
 * 8080, in a container it is whatever the image is run with, on a cluster it is
 * whatever the manifest says. Hard-coding it is the first thing that breaks
 * when the app leaves the machine it was written on.
 */
const port = Number(process.env.PORT) || 8080;

// 0.0.0.0, not localhost. Inside a container, localhost IS the container -- a
// server bound to it is unreachable from the host, from a Service and from
// anywhere else, while looking perfectly healthy in its own logs.
const host = process.env.HOST || '0.0.0.0';

const store = await createStore();
console.log(`postcard-api storing postcards in: ${store.kind}`);

const server = createApp({ store }).listen(port, host, () => {
	console.log(`postcard-api listening on http://${host}:${port}`);
});

// A cluster sends SIGTERM and then waits before SIGKILL. A process that ignores
// it is killed mid-request on every rolling update, and systemd's Restart=always
// will do the same on a plain VM.
for (const signal of ['SIGTERM', 'SIGINT']) {
	process.on(signal, () => {
		console.log(`${signal} received, shutting down`);
		server.close(async () => {
			await store.close();
			process.exit(0);
		});
	});
}
