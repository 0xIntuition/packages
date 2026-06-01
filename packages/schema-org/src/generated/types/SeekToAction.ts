import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSeekToAction = {
	id: 'schema:SeekToAction',
	name: 'SeekToAction',
	label: 'SeekToAction',
	comment:
		'This is the [[Action]] of navigating to a specific [[startOffset]] timestamp within a [[VideoObject]], typically represented with a URL template structure.',
	subClassOf: ['Action', 'Thing'],
	properties: [
		{
			id: 'schema:startOffset',
			name: 'startOffset',
			label: 'startOffset',
			comment:
				'The start time of the clip expressed as the number of seconds from the beginning of the work.',
			rangeIncludes: ['HyperTocEntry', 'Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSeekToAction;
export const SeekToAction = schemaOrgSeekToAction;

export default schemaOrgSeekToAction;
