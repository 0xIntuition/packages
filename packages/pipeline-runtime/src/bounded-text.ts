export type BoundedTextFailureReason = 'body_limit' | 'body_read_failure';

export type BoundedTextResult =
	| { ok: true; value: string }
	| { ok: false; reason: BoundedTextFailureReason };

type ReadableBody = {
	getReader(): {
		read(): Promise<{ done: boolean; value?: Uint8Array }>;
		cancel(reason?: unknown): Promise<void>;
		releaseLock?(): void;
	};
};

type BoundedTextResponse = {
	body?: ReadableBody | null;
	headers?: { get(name: string): string | null };
};

/** Reads decoded response bytes under one caller-owned deadline/abort signal. */
export async function readBoundedResponseText(
	response: BoundedTextResponse,
	options: { maxBytes: number; signal: AbortSignal }
): Promise<BoundedTextResult> {
	const byteLimit = Math.max(0, Math.floor(options.maxBytes));
	const contentLength = response.headers?.get('content-length');
	if (contentLength) {
		const parsedLength = Number(contentLength);
		if (Number.isFinite(parsedLength) && parsedLength > byteLimit) {
			await cancelBody(response.body, options.signal, 'Response exceeded size limit');
			return { ok: false, reason: 'body_limit' };
		}
	}
	if (!response.body) {
		return { ok: false, reason: 'body_read_failure' };
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder('utf-8', { fatal: false });
	const parts: string[] = [];
	let bytesRead = 0;
	try {
		while (true) {
			const chunk = await waitForOperation(reader.read(), options.signal);
			if (chunk.done) {
				parts.push(decoder.decode());
				return { ok: true, value: parts.join('') };
			}
			if (!chunk.value) {
				continue;
			}
			bytesRead += chunk.value.byteLength;
			if (bytesRead > byteLimit) {
				await cancelReader(reader, options.signal, 'Response exceeded size limit');
				return { ok: false, reason: 'body_limit' };
			}
			parts.push(decoder.decode(chunk.value, { stream: true }));
		}
	} catch {
		await cancelReader(reader, options.signal, 'Response read failed');
		if (options.signal.aborted) {
			throw options.signal.reason instanceof Error
				? options.signal.reason
				: new Error('Response read aborted');
		}
		return { ok: false, reason: 'body_read_failure' };
	} finally {
		reader.releaseLock?.();
	}
}

async function cancelBody(
	body: ReadableBody | null | undefined,
	signal: AbortSignal,
	reason: string
): Promise<void> {
	if (!body) {
		return;
	}
	const reader = body.getReader();
	try {
		await cancelReader(reader, signal, reason);
	} finally {
		reader.releaseLock?.();
	}
}

async function cancelReader(
	reader: ReturnType<ReadableBody['getReader']>,
	signal: AbortSignal,
	reason: string
): Promise<void> {
	try {
		await waitForOperation(reader.cancel(new Error(reason)), signal);
	} catch {
		// Cancellation was issued; the same caller-owned deadline bounds cleanup.
	}
}

async function waitForOperation<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
	if (signal.aborted) {
		throw signal.reason instanceof Error ? signal.reason : new Error('Operation aborted');
	}
	return await new Promise<T>((resolve, reject) => {
		const onAbort = () => {
			reject(signal.reason instanceof Error ? signal.reason : new Error('Operation aborted'));
		};
		signal.addEventListener('abort', onAbort, { once: true });
		operation.then(
			(value) => {
				signal.removeEventListener('abort', onAbort);
				resolve(value);
			},
			(error) => {
				signal.removeEventListener('abort', onAbort);
				reject(error);
			}
		);
	});
}
