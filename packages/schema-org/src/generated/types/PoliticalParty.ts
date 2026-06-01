import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPoliticalParty = {
	id: 'schema:PoliticalParty',
	name: 'PoliticalParty',
	label: 'PoliticalParty',
	comment: 'Organization: Political Party.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPoliticalParty;
export const PoliticalParty = schemaOrgPoliticalParty;

export default schemaOrgPoliticalParty;
