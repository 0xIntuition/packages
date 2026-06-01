import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSpeakableSpecification = {
	id: 'schema:SpeakableSpecification',
	name: 'SpeakableSpecification',
	label: 'SpeakableSpecification',
	comment:
		'A SpeakableSpecification indicates (typically via [[xpath]] or [[cssSelector]]) sections of a document that are highlighted as particularly [[speakable]]. Instances of this type are expected to be used primarily as values of the [[speakable]] property.',
	subClassOf: ['Intangible', 'Thing'],
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

export const spec = schemaOrgSpeakableSpecification;
export const SpeakableSpecification = schemaOrgSpeakableSpecification;

export default schemaOrgSpeakableSpecification;
