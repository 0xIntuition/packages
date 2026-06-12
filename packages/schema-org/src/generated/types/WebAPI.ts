import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWebAPI = {
	id: 'schema:WebAPI',
	name: 'WebAPI',
	label: 'WebAPI',
	comment: 'An application programming interface accessible over Web/Internet technologies.',
	subClassOf: ['Service', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:documentation',
			name: 'documentation',
			label: 'documentation',
			comment: 'Further documentation describing the Web API in more detail.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWebAPI;
export const WebAPI = schemaOrgWebAPI;

export default schemaOrgWebAPI;
