import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSheetMusic = {
	id: 'schema:SheetMusic',
	name: 'SheetMusic',
	label: 'SheetMusic',
	comment: 'Printed music, as opposed to performed or recorded music.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSheetMusic;
export const SheetMusic = schemaOrgSheetMusic;

export default schemaOrgSheetMusic;
