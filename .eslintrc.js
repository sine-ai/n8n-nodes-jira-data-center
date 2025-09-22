module.exports = {
	root: true,
	env: {
		browser: false,
		es6: true,
		node: true,
	},
	parserOptions: {
		ecmaVersion: 2019,
		sourceType: 'module',
	},
	plugins: ['n8n-nodes-base'],
	extends: [
		'eslint:recommended',
		'plugin:n8n-nodes-base/community',
	],
	rules: {
		'n8n-nodes-base/community-package-json-name-still-default': 'error',
		'n8n-nodes-base/community-package-json-author-name-still-default': 'error',
		'n8n-nodes-base/community-package-json-author-email-still-default': 'error',
		'no-unused-vars': 'warn',
		'no-console': 'warn',
	},
	ignorePatterns: ['dist/**', 'node_modules/**'],
	overrides: [
		{
			files: ['*.ts'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: './tsconfig.json',
			},
		},
	],
};
