import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOccupation = {
	id: 'schema:Occupation',
	name: 'Occupation',
	label: 'Occupation',
	comment: 'A profession, may involve prolonged training and/or a formal qualification.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:educationRequirements',
			name: 'educationRequirements',
			label: 'educationRequirements',
			comment: 'Educational background needed for the position or Occupation.',
			rangeIncludes: ['EducationalOccupationalCredential', 'Text'],
		},
		{
			id: 'schema:estimatedSalary',
			name: 'estimatedSalary',
			label: 'estimatedSalary',
			comment:
				'An estimated salary for a job posting or occupation, based on a variety of variables including, but not limited to industry, job title, and location. Estimated salaries  are often computed by outside organizations rather than the hiring organization, who may not have committed to the estimated value.',
			rangeIncludes: ['MonetaryAmount', 'MonetaryAmountDistribution', 'Number'],
		},
		{
			id: 'schema:experienceRequirements',
			name: 'experienceRequirements',
			label: 'experienceRequirements',
			comment: 'Description of skills and experience needed for the position or Occupation.',
			rangeIncludes: ['OccupationalExperienceRequirements', 'Text'],
		},
		{
			id: 'schema:occupationLocation',
			name: 'occupationLocation',
			label: 'occupationLocation',
			comment:
				' The region/country for which this occupational description is appropriate. Note that educational requirements and qualifications can vary between jurisdictions.',
			rangeIncludes: ['AdministrativeArea'],
		},
		{
			id: 'schema:occupationalCategory',
			name: 'occupationalCategory',
			label: 'occupationalCategory',
			comment:
				'A category describing the job, preferably using a term from a taxonomy such as [BLS O*NET-SOC](http://www.onetcenter.org/taxonomy.html), [ISCO-08](https://www.ilo.org/public/english/bureau/stat/isco/isco08/) or similar, with the property repeated for each applicable value. Ideally the taxonomy should be identified, and both the textual label and formal code for the category should be provided.\\n\nNote: for historical reasons, any textual label and formal code provided as a literal may be assumed to be from O*NET-SOC.',
			rangeIncludes: ['CategoryCode', 'Text'],
		},
		{
			id: 'schema:qualifications',
			name: 'qualifications',
			label: 'qualifications',
			comment: 'Specific qualifications required for this role or Occupation.',
			rangeIncludes: ['Credential', 'Text'],
		},
		{
			id: 'schema:responsibilities',
			name: 'responsibilities',
			label: 'responsibilities',
			comment: 'Responsibilities associated with this role or Occupation.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:skills',
			name: 'skills',
			label: 'skills',
			comment:
				'A statement of knowledge, skill, ability, task or any other assertion expressing a competency that is either claimed by a person, an organization or desired or required to fulfill a role or to work in an occupation.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOccupation;
export const Occupation = schemaOrgOccupation;

export default schemaOrgOccupation;
