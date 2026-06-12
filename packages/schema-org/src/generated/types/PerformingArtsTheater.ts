import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPerformingArtsTheater = {
	id: 'schema:PerformingArtsTheater',
	name: 'PerformingArtsTheater',
	label: 'PerformingArtsTheater',
	comment: 'A theater or other performing art center.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPerformingArtsTheater;
export const PerformingArtsTheater = schemaOrgPerformingArtsTheater;

export default schemaOrgPerformingArtsTheater;
