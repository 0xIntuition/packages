import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDefinedTerm = {
	id: 'schema:DefinedTerm',
	name: 'DefinedTerm',
	label: 'DefinedTerm',
	comment:
		'A word, name, acronym, phrase, etc. with a formal definition. Often used in the context of category or subject classification, glossaries or dictionaries, product or creative work types, etc. Use the name property for the term being defined, use termCode if the term has an alpha-numeric code allocated, use description to provide the definition of the term. Use the about property to specify what the term is about.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:about',
			name: 'about',
			label: 'about',
			comment: 'The subject matter of an object.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:inDefinedTermSet',
			name: 'inDefinedTermSet',
			label: 'inDefinedTermSet',
			comment: 'A [[DefinedTermSet]] that contains this term.',
			rangeIncludes: ['DefinedTermSet', 'URL'],
		},
		{
			id: 'schema:termCode',
			name: 'termCode',
			label: 'termCode',
			comment: 'A code that identifies this [[DefinedTerm]] within a [[DefinedTermSet]].',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDefinedTerm;
export const DefinedTerm = schemaOrgDefinedTerm;

export default schemaOrgDefinedTerm;
