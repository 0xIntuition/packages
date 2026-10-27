import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { pipeline, Readable } from 'node:stream';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import { analyzeStructuredDocument } from './structured.js';
import type {
	ParseResult,
	ParseWarning,
	RemoteContentKind,
	RemoteInspection,
	ResolvedFetchPolicy,
	StructuredDocumentCandidate,
} from './types.js';

const runtimeFetch = globalThis.fetch;

type ValidatedConnection = { hostname: string; address: string; family: number };
type PinnedRequestInit = RequestInit & { connection?: ValidatedConnection };

export type RemoteFetchOptions = {
	fetcher?: (input: string, init?: PinnedRequestInit) => Promise<Response>;
	resolve?: (hostname: string) => Promise<readonly { address: string; family: number }[]>;
};

export async function inspectRemote(
	result: ParseResult,
	policy: ResolvedFetchPolicy,
	options: RemoteFetchOptions = {}
): Promise<
	| {
			inspection: RemoteInspection;
			warnings: ParseWarning[];
			structuredDocument?: StructuredDocumentCandidate;
	  }
	| undefined
> {
	const target = resolveRemoteTarget(result, policy);
	if (!target) return undefined;

	if ('warning' in target) {
		return {
			inspection: {
				attempted: false,
				outcome: 'skipped',
				finalUrl: undefined,
				statusCode: undefined,
				contentType: undefined,
				contentLength: undefined,
				redirectCount: 0,
				subtype: undefined,
				reason: target.warning.message,
			},
			warnings: [target.warning],
		};
	}

	try {
		return await fetchWithRedirects(
			target.url,
			target.timeoutMs,
			policy,
			result.kind === 'ipfs' ? 'resolved_ipfs' : 'resolved_url',
			options
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (err instanceof RemotePolicyDeniedError) {
			return {
				inspection: {
					attempted: true,
					outcome: 'denied',
					finalUrl: undefined,
					statusCode: undefined,
					contentType: undefined,
					contentLength: undefined,
					redirectCount: 0,
					subtype: undefined,
					reason: message,
				},
				warnings: [{ code: 'REMOTE_FETCH_DENIED', message }],
			};
		}
		throw err;
	}
}

type RemoteTarget = { url: string; timeoutMs: number } | { warning: ParseWarning };

function resolveRemoteTarget(
	result: ParseResult,
	policy: ResolvedFetchPolicy
): RemoteTarget | undefined {
	switch (result.kind) {
		case 'url':
			return { url: result.canonicalUrl, timeoutMs: policy.requestTimeoutMs };
		case 'ipfs': {
			const gatewayUrl = result.gatewayUrl;
			if (!gatewayUrl) {
				return {
					warning: {
						code: 'REMOTE_FETCH_SKIPPED_NO_IPFS_GATEWAY',
						message: 'remote inspection skipped because no IPFS gateway is configured',
					},
				};
			}
			return { url: gatewayUrl, timeoutMs: policy.ipfsRequestTimeoutMs };
		}
		default:
			return undefined;
	}
}

class RemotePolicyDeniedError extends Error {}
class RemoteResolutionError extends Error {}

async function fetchWithRedirects(
	initialUrl: string,
	timeoutMs: number,
	policy: ResolvedFetchPolicy,
	source: 'resolved_url' | 'resolved_ipfs',
	options: RemoteFetchOptions
): Promise<{
	inspection: RemoteInspection;
	warnings: ParseWarning[];
	structuredDocument?: StructuredDocumentCandidate;
}> {
	let currentUrl = initialUrl;
	let redirectCount = 0;

	while (true) {
		let response: Response | undefined;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const connection = await waitForOperation(
				validateTarget(currentUrl, policy, options),
				controller.signal
			);
			const transport =
				!options.fetcher || options.fetcher === runtimeFetch
					? fetchWithPinnedNodeTransport
					: options.fetcher;
			response = await waitForOperation(
				transport(currentUrl, {
					redirect: 'manual',
					signal: controller.signal,
					connection,
				}),
				controller.signal
			);

			if (response.status >= 300 && response.status < 400) {
				if (redirectCount >= policy.maxRedirects) {
					return {
						inspection: {
							attempted: true,
							outcome: 'redirect_limit_exceeded',
							finalUrl: currentUrl,
							statusCode: response.status,
							contentType: undefined,
							contentLength: undefined,
							redirectCount,
							subtype: undefined,
							reason: 'redirect limit exceeded',
						},
						warnings: [
							{
								code: 'REMOTE_FETCH_REDIRECT_LIMIT',
								message: `remote inspection exceeded the redirect limit for ${currentUrl}`,
							},
						],
					};
				}

				const location = response.headers.get('location');
				if (!location) {
					return {
						inspection: {
							attempted: true,
							outcome: 'error',
							finalUrl: currentUrl,
							statusCode: response.status,
							contentType: undefined,
							contentLength: undefined,
							redirectCount,
							subtype: undefined,
							reason: 'redirect response missing Location header',
						},
						warnings: [
							{
								code: 'REMOTE_FETCH_REDIRECT_INVALID',
								message: 'remote inspection received a redirect without a Location header',
							},
						],
					};
				}

				currentUrl = new URL(location, currentUrl).href;
				redirectCount++;
				continue;
			}

			return await inspectResponse(
				currentUrl,
				redirectCount,
				response,
				policy,
				source,
				controller.signal
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (err instanceof RemotePolicyDeniedError) throw err;
			if (
				!(err instanceof RemoteResolutionError) &&
				((err instanceof DOMException && err.name === 'AbortError') || message.includes('abort'))
			) {
				return {
					inspection: {
						attempted: true,
						outcome: 'timeout',
						finalUrl: currentUrl,
						statusCode: undefined,
						contentType: undefined,
						contentLength: undefined,
						redirectCount,
						subtype: undefined,
						reason: 'remote request timed out',
					},
					warnings: [
						{
							code: 'REMOTE_FETCH_TIMEOUT',
							message: `remote inspection timed out for ${currentUrl}`,
						},
					],
				};
			}
			return {
				inspection: {
					attempted: true,
					outcome: 'error',
					finalUrl: currentUrl,
					statusCode: undefined,
					contentType: undefined,
					contentLength: undefined,
					redirectCount,
					subtype: undefined,
					reason: message,
				},
				warnings: [
					{
						code: 'REMOTE_FETCH_ERROR',
						message: `remote inspection failed for ${currentUrl}: ${message}`,
					},
				],
			};
		} finally {
			clearTimeout(timeoutId);
			controller.abort();
			if (response?.body && !response.body.locked) {
				// Cleanup must not await a custom stream's cancellation or replace the result.
				void response.body.cancel().catch(() => undefined);
			}
		}
	}
}

async function validateTarget(
	url: string,
	policy: ResolvedFetchPolicy,
	options: RemoteFetchOptions
): Promise<ValidatedConnection> {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new RemotePolicyDeniedError('remote fetch target is missing a host');
	}
	if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && policy.allowHttp)) {
		throw new RemotePolicyDeniedError('remote fetch scheme is not allowed');
	}
	const hostname = normalizeHostname(parsed.hostname);
	if (!hostname) throw new RemotePolicyDeniedError('remote fetch target is missing a host');
	if (!policy.allowPrivateNetworks && ['localhost', '127.0.0.1', '::1'].includes(hostname)) {
		throw new RemotePolicyDeniedError('remote fetch target resolves to localhost');
	}
	const denied = () =>
		new RemotePolicyDeniedError('remote fetch target resolves to a denied IP address');
	if (
		!policy.allowPrivateNetworks &&
		(parsed.username ||
			parsed.password ||
			hostname === 'localhost' ||
			/\.(?:home|internal|intranet|lan|local|localdomain|localhost)$/u.test(hostname))
	)
		throw denied();
	if (isIP(hostname)) {
		if (!policy.allowPrivateNetworks && !isPublicIpAddress(hostname)) throw denied();
		return { hostname, address: hostname, family: isIP(hostname) };
	}
	const resolve =
		options.resolve ??
		(async (host: string) => {
			const { lookup } = await import('node:dns/promises');
			return lookup(host, { all: true, verbatim: true });
		});
	let addresses: Awaited<ReturnType<typeof resolve>>;
	try {
		addresses = await resolve(hostname);
	} catch (error) {
		throw new RemoteResolutionError(error instanceof Error ? error.message : String(error), {
			cause: error,
		});
	}
	if (!addresses.length) throw new RemoteResolutionError('remote fetch DNS returned no addresses');
	if (
		addresses.some(
			(entry) =>
				isIP(entry.address) !== entry.family ||
				(!policy.allowPrivateNetworks && !isPublicIpAddress(entry.address))
		)
	)
		throw denied();
	return { hostname, ...(addresses.find((entry) => entry.family === 4) ?? addresses[0]!) };
}

