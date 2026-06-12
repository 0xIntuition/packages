import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgClass = {
	id: 'schema:Class',
	name: 'Class',
	label: 'Class',
	comment: "A class, also often called a 'Type'; equivalent to rdfs:Class.",
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

export const spec = schemaOrgClass;
export const Class = schemaOrgClass;

export default schemaOrgClass;
