import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHardwareStore = {
	id: 'schema:HardwareStore',
	name: 'HardwareStore',
	label: 'HardwareStore',
	comment: 'A hardware store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHardwareStore;
export const HardwareStore = schemaOrgHardwareStore;

export default schemaOrgHardwareStore;
