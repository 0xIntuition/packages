import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalStudy = {
	id: 'schema:MedicalStudy',
	name: 'MedicalStudy',
	label: 'MedicalStudy',
	comment:
		'A medical study is an umbrella type covering all kinds of research studies relating to human medicine or health, including observational studies and interventional trials and registries, randomized, controlled or not. When the specific type of study is known, use one of the extensions of this type, such as MedicalTrial or MedicalObservationalStudy. Also, note that this type should be used to mark up data that describes the study itself; to tag an article that publishes the results of a study, use MedicalScholarlyArticle. Note: use the code property of MedicalEntity to store study IDs, e.g. clinicaltrials.gov ID.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:healthCondition',
			name: 'healthCondition',
			label: 'healthCondition',
			comment:
				'Specifying the health condition(s) of a patient, medical study, or other target audience.',
			rangeIncludes: ['MedicalCondition'],
		},
		{
			id: 'schema:sponsor',
			name: 'sponsor',
			label: 'sponsor',
			comment:
				'A person or organization that supports a thing through a pledge, promise, or financial contribution. E.g. a sponsor of a Medical Study or a corporate sponsor of an event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:status',
			name: 'status',
			label: 'status',
			comment: 'The status of the study (enumerated).',
			rangeIncludes: ['EventStatusType', 'MedicalStudyStatus', 'Text'],
		},
		{
			id: 'schema:studyLocation',
			name: 'studyLocation',
			label: 'studyLocation',
			comment: 'The location in which the study is taking/took place.',
			rangeIncludes: ['AdministrativeArea'],
		},
		{
			id: 'schema:studySubject',
			name: 'studySubject',
			label: 'studySubject',
			comment:
				'A subject of the study, i.e. one of the medical conditions, therapies, devices, drugs, etc. investigated by the study.',
			rangeIncludes: ['MedicalEntity'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalStudy;
export const MedicalStudy = schemaOrgMedicalStudy;

export default schemaOrgMedicalStudy;
