/**
 * Every call the front end makes. One file, so "where does this talk to?" has
 * one answer -- which matters the week the API moves to a cluster.
 */
const base = import.meta.env.VITE_API_URL ?? '';

async function json(res) {
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error || `${res.status} ${res.statusText}`);
	}
	return res.status === 204 ? null : res.json();
}

export const listPostcards = () => fetch(`${base}/api/postcards`).then(json);

export const sendPostcard = (place, message) =>
	fetch(`${base}/api/postcards`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ place, message })
	}).then(json);

export const removePostcard = (id, token) =>
	fetch(`${base}/api/postcards/${id}`, {
		method: 'DELETE',
		headers: { 'x-admin-token': token }
	}).then(json);

export const getConfig = () => fetch(`${base}/api/config`).then(json);
