import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEmployerAggregateRating = {
	id: 'schema:EmployerAggregateRating',
	name: 'EmployerAggregateRating',
	label: 'EmployerAggregateRating',
	comment: 'An aggregate rating of an Organization related to its role as an employer.',
	subClassOf: ['AggregateRating', 'Rating', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEmployerAggregateRating;
export const EmployerAggregateRating = schemaOrgEmployerAggregateRating;

export default schemaOrgEmployerAggregateRating;
