import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRadioClip = {
	id: 'schema:RadioClip',
	name: 'RadioClip',
	label: 'RadioClip',
	comment: 'A short radio program or a segment/part of a radio program.',
	subClassOf: ['Clip', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRadioClip;
export const RadioClip = schemaOrgRadioClip;

export default schemaOrgRadioClip;
