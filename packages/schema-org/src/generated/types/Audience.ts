import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAudience = {
	id: 'schema:Audience',
	name: 'Audience',
	label: 'Audience',
	comment: 'Intended audience for an item, i.e. the group for whom the item was created.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:audienceType',
			name: 'audienceType',
			label: 'audienceType',
			comment:
				'The target group associated with a given audience (e.g. veterans, car owners, musicians, etc.).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:geographicArea',
			name: 'geographicArea',
			label: 'geographicArea',
			comment: 'The geographic area associated with the audience.',
			rangeIncludes: ['AdministrativeArea'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAudience;
export const Audience = schemaOrgAudience;

export default schemaOrgAudience;
