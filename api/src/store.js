import { randomUUID } from 'node:crypto';

/**
 * Where the postcards live — and the whole point is that the app does not care.
 *
 * WITHOUT `DATABASE_URL` the store is an array in this process. WITH it, the
 * same five methods run against MySQL. Nothing else in the application changes:
 * `app.js` calls `store.all()` either way and has never heard of a database.
 *
 * THAT IS A LESSON, NOT A CONVENIENCE. Week 4 deploys this to a machine with no
 * database and it works — until the process restarts and every postcard is
 * gone. Week 5 installs MySQL, sets one environment variable, and the postcards
 * survive a reboot, with not one line of application code edited. A deck slide
 * is titled exactly that: "Nothing in the code changed."
 *
 * It is also why two replicas behind one Service disagree in week 7 if the
 * database is left out: each pod has its own array.
 */

const SEEDS = [
	{ place: 'Reykjavík', message: 'Rained sideways for four days. Would return.' },
	{ place: 'Lisbon', message: 'Ate a custard tart on every tram stop. No regrets.' },
	{ place: 'Banff', message: 'The lake really is that colour. Nobody believes the photo.' }
];

/** The shape every store returns, so the API never branches on which one it is. */
const card = (row) => ({
	id: row.id,
	place: row.place,
	message: row.message,
	sentAt: row.sentAt instanceof Date ? row.sentAt.toISOString() : row.sentAt
});

// ── in memory ───────────────────────────────────────────────────────────────

export function createMemoryStore({ seed = true } = {}) {
	let rows = seed
		? SEEDS.map((s, i) => ({
				id: randomUUID(),
				...s,
				sentAt: new Date(Date.now() - (SEEDS.length - i) * 3600_000).toISOString()
			}))
		: [];

	return {
		kind: 'memory',
		async ready() {
			return true;
		},
		async all() {
			return rows.map(card);
		},
		async add({ place, message }) {
			const row = { id: randomUUID(), place, message, sentAt: new Date().toISOString() };
			rows = [row, ...rows];
			return card(row);
		},
		async remove(id) {
			const before = rows.length;
			rows = rows.filter((r) => r.id !== id);
			return rows.length < before;
		},
		async close() {}
	};
}

// ── MySQL ───────────────────────────────────────────────────────────────────

export async function createMysqlStore(url) {
	// Imported here rather than at the top so a machine with no database and no
	// DATABASE_URL never loads the driver at all. Week 4's VM is exactly that
	// machine.
	const mysql = await import('mysql2/promise');
	const pool = mysql.createPool(url);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS postcards (
			id       CHAR(36)     NOT NULL PRIMARY KEY,
			place    VARCHAR(120) NOT NULL,
			message  TEXT         NOT NULL,
			sentAt   DATETIME     NOT NULL
		)
	`);

	return {
		kind: 'mysql',
		async ready() {
			await pool.query('SELECT 1');
			return true;
		},
		async all() {
			const [rows] = await pool.query('SELECT * FROM postcards ORDER BY sentAt DESC');
			return rows.map(card);
		},
		async add({ place, message }) {
			const row = { id: randomUUID(), place, message, sentAt: new Date() };
			await pool.query('INSERT INTO postcards SET ?', [row]);
			return card(row);
		},
		async remove(id) {
			const [res] = await pool.query('DELETE FROM postcards WHERE id = ?', [id]);
			return res.affectedRows > 0;
		},
		async close() {
			await pool.end();
		}
	};
}

/**
 * One environment variable decides. This is the only place that reads it.
 */
export async function createStore({ url = process.env.DATABASE_URL } = {}) {
	return url ? createMysqlStore(url) : createMemoryStore();
}
