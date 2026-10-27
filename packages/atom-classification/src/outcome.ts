import { type Outcome, toOutcome } from '@0xintuition/pipeline-runtime/outcome';
import type { ClassificationEngine, ClassifyOptions } from './engine';
import type { ClassificationRequestInput, ClassificationResult } from './types';

/** Capture boundary validation failures as well as completed classification results. */
export async function classifyOutcome(
	engine: ClassificationEngine,
	input: ClassificationRequestInput,
	options?: ClassifyOptions
): Promise<Outcome<ClassificationResult>> {
	try {
		return toOutcome({ status: 'fulfilled', value: await engine.classify(input, options) });
	} catch (reason) {
		return toOutcome({ status: 'rejected', reason });
	}
}
