import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgResearcher = {
	id: 'schema:Researcher',
	name: 'Researcher',
	label: 'Researcher',
	comment: 'Researchers.',
	subClassOf: ['Audience', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgResearcher;
export const Researcher = schemaOrgResearcher;

export default schemaOrgResearcher;
