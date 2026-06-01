import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrugCostCategory = {
	id: 'schema:DrugCostCategory',
	name: 'DrugCostCategory',
	label: 'DrugCostCategory',
	comment: 'Enumerated categories of medical drug costs.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrugCostCategory;
export const DrugCostCategory = schemaOrgDrugCostCategory;

export default schemaOrgDrugCostCategory;
