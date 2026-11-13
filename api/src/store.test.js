import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryStore } from './store.js';

/**
 * The store on its own: no Express, no port, no database.
 *
 * A fresh, empty store before every test, so each test creates exactly what it
 * asserts about and no test can see another's postcards.
 */
let store;

beforeEach(() => {
	store = createMemoryStore({ seed: false });
});

describe('createMemoryStore', () => {
	it('starts empty', async () => {
		expect(await store.all()).toHaveLength(0);
	});

	it('starts with three postcards when seeded', async () => {
		const seeded = createMemoryStore();
		expect(await seeded.all()).toHaveLength(3);
	});

	it('keeps what you add', async () => {
		await store.add({ place: 'Oslo', message: 'Cold. Bright.' });
		expect(await store.all()).toHaveLength(1);
	});

	it('returns the newest first', async () => {
		await store.add({ place: 'Oslo', message: 'Cold. Bright.' });
		await store.add({ place: 'Porto', message: 'Warmer.' });
		const rows = await store.all();
		expect(rows.map((c) => c.place)).toEqual(['Porto', 'Oslo']);
	});

	it('hands back the postcard it made', async () => {
		const row = await store.add({ place: 'Oslo', message: 'Cold. Bright.' });
		expect(row.place).toBe('Oslo');
		expect(row.message).toBe('Cold. Bright.');
		expect(row).toHaveProperty('id');
		expect(row.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it('says true when it removed something', async () => {
		const row = await store.add({ place: 'Oslo', message: 'Cold.' });
		expect(await store.remove(row.id)).toBe(true);
		expect(await store.all()).toHaveLength(0);
	});

	it('says false when nothing was removed', async () => {
		expect(await store.remove('nope')).toBe(false);
	});
});

describe('a store that cannot reach its database', () => {
	it('rejects from ready()', async () => {
		const broken = {
			...store,
			ready: async () => {
				throw new Error('no database');
			}
		};
		await expect(broken.ready()).rejects.toThrow();
	});
});