function normalizeHostname(hostname: string): string {
	return hostname
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/\.+$/u, '');
}

function ipAddressFamily(address: string): 4 | 6 | undefined {
	const normalized = normalizeHostname(address);
	const segments = normalized.split('.');
	if (
		segments.length === 4 &&
		segments.every((segment) => /^\d{1,3}$/u.test(segment) && Number(segment) <= 255)
	) {
		return 4;
	}
	return expandIpv6Address(normalized) ? 6 : undefined;
}

function isPublicIpAddress(address: string): boolean {
	const normalized = normalizeHostname(address);
	if (ipAddressFamily(normalized) === 4) {
		const [first = 0, second = 0, third = 0] = normalized.split('.').map(Number);
		return !(
			first === 0 ||
			first === 10 ||
			first === 127 ||
			(first === 100 && second >= 64 && second <= 127) ||
			(first === 169 && second === 254) ||
			(first === 172 && second >= 16 && second <= 31) ||
			(first === 192 && second === 0 && third === 0) ||
			(first === 192 && second === 0 && third === 2) ||
			(first === 192 && second === 88 && third === 99) ||
			(first === 192 && second === 168) ||
			(first === 198 && (second === 18 || second === 19)) ||
			(first === 198 && second === 51 && third === 100) ||
			(first === 203 && second === 0 && third === 113) ||
			first >= 224
		);
	}
	const ipv6 = expandIpv6Address(normalized);
	if (!ipv6) return false;
	const [first = 0, second = 0] = ipv6;
	return !(
		first < 0x2000 ||
		first > 0x3fff ||
		(first === 0x2001 && second <= 0x01ff) ||
		(first === 0x2001 && second === 0x0db8) ||
		first === 0x2002 ||
		(first === 0x3fff && (second & 0xf000) === 0)
	);
}

