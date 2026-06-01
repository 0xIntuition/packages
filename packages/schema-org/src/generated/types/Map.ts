import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMap = {
	id: 'schema:Map',
	name: 'Map',
	label: 'Map',
	comment: 'A map.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:mapType',
			name: 'mapType',
			label: 'mapType',
			comment: 'Indicates the kind of Map, from the MapCategoryType Enumeration.',
			rangeIncludes: ['MapCategoryType'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMap;

export default schemaOrgMap;
