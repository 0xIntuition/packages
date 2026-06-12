import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHVACBusiness = {
	id: 'schema:HVACBusiness',
	name: 'HVACBusiness',
	label: 'HVACBusiness',
	comment: 'A business that provides Heating, Ventilation and Air Conditioning services.',
	subClassOf: ['HomeAndConstructionBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHVACBusiness;
export const HVACBusiness = schemaOrgHVACBusiness;

export default schemaOrgHVACBusiness;
