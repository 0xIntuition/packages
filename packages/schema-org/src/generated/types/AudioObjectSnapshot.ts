import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAudioObjectSnapshot = {
	id: 'schema:AudioObjectSnapshot',
	name: 'AudioObjectSnapshot',
	label: 'AudioObjectSnapshot',
	comment:
		"A specific and exact (byte-for-byte) version of an [[AudioObject]]. Two byte-for-byte identical files, for the purposes of this type, considered identical. If they have different embedded metadata the files will differ. Different external facts about the files, e.g. creator or dateCreated that aren't represented in their actual content, do not affect this notion of identity.",
	subClassOf: ['AudioObject', 'MediaObject', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAudioObjectSnapshot;
export const AudioObjectSnapshot = schemaOrgAudioObjectSnapshot;

export default schemaOrgAudioObjectSnapshot;
