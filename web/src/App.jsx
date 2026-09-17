import { useEffect, useState } from 'react';
import { listPostcards, sendPostcard, removePostcard, getConfig } from './api.js';

/**
 * The whole front end. One component on purpose: this course is about getting
 * the thing deployed, and a component tree would be a second thing to explain.
 *
 * The footer is the part that earns its place in a deployment course -- it
 * prints what /api/config says, so the running page tells you which build it is
 * and where its postcards are kept. On a cluster with two replicas that footer
 * is how you see you are being served by a different pod.
 */
export default function App() {
	const [cards, setCards] = useState([]);
	const [config, setConfig] = useState(null);
	const [error, setError] = useState('');
	const [place, setPlace] = useState('');
	const [message, setMessage] = useState('');
	const [token, setToken] = useState('');

	const refresh = () =>
		listPostcards()
			.then(setCards)
			.catch((e) => setError(e.message));

	useEffect(() => {
		refresh();
		getConfig().then(setConfig).catch(() => {});
	}, []);

	async function onSend(event) {
		event.preventDefault();
		setError('');
		try {
			await sendPostcard(place.trim(), message.trim());
			setPlace('');
			setMessage('');
			refresh();
		} catch (e) {
			setError(e.message);
		}
	}

	async function onRemove(id) {
		setError('');
		try {
			await removePostcard(id, token);
			refresh();
		} catch (e) {
			setError(e.message);
		}
	}

	return (
		<main className="wrap">
			<header className="head">
				<h1>Postcard</h1>
				<p className="sub">{cards.length} sent</p>
			</header>

			<form className="send" onSubmit={onSend}>
				<input
					className="place"
					placeholder="Where from?"
					value={place}
					maxLength={120}
					onChange={(e) => setPlace(e.target.value)}
				/>
				<input
					className="message"
					placeholder="Say something."
					value={message}
					onChange={(e) => setMessage(e.target.value)}
				/>
				<button type="submit" disabled={!place.trim() || !message.trim()}>
					Send
				</button>
			</form>

			{error && <p className="error">{error}</p>}

			<ul className="cards">
				{cards.map((c) => (
					<li key={c.id} className="card">
						<div>
							<strong>{c.place}</strong>
							<p>{c.message}</p>
							<time>{new Date(c.sentAt).toLocaleString()}</time>
						</div>
						<button className="remove" onClick={() => onRemove(c.id)} title="Needs the admin token">
							Remove
						</button>
					</li>
				))}
				{cards.length === 0 && <li className="empty">No postcards yet. Send one.</li>}
			</ul>

			<footer className="foot">
				<input
					className="token"
					type="password"
					placeholder="admin token (to remove)"
					value={token}
					onChange={(e) => setToken(e.target.value)}
				/>
				{config && (
					<span className="build">
						v{config.version} · {config.env} · postcards in <strong>{config.store}</strong>
					</span>
				)}
			</footer>
		</main>
	);
}
