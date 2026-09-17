import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `/api` is proxied in development so the browser only ever talks to one
 * origin. In production nginx does the same job -- see the week-6 branch.
 *
 * VITE_API_URL exists for the weeks where the API is somewhere else entirely:
 * a Service inside a cluster, or a Cloud Run URL. It is read at BUILD time, not
 * at run time, which is the thing that surprises people -- rebuilding the image
 * is how the front end learns a new API address.
 */
export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		proxy: { '/api': { target: process.env.VITE_API_URL || 'http://localhost:8080' } }
	}
});
