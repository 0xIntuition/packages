import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalConditionStage = {
	id: 'schema:MedicalConditionStage',
	name: 'MedicalConditionStage',
	label: 'MedicalConditionStage',
	comment: "A stage of a medical condition, such as 'Stage IIIa'.",
	subClassOf: ['MedicalIntangible', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:stageAsNumber',
			name: 'stageAsNumber',
			label: 'stageAsNumber',
			comment: 'The stage represented as a number, e.g. 3.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:subStageSuffix',
			name: 'subStageSuffix',
			label: 'subStageSuffix',
			comment: "The substage, e.g. 'a' for Stage IIIa.",
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalConditionStage;
export const MedicalConditionStage = schemaOrgMedicalConditionStage;

export default schemaOrgMedicalConditionStage;
