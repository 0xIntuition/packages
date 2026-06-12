import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEnumeration = {
	id: 'schema:Enumeration',
	name: 'Enumeration',
	label: 'Enumeration',
	comment: 'Lists or enumerations—for example, a list of cuisines or music genres, etc.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:supersededBy',
			name: 'supersededBy',
			label: 'supersededBy',
			comment: 'Relates a term (i.e. a property, class or enumeration) to one that supersedes it.',
			rangeIncludes: ['Class', 'Enumeration', 'Property'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEnumeration;
export const Enumeration = schemaOrgEnumeration;

export default schemaOrgEnumeration;
