// Flat config, which is the only kind ESLint 9 reads.
//
// `npm run lint` is a step in week 9's pipeline and it exits 2 without this
// file -- not 1, which matters, because 2 is "the tool could not run" and 1 is
// "the tool ran and found something". A pipeline that cannot tell those apart
// reports a broken config as a code problem.
import js from '@eslint/js';

export default [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2023,
			sourceType: 'module',
			globals: { process: 'readonly', console: 'readonly', URL: 'readonly' }
		},
		rules: {
			// Express decides a handler is an ERROR handler by counting its
			// arguments, so `(err, req, res, next)` must keep all four even
			// though it uses three. Without this the app's own error handler is
			// a lint failure.
			'no-unused-vars': ['error', { argsIgnorePattern: '^(req|res|next|err)$' }]
		}
	},
	{
		files: ['**/*.test.js'],
		languageOptions: { globals: { describe: 'readonly', it: 'readonly', expect: 'readonly',
			beforeEach: 'readonly', afterEach: 'readonly', vi: 'readonly' } }
	}
];
