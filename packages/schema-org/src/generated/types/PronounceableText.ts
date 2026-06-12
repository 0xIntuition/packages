import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPronounceableText = {
	id: 'schema:PronounceableText',
	name: 'PronounceableText',
	label: 'PronounceableText',
	comment: 'Data type: PronounceableText.',
	subClassOf: ['Text'],
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
			id: 'schema:phoneticText',
			name: 'phoneticText',
			label: 'phoneticText',
			comment:
				'Representation of a text [[textValue]] using the specified [[speechToTextMarkup]]. For example the city name of Houston in IPA: /ˈhjuːstən/.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:speechToTextMarkup',
			name: 'speechToTextMarkup',
			label: 'speechToTextMarkup',
			comment:
				'Form of markup used. eg. [SSML](https://www.w3.org/TR/speech-synthesis11) or [IPA](https://www.wikidata.org/wiki/Property:P898).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:textValue',
			name: 'textValue',
			label: 'textValue',
			comment: 'Text value being annotated.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPronounceableText;
export const PronounceableText = schemaOrgPronounceableText;

export default schemaOrgPronounceableText;
