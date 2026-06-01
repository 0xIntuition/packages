import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOfficeEquipmentStore = {
	id: 'schema:OfficeEquipmentStore',
	name: 'OfficeEquipmentStore',
	label: 'OfficeEquipmentStore',
	comment: 'An office equipment store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOfficeEquipmentStore;
export const OfficeEquipmentStore = schemaOrgOfficeEquipmentStore;

export default schemaOrgOfficeEquipmentStore;
