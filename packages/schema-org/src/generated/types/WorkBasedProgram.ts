import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWorkBasedProgram = {
	id: 'schema:WorkBasedProgram',
	name: 'WorkBasedProgram',
	label: 'WorkBasedProgram',
	comment:
		'A program with both an educational and employment component. Typically based at a workplace and structured around work-based learning, with the aim of instilling competencies related to an occupation. WorkBasedProgram is used to distinguish programs such as apprenticeships from school, college or other classroom based educational programs.',
	subClassOf: ['EducationalOccupationalProgram', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:occupationalCategory',
			name: 'occupationalCategory',
			label: 'occupationalCategory',
			comment:
				'A category describing the job, preferably using a term from a taxonomy such as [BLS O*NET-SOC](http://www.onetcenter.org/taxonomy.html), [ISCO-08](https://www.ilo.org/public/english/bureau/stat/isco/isco08/) or similar, with the property repeated for each applicable value. Ideally the taxonomy should be identified, and both the textual label and formal code for the category should be provided.\\n\nNote: for historical reasons, any textual label and formal code provided as a literal may be assumed to be from O*NET-SOC.',
			rangeIncludes: ['CategoryCode', 'Text'],
		},
		{
			id: 'schema:trainingSalary',
			name: 'trainingSalary',
			label: 'trainingSalary',
			comment: 'The estimated salary earned while in the program.',
			rangeIncludes: ['MonetaryAmountDistribution'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWorkBasedProgram;
export const WorkBasedProgram = schemaOrgWorkBasedProgram;

export default schemaOrgWorkBasedProgram;
