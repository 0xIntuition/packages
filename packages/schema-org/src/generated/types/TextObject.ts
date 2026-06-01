import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTextObject = {
	id: 'schema:TextObject',
	name: 'TextObject',
	label: 'TextObject',
	comment: 'A text file. The text can be unformatted or contain markup, html, etc.',
	subClassOf: ['MediaObject', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTextObject;
export const TextObject = schemaOrgTextObject;

export default schemaOrgTextObject;
