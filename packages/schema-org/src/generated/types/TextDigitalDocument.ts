import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTextDigitalDocument = {
	id: 'schema:TextDigitalDocument',
	name: 'TextDigitalDocument',
	label: 'TextDigitalDocument',
	comment: 'A file composed primarily of text.',
	subClassOf: ['DigitalDocument', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTextDigitalDocument;
export const TextDigitalDocument = schemaOrgTextDigitalDocument;

export default schemaOrgTextDigitalDocument;
