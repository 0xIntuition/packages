import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWebPageElement = {
	id: 'schema:WebPageElement',
	name: 'WebPageElement',
	label: 'WebPageElement',
	comment: 'A web page element, like a table or an image.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:cssSelector',
			name: 'cssSelector',
			label: 'cssSelector',
			comment:
				'A CSS selector, e.g. of a [[SpeakableSpecification]] or [[WebPageElement]]. In the latter case, multiple matches within a page can constitute a single conceptual "Web page element".',
			rangeIncludes: ['CssSelectorType'],
		},
		{
			id: 'schema:xpath',
			name: 'xpath',
			label: 'xpath',
			comment:
				'An XPath, e.g. of a [[SpeakableSpecification]] or [[WebPageElement]]. In the latter case, multiple matches within a page can constitute a single conceptual "Web page element".',
			rangeIncludes: ['XPathType'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWebPageElement;
export const WebPageElement = schemaOrgWebPageElement;

export default schemaOrgWebPageElement;
