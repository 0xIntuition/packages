import { CLASSIFICATION_SPECS as GENERATED_CLASSIFICATION_SPECS } from './generated/index.js';
import type { ClassificationCategory, ClassificationSpec } from './types.js';

const CLASSIFICATION_SPECS_FROZEN = deepFreeze(
	GENERATED_CLASSIFICATION_SPECS.map((spec) => ({
		...spec,
		fields: [...spec.fields],
	}))
) as readonly ClassificationSpec[];

const CLASSIFICATION_MAP = new Map(
	CLASSIFICATION_SPECS_FROZEN.map((spec) => [spec.slug, spec] as const)
);

export const CLASSIFICATION_SPECS = CLASSIFICATION_SPECS_FROZEN;
export const CLASSIFICATION_SLUGS = Object.freeze(
	CLASSIFICATION_SPECS_FROZEN.map((spec) => spec.slug)
) as readonly string[];

export function getClassification(slug: string): ClassificationSpec | undefined {
	return CLASSIFICATION_MAP.get(slug);
}

export function hasClassification(slug: string): boolean {
	return CLASSIFICATION_MAP.has(slug);
}

export function getClassificationsByCategory(
	category: ClassificationCategory
): ClassificationSpec[] {
	return CLASSIFICATION_SPECS_FROZEN.filter((spec) => spec.category === category);
}

function deepFreeze<T>(value: T): T {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		Object.freeze(value);

		for (const nestedValue of Object.values(value as Record<string, unknown>)) {
			deepFreeze(nestedValue);
		}
	}

	return value;
}
