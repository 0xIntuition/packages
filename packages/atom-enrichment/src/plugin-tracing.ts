export interface EnrichmentPluginSpanLike {
	event(name: string, startTime: bigint, attributes?: Record<string, unknown>): void;
}

const NANOS_PER_MILLISECOND = BigInt(1_000_000);
const spansBySignal = new WeakMap<AbortSignal, EnrichmentPluginSpanLike>();

export function registerEnrichmentPluginSpan(
	signal: AbortSignal,
	span: EnrichmentPluginSpanLike | undefined
): () => void {
	if (!span) {
		return () => undefined;
	}
	spansBySignal.set(signal, span);
	return () => spansBySignal.delete(signal);
}

export function recordEnrichmentPluginRetry(
	signal: AbortSignal,
	input: { attempt: number; reason: string }
): void {
	const span = spansBySignal.get(signal);
	if (!span) {
		return;
	}

	recordEnrichmentPluginSpanEvent(span, 'enrichment.plugin.retry', {
		'retry.attempt': input.attempt,
		'retry.reason': input.reason,
	});
}

export function recordEnrichmentPluginSpanEvent(
	span: EnrichmentPluginSpanLike | undefined,
	name: string,
	attributes: Record<string, unknown> = {}
): void {
	if (!span) {
		return;
	}
	span.event(name, BigInt(Date.now()) * NANOS_PER_MILLISECOND, attributes);
}