function expandIpv6Address(hostname: string): number[] | undefined {
	const compressionIndex = hostname.indexOf('::');
	if (compressionIndex !== -1 && compressionIndex !== hostname.lastIndexOf('::')) return undefined;
	const [left = '', right = ''] = hostname.split('::');
	const leftSegments = left ? left.split(':') : [];
	const rightSegments = right ? right.split(':') : [];
	const missing = 8 - leftSegments.length - rightSegments.length;
	if ((compressionIndex === -1 && missing !== 0) || missing < 0) return undefined;
	const segments = [
		...leftSegments,
		...Array.from({ length: missing }, () => '0'),
		...rightSegments,
	];
	if (segments.length !== 8 || segments.some((segment) => !/^[\da-f]{1,4}$/iu.test(segment))) {
		return undefined;
	}
	return segments.map((segment) => Number.parseInt(segment, 16));
}

async function inspectResponse(
	finalUrl: string,
	redirectCount: number,
	response: Response,
	policy: ResolvedFetchPolicy,
	source: 'resolved_url' | 'resolved_ipfs',
	signal: AbortSignal
): Promise<{
	inspection: RemoteInspection;
	warnings: ParseWarning[];
	structuredDocument?: StructuredDocumentCandidate;
}> {
	const statusCode = response.status;
	const contentType = response.headers.get('content-type') ?? undefined;
	const contentLengthHeader = response.headers.get('content-length');
	const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : undefined;

	if (contentLength !== undefined && contentLength > policy.maxResponseBytes) {
		return {
			inspection: {
				attempted: true,
				outcome: 'oversized',
				finalUrl,
				statusCode,
				contentType,
				contentLength,
				redirectCount,
				subtype: undefined,
				reason: 'response exceeded the configured byte limit',
			},
			warnings: [
				{
					code: 'REMOTE_FETCH_OVERSIZED',
					message: `remote inspection skipped body analysis for ${finalUrl} because the response is too large`,
				},
			],
		};
	}

	let inspectedBytes: Uint8Array;
	let fullBody: Uint8Array;
	try {
		({ inspectedBytes, fullBody } = await readBodyLimited(
			response,
			policy.maxResponseBytes,
			policy.inspectBytes,
			signal
		));
	} catch (err) {
		if (err instanceof OversizedError) {
			return {
				inspection: {
					attempted: true,
					outcome: 'oversized',
					finalUrl,
					statusCode,
					contentType,
					contentLength,
					redirectCount,
					subtype: undefined,
					reason: 'response exceeded the configured byte limit',
				},
				warnings: [
					{
						code: 'REMOTE_FETCH_OVERSIZED',
						message: `remote inspection skipped body analysis for ${finalUrl} because the response is too large`,
					},
				],
			};
		}
		throw err;
	}

	const subtype = classifyRemoteKind(contentType, inspectedBytes);
	const structuredDocument =
		subtype === 'json_document' ? analyzeRemoteStructuredDocument(fullBody, source) : undefined;
	return {
		inspection: {
			attempted: true,
			outcome: 'success',
			finalUrl,
			statusCode,
			contentType,
			contentLength,
			redirectCount,
			subtype,
			reason: `classified remote content as ${subtype}`,
		},
		warnings: [],
		structuredDocument,
	};
}

