/** Default cooldown used when an upstream Retry-After hint is unusable. */
export const RETRY_AFTER_DEFAULT_MS = 30_000;

/** Maximum accepted Retry-After duration: 15 minutes. */
export const RETRY_AFTER_MAX_MS = 15 * 60 * 1_000;

export function parseRetryAfterMs(
	value: string | null | undefined,
	nowMs = Date.now()
): number | undefined {
	if (value === null || value === undefined) {
		return undefined;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return RETRY_AFTER_DEFAULT_MS;
	}

	const seconds = Number(trimmed);
	if (Number.isFinite(seconds)) {
		return normalizeRetryAfterMs(seconds * 1_000);
	}

	const retryAtMs = Date.parse(trimmed);
	return Number.isNaN(retryAtMs)
		? RETRY_AFTER_DEFAULT_MS
		: normalizeRetryAfterMs(retryAtMs - nowMs);
}

export function normalizeRetryAfterMs(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return RETRY_AFTER_DEFAULT_MS;
	}

	const durationMs = Math.round(value);
	return durationMs > 0 && durationMs <= RETRY_AFTER_MAX_MS ? durationMs : RETRY_AFTER_DEFAULT_MS;
}
