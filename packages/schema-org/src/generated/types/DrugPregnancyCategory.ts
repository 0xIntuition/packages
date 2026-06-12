import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrugPregnancyCategory = {
	id: 'schema:DrugPregnancyCategory',
	name: 'DrugPregnancyCategory',
	label: 'DrugPregnancyCategory',
	comment:
		'Categories that represent an assessment of the risk of fetal injury due to a drug or pharmaceutical used as directed by the mother during pregnancy.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrugPregnancyCategory;
export const DrugPregnancyCategory = schemaOrgDrugPregnancyCategory;

export default schemaOrgDrugPregnancyCategory;
