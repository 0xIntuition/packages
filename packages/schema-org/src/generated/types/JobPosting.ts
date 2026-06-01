import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgJobPosting = {
	id: 'schema:JobPosting',
	name: 'JobPosting',
	label: 'JobPosting',
	comment: 'A listing that describes a job opening in a certain organization.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:applicantLocationRequirements',
			name: 'applicantLocationRequirements',
			label: 'applicantLocationRequirements',
			comment:
				'The location(s) applicants can apply from. This is usually used for telecommuting jobs where the applicant does not need to be in a physical office. Note: This should not be used for citizenship or work visa requirements.',
			rangeIncludes: ['AdministrativeArea'],
		},
		{
			id: 'schema:applicationContact',
			name: 'applicationContact',
			label: 'applicationContact',
			comment: 'Contact details for further information relevant to this job posting.',
			rangeIncludes: ['ContactPoint'],
		},
		{
			id: 'schema:baseSalary',
			name: 'baseSalary',
			label: 'baseSalary',
			comment: 'The base salary of the job or of an employee in an EmployeeRole.',
			rangeIncludes: ['MonetaryAmount', 'Number', 'PriceSpecification'],
		},
		{
			id: 'schema:benefits',
			name: 'benefits',
			label: 'benefits',
			comment: 'Description of benefits associated with the job.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:datePosted',
			name: 'datePosted',
			label: 'datePosted',
			comment: 'Publication date of an online listing.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:directApply',
			name: 'directApply',
			label: 'directApply',
			comment:
				'Indicates whether an [[url]] that is associated with a [[JobPosting]] enables direct application for the job, via the posting website. A job posting is considered to have directApply of [[True]] if an application process for the specified job can be directly initiated via the url(s) given (noting that e.g. multiple internet domains might nevertheless be involved at an implementation level). A value of [[False]] is appropriate if there is no clear path to applying directly online for the specified job, navigating directly from the JobPosting url(s) supplied.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:educationRequirements',
			name: 'educationRequirements',
			label: 'educationRequirements',
			comment: 'Educational background needed for the position or Occupation.',
			rangeIncludes: ['EducationalOccupationalCredential', 'Text'],
		},
		{
			id: 'schema:eligibilityToWorkRequirement',
			name: 'eligibilityToWorkRequirement',
			label: 'eligibilityToWorkRequirement',
			comment:
				'The legal requirements such as citizenship, visa and other documentation required for an applicant to this job.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:employerOverview',
			name: 'employerOverview',
			label: 'employerOverview',
			comment:
				'A description of the employer, career opportunities and work environment for this position.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:employmentType',
			name: 'employmentType',
			label: 'employmentType',
			comment:
				'Type of employment (e.g. full-time, part-time, contract, temporary, seasonal, internship).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:employmentUnit',
			name: 'employmentUnit',
			label: 'employmentUnit',
			comment:
				'Indicates the department, unit and/or facility where the employee reports and/or in which the job is to be performed.',
			rangeIncludes: ['Organization'],
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
			id: 'schema:experienceInPlaceOfEducation',
			name: 'experienceInPlaceOfEducation',
			label: 'experienceInPlaceOfEducation',
			comment:
				'Indicates whether a [[JobPosting]] will accept experience (as indicated by [[OccupationalExperienceRequirements]]) in place of its formal educational qualifications (as indicated by [[educationRequirements]]). If true, indicates that satisfying one of these requirements is sufficient.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:experienceRequirements',
			name: 'experienceRequirements',
			label: 'experienceRequirements',
			comment: 'Description of skills and experience needed for the position or Occupation.',
			rangeIncludes: ['OccupationalExperienceRequirements', 'Text'],
		},
		{
			id: 'schema:hiringOrganization',
			name: 'hiringOrganization',
			label: 'hiringOrganization',
			comment: 'Organization or Person offering the job position.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:incentiveCompensation',
			name: 'incentiveCompensation',
			label: 'incentiveCompensation',
			comment: 'Description of bonus and commission compensation aspects of the job.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:incentives',
			name: 'incentives',
			label: 'incentives',
			comment: 'Description of bonus and commission compensation aspects of the job.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:industry',
			name: 'industry',
			label: 'industry',
			comment: 'The industry associated with the job position.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:jobBenefits',
			name: 'jobBenefits',
			label: 'jobBenefits',
			comment: 'Description of benefits associated with the job.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:jobDuration',
			name: 'jobDuration',
			label: 'jobDuration',
			comment:
				'The expected duration of an employment offer as advertised by the employer. Relevant for job postings that have a clearly defined period in mind such as seasonal work, substitutes for maternal leave or any other temporary employment.',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
		{
			id: 'schema:jobImmediateStart',
			name: 'jobImmediateStart',
			label: 'jobImmediateStart',
			comment: 'An indicator as to whether a position is available for an immediate start.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:jobLocation',
			name: 'jobLocation',
			label: 'jobLocation',
			comment: 'A (typically single) geographic location associated with the job position.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:jobLocationType',
			name: 'jobLocationType',
			label: 'jobLocationType',
			comment: 'A description of the job location (e.g. TELECOMMUTE for telecommute jobs).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:jobStartDate',
			name: 'jobStartDate',
			label: 'jobStartDate',
			comment:
				'The date on which a successful applicant for this job would be expected to start work. Choose a specific date in the future or use the jobImmediateStart property to indicate the position is to be filled as soon as possible.',
			rangeIncludes: ['Date', 'Text'],
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
			id: 'schema:physicalRequirement',
			name: 'physicalRequirement',
			label: 'physicalRequirement',
			comment:
				'A description of the types of physical activity associated with the job. Defined terms such as those in O*net may be used, but note that there is no way to specify the level of ability as well as its nature when using a defined term.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:qualifications',
			name: 'qualifications',
			label: 'qualifications',
			comment: 'Specific qualifications required for this role or Occupation.',
			rangeIncludes: ['Credential', 'Text'],
		},
		{
			id: 'schema:relevantOccupation',
			name: 'relevantOccupation',
			label: 'relevantOccupation',
			comment: 'The Occupation for the JobPosting.',
			rangeIncludes: ['Occupation'],
		},
		{
			id: 'schema:responsibilities',
			name: 'responsibilities',
			label: 'responsibilities',
			comment: 'Responsibilities associated with this role or Occupation.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:salaryCurrency',
			name: 'salaryCurrency',
			label: 'salaryCurrency',
			comment:
				'The currency (coded using [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217)) used for the main salary information in this job posting or for this employee.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:securityClearanceRequirement',
			name: 'securityClearanceRequirement',
			label: 'securityClearanceRequirement',
			comment: 'A description of any security clearance requirements of the job.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:sensoryRequirement',
			name: 'sensoryRequirement',
			label: 'sensoryRequirement',
			comment:
				'A description of any sensory requirements and levels necessary to function on the job, including hearing and vision. Defined terms such as those in O*net may be used, but note that there is no way to specify the level of ability as well as its nature when using a defined term.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:skills',
			name: 'skills',
			label: 'skills',
			comment:
				'A statement of knowledge, skill, ability, task or any other assertion expressing a competency that is either claimed by a person, an organization or desired or required to fulfill a role or to work in an occupation.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:specialCommitments',
			name: 'specialCommitments',
			label: 'specialCommitments',
			comment:
				'Any special commitments associated with this job posting. Valid entries include VeteranCommit, MilitarySpouseCommit, etc.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:title',
			name: 'title',
			label: 'title',
			comment: 'The title of the job.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:totalJobOpenings',
			name: 'totalJobOpenings',
			label: 'totalJobOpenings',
			comment:
				'The number of positions open for this job posting. Use a positive integer. Do not use if the number of positions is unclear or not known.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:validThrough',
			name: 'validThrough',
			label: 'validThrough',
			comment:
				'The date after when the item is not valid. For example the end of an offer, salary period, or a period of opening hours.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:workHours',
			name: 'workHours',
			label: 'workHours',
			comment: 'The typical working hours for this job (e.g. 1st shift, night shift, 8am-5pm).',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgJobPosting;
export const JobPosting = schemaOrgJobPosting;

export default schemaOrgJobPosting;
