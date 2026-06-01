import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgResearchProject = {
	id: 'schema:ResearchProject',
	name: 'ResearchProject',
	label: 'ResearchProject',
	comment: 'A Research project.',
	subClassOf: ['Project', 'Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgResearchProject;
export const ResearchProject = schemaOrgResearchProject;

export default schemaOrgResearchProject;
