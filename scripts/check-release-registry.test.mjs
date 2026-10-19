import assert from 'node:assert/strict';
import test from 'node:test';
import { checkReleaseRegistry } from './check-release-registry.mjs';

const manifests = new Map([
	['base', { name: '@0xintuition/base', version: '1.0.0', publishConfig: { tag: 'alpha' } }],
	[
		'app',
		{
			name: '@0xintuition/app',
			version: '1.0.1',
			publishConfig: { tag: 'alpha' },
			dependencies: { '@0xintuition/base': '1.0.0' },
		},
	],
]);
const app = { directory: 'app', version: '1.0.1', tag: 'alpha' };
const plan = { packages: [app] };
const response = (status, body) => ({ ok: status === 200, status, json: async () => body });

test('accepts a new version with an already-published internal dependency', async () => {
	const fetch = async (url) =>
		response(200, { versions: url.endsWith('base') ? { '1.0.0': {} } : {} });
	assert.deepEqual(await checkReleaseRegistry({ manifests, plan, fetch }), [
		'@0xintuition/app@1.0.1 (alpha)',
	]);
});

test('rejects a version already in npm', async () => {
	const fetch = async () => response(200, { versions: { '1.0.0': {}, '1.0.1': {} } });
	await assert.rejects(checkReleaseRegistry({ manifests, plan, fetch }), /already published/);
});

test('rejects an omitted unpublished dependency', async () => {
	await assert.rejects(
		checkReleaseRegistry({ manifests, plan, fetch: async () => response(404) }),
		/neither published nor in this release/
	);
});

test('accepts new packages together in dependency order', async () => {
	const plan = { packages: [{ directory: 'base', version: '1.0.0', tag: 'alpha' }, app] };
	assert.equal(
		(await checkReleaseRegistry({ manifests, plan, fetch: async () => response(404) })).length,
		2
	);
});

for (const status of [401, 403, 429, 500]) {
	test(`fails closed on registry HTTP ${status}`, async () => {
		await assert.rejects(
			checkReleaseRegistry({ manifests, plan, fetch: async () => response(status) }),
			new RegExp(`HTTP ${status}`)
		);
	});
}

test('rejects version/tag drift and out-of-order publication', async () => {
	const plan = {
		packages: [
			{ ...app, version: '2.0.0', tag: 'latest' },
			{ directory: 'base', version: '1.0.0', tag: 'alpha' },
		],
	};
	await assert.rejects(
		checkReleaseRegistry({ manifests, plan, fetch: async () => response(404) }),
		/version differs[\s\S]*tag differs[\s\S]*out of publish order/
	);
});
