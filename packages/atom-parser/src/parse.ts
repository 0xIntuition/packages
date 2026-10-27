import { detectLocal } from './detect.js';
import { inspectRemote } from './remote.js';
import {
	DEFAULT_FETCH_POLICY,
	DEFAULT_MAX_INPUT_BYTES,
	ParseError,
	type ParseOptions,
	type ParseResult,
	type ResolvedFetchPolicy,
} from './types.js';

const ASCII_EDGE_WHITESPACE = /^[\t-\r ]+|[\t-\r ]+$/g;

export async function parseAtom(input: string, options?: ParseOptions): Promise<ParseResult> {
	const maxInputBytes = options?.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES;
	const normalizedInput = input.replace(ASCII_EDGE_WHITESPACE, '');

	if (normalizedInput.length === 0) {
		throw new ParseError('EMPTY_INPUT', 'input must not be empty');
	}

	const inputBytes = new TextEncoder().encode(input).byteLength;
	if (inputBytes > maxInputBytes) {
		throw new ParseError(
			'INPUT_TOO_LARGE',
			`input exceeds the configured size limit (${inputBytes} > ${maxInputBytes})`
		);
	}

	const ipfsGatewayBaseUrl = options?.ipfsGatewayBaseUrl;
	const result = detectLocal(input, normalizedInput, ipfsGatewayBaseUrl);
	if (result.kind === 'iid') {
		return result;
	}

	const remoteFetch = options?.remoteFetch !== false;

	if (remoteFetch) {
		const policy = resolveFetchPolicy(options ?? {});
		const remoteResult = await inspectRemote(result, policy);
		if (remoteResult) {
			if (result.kind === 'url' || result.kind === 'ipfs') {
				result.remote = remoteResult.inspection;
				result.subtype = remoteResult.inspection.subtype;
				result.structuredDocument = remoteResult.structuredDocument;
			}
			result.warnings.push(...remoteResult.warnings);
		}
	}

	return result;
}

function resolveFetchPolicy(options: ParseOptions): ResolvedFetchPolicy {
	return {
		allowHttp: options.allowHttp ?? DEFAULT_FETCH_POLICY.allowHttp,
		allowPrivateNetworks: options.allowPrivateNetworks ?? DEFAULT_FETCH_POLICY.allowPrivateNetworks,
		maxRedirects: options.maxRedirects ?? DEFAULT_FETCH_POLICY.maxRedirects,
		connectTimeoutMs: options.connectTimeoutMs ?? DEFAULT_FETCH_POLICY.connectTimeoutMs,
		requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_FETCH_POLICY.requestTimeoutMs,
		ipfsRequestTimeoutMs: options.ipfsRequestTimeoutMs ?? DEFAULT_FETCH_POLICY.ipfsRequestTimeoutMs,
		maxResponseBytes: options.maxResponseBytes ?? DEFAULT_FETCH_POLICY.maxResponseBytes,
		inspectBytes: options.inspectBytes ?? DEFAULT_FETCH_POLICY.inspectBytes,
	};
}
