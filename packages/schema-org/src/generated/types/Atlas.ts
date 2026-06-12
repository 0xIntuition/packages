import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAtlas = {
	id: 'schema:Atlas',
	name: 'Atlas',
	label: 'Atlas',
	comment:
		'A collection or bound volume of maps, charts, plates or tables, physical or in media form illustrating any subject.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAtlas;
export const Atlas = schemaOrgAtlas;

export default schemaOrgAtlas;
