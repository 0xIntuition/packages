import { expect, it } from 'bun:test';
import { lookup } from 'node:dns/promises';
import { existsSync } from 'node:fs';
import { Socket } from 'node:net';

it('loads the offline DNS and transport boundary through the package test config', async () => {
	// Fail before touching DNS/transport if the safety net is not registered.
	expect(existsSync(new URL('../bunfig.toml', import.meta.url))).toBe(true);
	expect(await lookup('fixture.invalid', { all: true })).toEqual([
		{ address: '8.8.8.8', family: 4 },
	]);
	await expect(fetch('https://fixture.invalid/')).rejects.toThrow(
		'Network disabled for lane verification'
	);
	expect(() => Bun.serve({ fetch: () => new Response('unexpected') })).toThrow(
		'Network listeners disabled for lane verification'
	);
	expect(() => Bun.connect({ hostname: 'fixture.invalid', port: 443, socket: {} })).toThrow(
		'Network connections disabled for lane verification'
	);
	expect(() => new Socket().connect(443, 'fixture.invalid')).toThrow(
		'Network sockets disabled for lane verification'
	);
});
