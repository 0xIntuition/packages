import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBarcode = {
	id: 'schema:Barcode',
	name: 'Barcode',
	label: 'Barcode',
	comment: 'An image of a visual machine-readable code such as a barcode or QR code.',
	subClassOf: ['ImageObject', 'MediaObject', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBarcode;
export const Barcode = schemaOrgBarcode;

export default schemaOrgBarcode;
