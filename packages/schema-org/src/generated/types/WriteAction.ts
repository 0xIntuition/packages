import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWriteAction = {
	id: 'schema:WriteAction',
	name: 'WriteAction',
	label: 'WriteAction',
	comment: 'The act of authoring written creative content.',
	subClassOf: ['CreateAction', 'Action', 'Thing'],
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
			id: 'schema:language',
			name: 'language',
			label: 'language',
			comment: 'A sub property of instrument. The language used on this action.',
			rangeIncludes: ['Language'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWriteAction;
export const WriteAction = schemaOrgWriteAction;

export default schemaOrgWriteAction;