class OversizedError extends Error {
	constructor() {
		super('oversized');
	}
}

async function readBodyLimited(
	response: Response,
	maxBytes: number,
	inspectBytes: number,
	signal: AbortSignal
): Promise<{ inspectedBytes: Uint8Array; fullBody: Uint8Array }> {
	if (!response.body) {
		return {
			inspectedBytes: new Uint8Array(0),
			fullBody: new Uint8Array(0),
		};
	}

	const reader = response.body.getReader();
	const inspectedChunks: Uint8Array[] = [];
	const allChunks: Uint8Array[] = [];
	let totalBytes = 0;
	let inspectedLength = 0;

	const abort = () => {
		void reader.cancel().catch(() => undefined);
	};
	signal.addEventListener('abort', abort, { once: true });
	try {
		while (true) {
			const { done, value } = await waitForOperation(reader.read(), signal);
			if (done || !value) break;

			totalBytes += value.length;
			if (totalBytes > maxBytes) {
				void reader.cancel().catch(() => undefined);
				throw new OversizedError();
			}

			allChunks.push(value);

			if (inspectedLength < inspectBytes) {
				const remaining = inspectBytes - inspectedLength;
				inspectedChunks.push(value.slice(0, remaining));
				inspectedLength += Math.min(value.length, remaining);
			}
		}

		const inspectedBytes = new Uint8Array(inspectedLength);
		let offset = 0;
		for (const chunk of inspectedChunks) {
			inspectedBytes.set(chunk, offset);
			offset += chunk.length;
		}

		const fullBody = new Uint8Array(totalBytes);
		offset = 0;
		for (const chunk of allChunks) {
			fullBody.set(chunk, offset);
			offset += chunk.length;
		}

		return { inspectedBytes, fullBody };
	} finally {
		signal.removeEventListener('abort', abort);
		reader.releaseLock();
	}
}

export function classifyRemoteKind(
	contentType: string | undefined,
	inspected: Uint8Array
): RemoteContentKind {
	if (contentType) {
		const lowered = contentType.toLowerCase();
		if (lowered.startsWith('text/html')) return 'webpage';
		if (
			lowered.startsWith('application/json') ||
			lowered.includes('+json') ||
			lowered.endsWith('/json')
		) {
			return 'json_document';
		}
		if (lowered.startsWith('image/')) return 'image';
		if (lowered.startsWith('video/')) return 'video';
		if (lowered.startsWith('audio/')) return 'audio';
		if (lowered.startsWith('text/plain') || lowered === 'application/octet-stream') {
			return sniffBody(inspected);
		}
		return 'generic_file';
	}

	return sniffBody(inspected);
}

function sniffBody(inspected: Uint8Array): RemoteContentKind {
	const text = new TextDecoder('utf-8', { fatal: false }).decode(inspected);
	const trimmed = text.trimStart().toLowerCase();
	if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
		return 'webpage';
	}

	try {
		const value = JSON.parse(text);
		if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
			return 'json_document';
		}
	} catch {
		// not json
	}

	if (startsWith(inspected, [0x89, 0x50, 0x4e, 0x47])) return 'image'; // PNG
	if (startsWith(inspected, [0xff, 0xd8, 0xff])) return 'image'; // JPEG
	if (startsWith(inspected, [0x47, 0x49, 0x46, 0x38])) return 'image'; // GIF8

	if (startsWith(inspected, [0x52, 0x49, 0x46, 0x46])) return 'audio'; // RIFF
	if (startsWith(inspected, [0x49, 0x44, 0x33])) return 'audio'; // ID3

	if (containsBytes(inspected, [0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])) {
		return 'video'; // ftypisom
	}

	if (inspected.length === 0) return 'unknown_remote';
	return 'generic_file';
}

