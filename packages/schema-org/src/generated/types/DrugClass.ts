import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrugClass = {
	id: 'schema:DrugClass',
	name: 'DrugClass',
	label: 'DrugClass',
	comment:
		'A class of medical drugs, e.g., statins. Classes can represent general pharmacological class, common mechanisms of action, common physiological effects, etc.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:drug',
			name: 'drug',
			label: 'drug',
			comment: 'Specifying a drug or medicine used in a medication procedure.',
			rangeIncludes: ['Drug'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrugClass;
export const DrugClass = schemaOrgDrugClass;

export default schemaOrgDrugClass;
