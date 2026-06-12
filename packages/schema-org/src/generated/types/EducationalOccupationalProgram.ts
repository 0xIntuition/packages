import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEducationalOccupationalProgram = {
	id: 'schema:EducationalOccupationalProgram',
	name: 'EducationalOccupationalProgram',
	label: 'EducationalOccupationalProgram',
	comment:
		'A program offered by an institution which determines the learning progress to achieve an outcome, usually a credential like a degree or certificate. This would define a discrete set of opportunities (e.g., job, courses) that together constitute a program with a clear start, end, set of requirements, and transition to a new occupational opportunity (e.g., a job), or sometimes a higher educational opportunity (e.g., an advanced degree).',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:applicationDeadline',
			name: 'applicationDeadline',
			label: 'applicationDeadline',
			comment:
				'The date on which the program stops collecting applications for the next enrollment cycle. Flexible application deadlines (for example, a program with rolling admissions) can be described in a textual string, rather than as a DateTime.',
			rangeIncludes: ['Date', 'Text'],
		},
		{
			id: 'schema:applicationStartDate',
			name: 'applicationStartDate',
			label: 'applicationStartDate',
			comment:
				'The date at which the program begins collecting applications for the next enrollment cycle.',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:dayOfWeek',
			name: 'dayOfWeek',
			label: 'dayOfWeek',
			comment: 'The day of the week for which these opening hours are valid.',
			rangeIncludes: ['DayOfWeek'],
		},
		{
			id: 'schema:educationalCredentialAwarded',
			name: 'educationalCredentialAwarded',
			label: 'educationalCredentialAwarded',
			comment:
				'A description of the qualification, award, certificate, diploma or other educational credential awarded as a consequence of successful completion of this course or program.',
			rangeIncludes: ['EducationalOccupationalCredential', 'Text', 'URL'],
		},
		{
			id: 'schema:educationalProgramMode',
			name: 'educationalProgramMode',
			label: 'educationalProgramMode',
			comment:
				'Similar to courseMode, the medium or means of delivery of the program as a whole. The value may either be a text label (e.g. "online", "onsite" or "blended"; "synchronous" or "asynchronous"; "full-time" or "part-time") or a URL reference to a term from a controlled vocabulary (e.g. https://ceds.ed.gov/element/001311#Asynchronous ).',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:endDate',
			name: 'endDate',
			label: 'endDate',
			comment:
				'The end date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:financialAidEligible',
			name: 'financialAidEligible',
			label: 'financialAidEligible',
			comment:
				'A financial aid type or program which students may use to pay for tuition or fees associated with the program.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:hasCourse',
			name: 'hasCourse',
			label: 'hasCourse',
			comment:
				'A course or class that is one of the learning opportunities that constitute an educational / occupational program. No information is implied about whether the course is mandatory or optional; no guarantee is implied about whether the course will be available to everyone on the program.',
			rangeIncludes: ['Course'],
		},
		{
			id: 'schema:maximumEnrollment',
			name: 'maximumEnrollment',
			label: 'maximumEnrollment',
			comment: 'The maximum number of students who may be enrolled in the program.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:numberOfCredits',
			name: 'numberOfCredits',
			label: 'numberOfCredits',
			comment:
				'The number of credits or units awarded by a Course or required to complete an EducationalOccupationalProgram.',
			rangeIncludes: ['Integer', 'StructuredValue'],
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
			id: 'schema:occupationalCredentialAwarded',
			name: 'occupationalCredentialAwarded',
			label: 'occupationalCredentialAwarded',
			comment:
				'A description of the qualification, award, certificate, diploma or other occupational credential awarded as a consequence of successful completion of this course or program.',
			rangeIncludes: ['EducationalOccupationalCredential', 'Text', 'URL'],
		},
		{
			id: 'schema:offers',
			name: 'offers',
			label: 'offers',
			comment:
				'An offer to provide this item&#x2014;for example, an offer to sell a product, rent the DVD of a movie, perform a service, or give away tickets to an event. Use [[businessFunction]] to indicate the kind of transaction offered, i.e. sell, lease, etc. This property can also be used to describe a [[Demand]]. While this property is listed as expected on a number of common types, it can be used in others. In that case, using a second type, such as Product or a subtype of Product, can clarify the nature of the offer.\n      ',
			rangeIncludes: ['Demand', 'Offer'],
		},
		{
			id: 'schema:programPrerequisites',
			name: 'programPrerequisites',
			label: 'programPrerequisites',
			comment: 'Prerequisites for enrolling in the program.',
			rangeIncludes: ['AlignmentObject', 'Course', 'EducationalOccupationalCredential', 'Text'],
		},
		{
			id: 'schema:programType',
			name: 'programType',
			label: 'programType',
			comment:
				'The type of educational or occupational program. For example, classroom, internship, alternance, etc.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:provider',
			name: 'provider',
			label: 'provider',
			comment:
				'The service provider, service operator, or service performer; the goods producer. Another party (a seller) may offer those services or goods on behalf of the provider. A provider may also serve as the seller.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:salaryUponCompletion',
			name: 'salaryUponCompletion',
			label: 'salaryUponCompletion',
			comment: 'The expected salary upon completing the training.',
			rangeIncludes: ['MonetaryAmountDistribution'],
		},
		{
			id: 'schema:startDate',
			name: 'startDate',
			label: 'startDate',
			comment:
				'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:termDuration',
			name: 'termDuration',
			label: 'termDuration',
			comment:
				'The amount of time in a term as defined by the institution. A term is a length of time where students take one or more classes. Semesters and quarters are common units for term.',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:termsPerYear',
			name: 'termsPerYear',
			label: 'termsPerYear',
			comment:
				'The number of times terms of study are offered per year. Semesters and quarters are common units for term. For example, if the student can only take 2 semesters for the program in one year, then termsPerYear should be 2.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:timeOfDay',
			name: 'timeOfDay',
			label: 'timeOfDay',
			comment: 'The time of day the program normally runs. For example, "evenings".',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:timeToComplete',
			name: 'timeToComplete',
			label: 'timeToComplete',
			comment: 'The expected length of time to complete the program if attending full-time.',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:trainingSalary',
			name: 'trainingSalary',
			label: 'trainingSalary',
			comment: 'The estimated salary earned while in the program.',
			rangeIncludes: ['MonetaryAmountDistribution'],
		},
		{
			id: 'schema:typicalCreditsPerTerm',
			name: 'typicalCreditsPerTerm',
			label: 'typicalCreditsPerTerm',
			comment:
				"The number of credits or units a full-time student would be expected to take in 1 term however 'term' is defined by the institution.",
			rangeIncludes: ['Integer', 'StructuredValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEducationalOccupationalProgram;
export const EducationalOccupationalProgram = schemaOrgEducationalOccupationalProgram;

export default schemaOrgEducationalOccupationalProgram;