function startsWith(data: Uint8Array, prefix: number[]): boolean {
	if (data.length < prefix.length) return false;
	for (let i = 0; i < prefix.length; i++) {
		if (data[i] !== prefix[i]) return false;
	}
	return true;
}

function containsBytes(data: Uint8Array, needle: number[]): boolean {
	if (data.length < needle.length) return false;
	outer: for (let i = 0; i <= data.length - needle.length; i++) {
		for (let j = 0; j < needle.length; j++) {
			if (data[i + j] !== needle[j]) continue outer;
		}
		return true;
	}
	return false;
}

function analyzeRemoteStructuredDocument(
	body: Uint8Array,
	source: 'resolved_url' | 'resolved_ipfs'
): StructuredDocumentCandidate | undefined {
	try {
		const text = new TextDecoder('utf-8', { fatal: false }).decode(body);
		const parsed = JSON.parse(text);
		return analyzeStructuredDocument(parsed, source);
	} catch {
		return undefined;
	}
}

/** Pin DNS lookup while retaining the original Host and HTTPS SNI/certificate name. */
export async function fetchWithPinnedNodeTransport(
	input: string,
	init?: PinnedRequestInit
): Promise<Response> {
	const parsed = new URL(input);
	const connection = init?.connection;
	const hostname = normalizeHostname(parsed.hostname);
	if (!connection || normalizeHostname(connection.hostname) !== hostname) {
		throw new Error('Parser transport requires a validated connection');
	}
	if (init?.body != null && typeof init.body !== 'string') {
		throw new Error('Pinned parser transport does not support this request body');
	}
	const headers = new Headers(init?.headers);
	headers.set('host', parsed.host);
	const request = parsed.protocol === 'https:' ? httpsRequest : httpRequest;
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		throw new Error('Pinned parser transport requires HTTP');
	}
	return await new Promise<Response>((resolve, reject) => {
		const req = request(
			parsed,
			{
				agent: false,
				...(parsed.protocol === 'https:' && !isIP(hostname) ? { servername: hostname } : {}),
				method: init?.method ?? 'GET',
				headers: Object.fromEntries(headers),
				signal: init?.signal ?? undefined,
				lookup: (host, options, callback) => {
					if (normalizeHostname(host) !== hostname) {
						callback(new Error('Unvalidated connection hostname'), '', 0);
						return;
					}
					if (options.all) {
						callback(null, [{ address: connection.address, family: connection.family }]);
					} else {
						callback(null, connection.address, connection.family);
					}
				},
			},
			(incoming) => {
				const responseHeaders = new Headers();
				for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
					responseHeaders.append(incoming.rawHeaders[index]!, incoming.rawHeaders[index + 1]!);
				}
				const status = incoming.statusCode ?? 502;
				let readable: Readable = incoming;
				const hasBody = init?.method !== 'HEAD' && ![204, 205, 304].includes(status);
				const encoding = responseHeaders.get('content-encoding')?.trim().toLowerCase();
				if (hasBody && encoding && encoding !== 'identity') {
					const decoder =
						encoding === 'gzip'
							? createGunzip()
							: encoding === 'deflate'
								? createInflate()
								: encoding === 'br'
									? createBrotliDecompress()
									: undefined;
					if (!decoder) {
						incoming.destroy();
						reject(new Error('Unsupported response content encoding'));
						return;
					}
					pipeline(incoming, decoder, () => undefined);
					readable = decoder;
					responseHeaders.delete('content-encoding');
					responseHeaders.delete('content-length');
				}
				const body = hasBody
					? (Readable.toWeb(readable) as unknown as ReadableStream<Uint8Array>)
					: null;
				if (!body) incoming.resume();
				const response = new Response(body, { status, headers: responseHeaders });
				Object.defineProperty(response, 'url', { value: parsed.href });
				resolve(response);
			}
		);
		req.on('error', reject);
		req.end(init?.body ?? undefined);
	});
}

async function waitForOperation<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
	if (signal.aborted) throw signal.reason;
	return await new Promise<T>((resolve, reject) => {
		const abort = () => reject(signal.reason);
		signal.addEventListener('abort', abort, { once: true });
		operation.then(
			(value) => {
				signal.removeEventListener('abort', abort);
				resolve(value);
			},
			(error: unknown) => {
				signal.removeEventListener('abort', abort);
				reject(error);
			}
		);
	});
}
