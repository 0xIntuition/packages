import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAmpStory = {
	id: 'schema:AmpStory',
	name: 'AmpStory',
	label: 'AmpStory',
	comment:
		'A creative work with a visual storytelling format intended to be viewed online, particularly on mobile devices.',
	subClassOf: ['CreativeWork', 'Thing', 'MediaObject'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAmpStory;
export const AmpStory = schemaOrgAmpStory;

export default schemaOrgAmpStory;
