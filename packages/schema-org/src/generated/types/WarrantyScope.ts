import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWarrantyScope = {
	id: 'schema:WarrantyScope',
	name: 'WarrantyScope',
	label: 'WarrantyScope',
	comment:
		'A range of services that will be provided to a customer free of charge in case of a defect or malfunction of a product.\\n\\nCommonly used values:\\n\\n* http://purl.org/goodrelations/v1#Labor-BringIn\\n* http://purl.org/goodrelations/v1#PartsAndLabor-BringIn\\n* http://purl.org/goodrelations/v1#PartsAndLabor-PickUp\n      ',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWarrantyScope;
export const WarrantyScope = schemaOrgWarrantyScope;

export default schemaOrgWarrantyScope;
