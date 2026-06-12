import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPresentationDigitalDocument = {
	id: 'schema:PresentationDigitalDocument',
	name: 'PresentationDigitalDocument',
	label: 'PresentationDigitalDocument',
	comment: 'A file containing slides or used for a presentation.',
	subClassOf: ['DigitalDocument', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPresentationDigitalDocument;
export const PresentationDigitalDocument = schemaOrgPresentationDigitalDocument;

export default schemaOrgPresentationDigitalDocument;
