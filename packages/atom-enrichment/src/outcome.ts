import { type Outcome, toOutcome } from '@0xintuition/pipeline-runtime/outcome';
import type {
	EnrichmentEngine,
	EnrichmentPipelineResult,
	EnrichmentRequestInput,
	EnrichRunOptions,
} from './types';

/** Capture boundary validation failures as well as completed pipeline results. */
export async function enrichOutcome(
	engine: EnrichmentEngine,
	request: EnrichmentRequestInput,
	options?: EnrichRunOptions
): Promise<Outcome<EnrichmentPipelineResult>> {
	try {
		return toOutcome({ status: 'fulfilled', value: await engine.enrich(request, options) });
	} catch (reason) {
		return toOutcome({ status: 'rejected', reason });
	}
}
