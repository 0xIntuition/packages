import { expect, mock, test } from 'bun:test';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

const requests: Array<{ url: URL; options: Record<string, unknown>; address: string }> = [];
// mock-module-exempt: exercise the production pinned HTTP adapter without any socket.
mock.module('node:https', () => ({
	request: (url: URL, options: Record<string, unknown>, callback: (response: Readable) => void) => {
		const request = new EventEmitter();
		Object.assign(request, {
			end: () => {
				let address = '10.0.0.5'; // A second DNS lookup would rebind privately.
				const lookup = options.lookup as (
					host: string,
					options: { all: boolean },
					cb: (...args: unknown[]) => void
				) => void;
				lookup(url.hostname, { all: false }, (error, resolved, family) => {
					expect(error).toBeNull();
					expect(family).toBe(4);
					address = String(resolved);
				});
				lookup(url.hostname, { all: true }, (error, resolved) => {
					expect(error).toBeNull();
					expect(resolved).toEqual([{ address: '8.8.8.8', family: 4 }]);
				});
				lookup('other.example', { all: false }, (error) => {
					expect(error).toBeInstanceOf(Error);
				});
				requests.push({ url, options, address });
				const incoming = Object.assign(
					Readable.from([
						Buffer.from(address === '8.8.8.8' ? '{"public":true}' : '{"private":true}'),
					]),
					{
						rawHeaders: ['content-type', 'application/json'],
						statusCode: 200,
					}
				);
				callback(incoming);
			},
		});
		return request;
	},
}));

const { inspectRemote, fetchWithPinnedNodeTransport } = await import('../src/remote');
const { DEFAULT_FETCH_POLICY } = await import('../src/types');

test('production adapter uses only the admitted DNS address and preserves Host and SNI', async () => {
	const output = await inspectRemote(
		{ kind: 'url', canonicalUrl: 'https://rebind.example/' } as never,
		DEFAULT_FETCH_POLICY,
		{ resolve: async () => [{ address: '8.8.8.8', family: 4 }] }
	);
	expect(output?.inspection.outcome).toBe('success');
	const last = requests.at(-1)!;
	expect(last.address).toBe('8.8.8.8');
	expect(last.url.hostname).toBe('rebind.example');
	expect(last.options.headers).toMatchObject({ host: 'rebind.example' });
	expect(last.options.servername).toBe('rebind.example');
	expect(last.options.agent).toBe(false);
});

test('production adapter fails closed without a matching validated connection', async () => {
	for (const connection of [
		undefined,
		{ hostname: 'other.example', address: '8.8.8.8', family: 4 },
	]) {
		await expect(
			fetchWithPinnedNodeTransport('https://rebind.example/', { connection })
		).rejects.toThrow('validated connection');
	}
});
