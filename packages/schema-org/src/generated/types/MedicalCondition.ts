import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalCondition = {
	id: 'schema:MedicalCondition',
	name: 'MedicalCondition',
	label: 'MedicalCondition',
	comment:
		'Any condition of the human body that affects the normal functioning of a person, whether physically or mentally. Includes diseases, injuries, disabilities, disorders, syndromes, etc.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:associatedAnatomy',
			name: 'associatedAnatomy',
			label: 'associatedAnatomy',
			comment:
				'The anatomy of the underlying organ system or structures associated with this entity.',
			rangeIncludes: ['AnatomicalStructure', 'AnatomicalSystem', 'SuperficialAnatomy'],
		},
		{
			id: 'schema:cause',
			name: 'cause',
			label: 'cause',
			comment: 'The cause of a medical condition.',
			rangeIncludes: ['MedicalCause'],
		},
		{
			id: 'schema:differentialDiagnosis',
			name: 'differentialDiagnosis',
			label: 'differentialDiagnosis',
			comment:
				'One of a set of differential diagnoses for the condition. Specifically, a closely-related or competing diagnosis typically considered later in the cognitive process whereby this medical condition is distinguished from others most likely responsible for a similar collection of signs and symptoms to reach the most parsimonious diagnosis or diagnoses in a patient.',
			rangeIncludes: ['DDxElement'],
		},
		{
			id: 'schema:drug',
			name: 'drug',
			label: 'drug',
			comment: 'Specifying a drug or medicine used in a medication procedure.',
			rangeIncludes: ['Drug'],
		},
		{
			id: 'schema:epidemiology',
			name: 'epidemiology',
			label: 'epidemiology',
			comment: 'The characteristics of associated patients, such as age, gender, race etc.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:expectedPrognosis',
			name: 'expectedPrognosis',
			label: 'expectedPrognosis',
			comment: 'The likely outcome in either the short term or long term of the medical condition.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:naturalProgression',
			name: 'naturalProgression',
			label: 'naturalProgression',
			comment:
				'The expected progression of the condition if it is not treated and allowed to progress naturally.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:pathophysiology',
			name: 'pathophysiology',
			label: 'pathophysiology',
			comment:
				'Changes in the normal mechanical, physical, and biochemical functions that are associated with this activity or condition.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:possibleComplication',
			name: 'possibleComplication',
			label: 'possibleComplication',
			comment:
				'A possible unexpected and unfavorable evolution of a medical condition. Complications may include worsening of the signs or symptoms of the disease, extension of the condition to other organ systems, etc.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:possibleTreatment',
			name: 'possibleTreatment',
			label: 'possibleTreatment',
			comment: 'A possible treatment to address this condition, sign or symptom.',
			rangeIncludes: ['Drug', 'DrugClass', 'LifestyleModification', 'MedicalTherapy'],
		},
		{
			id: 'schema:primaryPrevention',
			name: 'primaryPrevention',
			label: 'primaryPrevention',
			comment:
				'A preventative therapy used to prevent an initial occurrence of the medical condition, such as vaccination.',
			rangeIncludes: ['MedicalTherapy'],
		},
		{
			id: 'schema:riskFactor',
			name: 'riskFactor',
			label: 'riskFactor',
			comment:
				'A modifiable or non-modifiable factor that increases the risk of a patient contracting this condition, e.g. age,  coexisting condition.',
			rangeIncludes: ['MedicalRiskFactor'],
		},
		{
			id: 'schema:secondaryPrevention',
			name: 'secondaryPrevention',
			label: 'secondaryPrevention',
			comment:
				'A preventative therapy used to prevent reoccurrence of the medical condition after an initial episode of the condition.',
			rangeIncludes: ['Drug', 'DrugClass', 'LifestyleModification', 'MedicalTherapy'],
		},
		{
			id: 'schema:signOrSymptom',
			name: 'signOrSymptom',
			label: 'signOrSymptom',
			comment:
				'A sign or symptom of this condition. Signs are objective or physically observable manifestations of the medical condition while symptoms are the subjective experience of the medical condition.',
			rangeIncludes: ['MedicalSignOrSymptom'],
		},
		{
			id: 'schema:stage',
			name: 'stage',
			label: 'stage',
			comment: 'The stage of the condition, if applicable.',
			rangeIncludes: ['MedicalConditionStage'],
		},
		{
			id: 'schema:status',
			name: 'status',
			label: 'status',
			comment: 'The status of the study (enumerated).',
			rangeIncludes: ['EventStatusType', 'MedicalStudyStatus', 'Text'],
		},
		{
			id: 'schema:typicalTest',
			name: 'typicalTest',
			label: 'typicalTest',
			comment: 'A medical test typically performed given this condition.',
			rangeIncludes: ['MedicalTest'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalCondition;
export const MedicalCondition = schemaOrgMedicalCondition;

export default schemaOrgMedicalCondition;
