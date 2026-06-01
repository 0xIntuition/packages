import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPeopleAudience = {
	id: 'schema:PeopleAudience',
	name: 'PeopleAudience',
	label: 'PeopleAudience',
	comment:
		"A set of characteristics belonging to people, e.g. who compose an item's target audience.",
	subClassOf: ['Audience', 'Intangible', 'Thing'],
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
			id: 'schema:requiredGender',
			name: 'requiredGender',
			label: 'requiredGender',
			comment: "Audiences defined by a person's gender.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:requiredMaxAge',
			name: 'requiredMaxAge',
			label: 'requiredMaxAge',
			comment: "Audiences defined by a person's maximum age.",
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:requiredMinAge',
			name: 'requiredMinAge',
			label: 'requiredMinAge',
			comment: "Audiences defined by a person's minimum age.",
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:suggestedAge',
			name: 'suggestedAge',
			label: 'suggestedAge',
			comment:
				'The age or age range for the intended audience or person, for example 3-12 months for infants, 1-5 years for toddlers.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:suggestedGender',
			name: 'suggestedGender',
			label: 'suggestedGender',
			comment:
				'The suggested gender of the intended person or audience, for example "male", "female", or "unisex".',
			rangeIncludes: ['GenderType', 'Text'],
		},
		{
			id: 'schema:suggestedMaxAge',
			name: 'suggestedMaxAge',
			label: 'suggestedMaxAge',
			comment: 'Maximum recommended age in years for the audience or user.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:suggestedMeasurement',
			name: 'suggestedMeasurement',
			label: 'suggestedMeasurement',
			comment:
				'A suggested range of body measurements for the intended audience or person, for example inseam between 32 and 34 inches or height between 170 and 190 cm. Typically found on a size chart for wearable products.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:suggestedMinAge',
			name: 'suggestedMinAge',
			label: 'suggestedMinAge',
			comment: 'Minimum recommended age in years for the audience or user.',
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPeopleAudience;
export const PeopleAudience = schemaOrgPeopleAudience;

export default schemaOrgPeopleAudience;
