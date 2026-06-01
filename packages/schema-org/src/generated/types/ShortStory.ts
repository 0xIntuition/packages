import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgShortStory = {
	id: 'schema:ShortStory',
	name: 'ShortStory',
	label: 'ShortStory',
	comment: 'Short story or tale. A brief work of literature, usually written in narrative prose.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgShortStory;
export const ShortStory = schemaOrgShortStory;

export default schemaOrgShortStory;
