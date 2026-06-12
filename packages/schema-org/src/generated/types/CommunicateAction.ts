import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCommunicateAction = {
	id: 'schema:CommunicateAction',
	name: 'CommunicateAction',
	label: 'CommunicateAction',
	comment:
		'The act of conveying information to another person via a communication medium (instrument) such as speech, email, or telephone conversation.',
	subClassOf: ['InteractAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:about',
			name: 'about',
			label: 'about',
			comment: 'The subject matter of an object.',
			rangeIncludes: ['Thing'],
		},
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
		{
			id: 'schema:recipient',
			name: 'recipient',
			label: 'recipient',
			comment:
				'A sub property of participant. The participant who is at the receiving end of the action.',
			rangeIncludes: ['Audience', 'ContactPoint', 'Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCommunicateAction;
export const CommunicateAction = schemaOrgCommunicateAction;

export default schemaOrgCommunicateAction;
