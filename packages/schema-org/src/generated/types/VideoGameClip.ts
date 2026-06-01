import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVideoGameClip = {
	id: 'schema:VideoGameClip',
	name: 'VideoGameClip',
	label: 'VideoGameClip',
	comment: 'A short segment/part of a video game.',
	subClassOf: ['Clip', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVideoGameClip;
export const VideoGameClip = schemaOrgVideoGameClip;

export default schemaOrgVideoGameClip;
