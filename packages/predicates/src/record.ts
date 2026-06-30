import type { PredicateRecord, PredicateSpec } from './types.js';

export function definePredicateRecord<const TSpec extends PredicateSpec>(
	spec: TSpec
): PredicateRecord<TSpec> {
	return {
		key: spec.key,
		name: spec.name,
		description: spec.description,
		marketPattern: spec.marketPattern,
		conjugates: spec.conjugates,
		category: spec.category,
		status: spec.status,
		isTransitive: spec.isTransitive ?? false,
		isSymmetric: spec.isSymmetric ?? false,
		isHierarchical: spec.isHierarchical ?? false,
		...(spec.thirdPerson ? { thirdPerson: spec.thirdPerson } : {}),
		...(spec.examples ? { examples: spec.examples } : {}),
		...(spec.inversePredicate ? { inversePredicate: spec.inversePredicate } : {}),
		...(spec.behavior ? { behavior: spec.behavior } : {}),
	};
}
