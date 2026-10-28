import { mock } from 'bun:test';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

/** Feed fixtures through the production HTTP adapter without opening sockets. */
export function installFixtureTransport(fixture: (url: URL) => Promise<Response>): void {
	// mock-module-exempt: exercise the pinned adapter with in-memory IncomingMessages.
	mock.module('node:http', () => ({
		request: (
			url: URL,
			options: { signal?: AbortSignal },
			callback: (response: Readable) => void
		) => {
			const request = new EventEmitter();
			let incoming: Readable | undefined;
			const abort = () => {
				const error = new DOMException('Aborted', 'AbortError');
				incoming?.destroy(error);
				request.emit('error', error);
			};
			Object.assign(request, {
				end: () => {
					options.signal?.addEventListener('abort', abort, { once: true });
					if (options.signal?.aborted) {
						abort();
						return;
					}
					void fixture(url)
						.then((response) => {
							if (options.signal?.aborted) {
								void response.body?.cancel().catch(() => undefined);
								return;
							}
							incoming = Object.assign(
								response.body
									? Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])
									: Readable.from([]),
								{ rawHeaders: [...response.headers].flat(), statusCode: response.status }
							);
							incoming.once('close', () => options.signal?.removeEventListener('abort', abort));
							callback(incoming);
						})
						.catch((error: unknown) => request.emit('error', error));
				},
			});
			return request;
		},
	}));
}
