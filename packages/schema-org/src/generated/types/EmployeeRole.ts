import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEmployeeRole = {
	id: 'schema:EmployeeRole',
	name: 'EmployeeRole',
	label: 'EmployeeRole',
	comment: 'A subclass of OrganizationRole used to describe employee relationships.',
	subClassOf: ['OrganizationRole', 'Role', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:baseSalary',
			name: 'baseSalary',
			label: 'baseSalary',
			comment: 'The base salary of the job or of an employee in an EmployeeRole.',
			rangeIncludes: ['MonetaryAmount', 'Number', 'PriceSpecification'],
		},
		{
			id: 'schema:salaryCurrency',
			name: 'salaryCurrency',
			label: 'salaryCurrency',
			comment:
				'The currency (coded using [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217)) used for the main salary information in this job posting or for this employee.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEmployeeRole;
export const EmployeeRole = schemaOrgEmployeeRole;

export default schemaOrgEmployeeRole;
