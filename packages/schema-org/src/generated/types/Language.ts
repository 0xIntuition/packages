import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLanguage = {
	id: 'schema:Language',
	name: 'Language',
	label: 'Language',
	comment:
		'Natural languages such as Spanish, Tamil, Hindi, English, etc. Formal language code tags expressed in [BCP 47](https://en.wikipedia.org/wiki/IETF_language_tag) can be used via the [[alternateName]] property. The Language type previously also covered programming languages such as Scheme and Lisp, which are now best represented using [[ComputerLanguage]].',
	subClassOf: ['Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLanguage;
export const Language = schemaOrgLanguage;

export default schemaOrgLanguage;
