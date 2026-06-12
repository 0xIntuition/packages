import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVideoObjectSnapshot = {
	id: 'schema:VideoObjectSnapshot',
	name: 'VideoObjectSnapshot',
	label: 'VideoObjectSnapshot',
	comment:
		"A specific and exact (byte-for-byte) version of a [[VideoObject]]. Two byte-for-byte identical files, for the purposes of this type, considered identical. If they have different embedded metadata the files will differ. Different external facts about the files, e.g. creator or dateCreated that aren't represented in their actual content, do not affect this notion of identity.",
	subClassOf: ['VideoObject', 'MediaObject', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVideoObjectSnapshot;
export const VideoObjectSnapshot = schemaOrgVideoObjectSnapshot;

export default schemaOrgVideoObjectSnapshot;
