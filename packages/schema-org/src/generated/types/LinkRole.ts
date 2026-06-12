import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLinkRole = {
	id: 'schema:LinkRole',
	name: 'LinkRole',
	label: 'LinkRole',
	comment:
		"A Role that represents a Web link, e.g. as expressed via the 'url' property. Its linkRelationship property can indicate URL-based and plain textual link types, e.g. those in IANA link registry or others such as 'amphtml'. This structure provides a placeholder where details from HTML's link element can be represented outside of HTML, e.g. in JSON-LD feeds.",
	subClassOf: ['Role', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:inLanguage',
			name: 'inLanguage',
			label: 'inLanguage',
			comment:
				'The language of the content or performance or used in an action. Please use one of the language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47). See also [[availableLanguage]].',
			rangeIncludes: ['Language', 'Text'],
		},
		{
			id: 'schema:linkRelationship',
			name: 'linkRelationship',
			label: 'linkRelationship',
			comment: 'Indicates the relationship type of a Web link. ',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLinkRole;
export const LinkRole = schemaOrgLinkRole;

export default schemaOrgLinkRole;
