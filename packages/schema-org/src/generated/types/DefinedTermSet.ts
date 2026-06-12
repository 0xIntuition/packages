import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDefinedTermSet = {
	id: 'schema:DefinedTermSet',
	name: 'DefinedTermSet',
	label: 'DefinedTermSet',
	comment:
		'A set of defined terms, for example a set of categories or a classification scheme, a glossary, dictionary or enumeration. Use the about property to specify what the term set is about.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:about',
			name: 'about',
			label: 'about',
			comment: 'The subject matter of an object.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:hasDefinedTerm',
			name: 'hasDefinedTerm',
			label: 'hasDefinedTerm',
			comment: 'A Defined Term contained in this term set.',
			rangeIncludes: ['DefinedTerm'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDefinedTermSet;
export const DefinedTermSet = schemaOrgDefinedTermSet;

export default schemaOrgDefinedTermSet;
