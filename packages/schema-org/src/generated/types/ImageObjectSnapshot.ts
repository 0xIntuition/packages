import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgImageObjectSnapshot = {
	id: 'schema:ImageObjectSnapshot',
	name: 'ImageObjectSnapshot',
	label: 'ImageObjectSnapshot',
	comment:
		"A specific and exact (byte-for-byte) version of an [[ImageObject]]. Two byte-for-byte identical files, for the purposes of this type, considered identical. If they have different embedded metadata (e.g. XMP, EXIF) the files will differ. Different external facts about the files, e.g. creator or dateCreated that aren't represented in their actual content, do not affect this notion of identity.",
	subClassOf: ['ImageObject', 'MediaObject', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgImageObjectSnapshot;
export const ImageObjectSnapshot = schemaOrgImageObjectSnapshot;

export default schemaOrgImageObjectSnapshot;
