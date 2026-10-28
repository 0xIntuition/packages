// Package test safety net: inject DNS and forbid real transport via bunfig.toml.
import { mock } from 'bun:test';
import { Socket } from 'node:net';

mock.module('node:dns/promises', () => ({
	lookup: async () => [{ address: '8.8.8.8', family: 4 }],
}));
globalThis.fetch = Object.assign(
	async () => {
		throw new Error('Network disabled for lane verification');
	},
	{ preconnect: () => undefined }
) as typeof fetch;
Bun.serve = (() => {
	throw new Error('Network listeners disabled for lane verification');
}) as typeof Bun.serve;
Bun.connect = (() => {
	throw new Error('Network connections disabled for lane verification');
}) as typeof Bun.connect;

Socket.prototype.connect = (() => {
	throw new Error('Network sockets disabled for lane verification');
}) as typeof Socket.prototype.connect;
