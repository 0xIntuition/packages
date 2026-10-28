/**
 * The error of the shared HTML page fetch (opengraph's), normalised: a code, the HTTP status and
 * Retry-After of a failed response, and the raw error it wraps. Lives in `__shared__` because the
 * engine, opengraph and microdata all read it.
 */
export class OpenGraphFetchError extends Error {
	code: string;
	httpStatus: number | undefined;
	retryAfterMs: number | undefined;
	retryable: boolean;
	/** The raw error this one normalizes, for a consumer that reports transport errors as they are. */
	readonly originalError: unknown;

	constructor(input: {
		code: string;
		httpStatus?: number;
		message: string;
		originalError?: unknown;
		retryAfterMs?: number;
		retryable: boolean;
	}) {
		super(input.message);
		this.originalError = input.originalError;
		this.name = 'OpenGraphFetchError';
		this.code = input.code;
		this.httpStatus = input.httpStatus;
		this.retryAfterMs = input.retryAfterMs;
		this.retryable = input.retryable;
	}
}

/** A failed HTTP response of the page fetch (`http_<status>`), which always carries its status. */
export function isOpenGraphHttpError(
	error: unknown
): error is OpenGraphFetchError & { httpStatus: number } {
	return (
		error instanceof OpenGraphFetchError &&
		error.httpStatus !== undefined &&
		error.code.startsWith('http_')
	);
}
