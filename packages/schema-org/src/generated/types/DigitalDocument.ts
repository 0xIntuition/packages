import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDigitalDocument = {
	id: 'schema:DigitalDocument',
	name: 'DigitalDocument',
	label: 'DigitalDocument',
	comment: 'An electronic file or document.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:hasDigitalDocumentPermission',
			name: 'hasDigitalDocumentPermission',
			label: 'hasDigitalDocumentPermission',
			comment:
				'A permission related to the access to this document (e.g. permission to read or write an electronic document). For a public document, specify a grantee with an Audience with audienceType equal to "public".',
			rangeIncludes: ['DigitalDocumentPermission'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDigitalDocument;
export const DigitalDocument = schemaOrgDigitalDocument;

export default schemaOrgDigitalDocument;
