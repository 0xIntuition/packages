import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDigitalDocumentPermissionType = {
	id: 'schema:DigitalDocumentPermissionType',
	name: 'DigitalDocumentPermissionType',
	label: 'DigitalDocumentPermissionType',
	comment: 'A type of permission which can be granted for accessing a digital document.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDigitalDocumentPermissionType;
export const DigitalDocumentPermissionType = schemaOrgDigitalDocumentPermissionType;

export default schemaOrgDigitalDocumentPermissionType;
