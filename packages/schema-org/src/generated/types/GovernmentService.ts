import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGovernmentService = {
	id: 'schema:GovernmentService',
	name: 'GovernmentService',
	label: 'GovernmentService',
	comment:
		'A service provided by a government organization, e.g. food stamps, veterans benefits, etc.',
	subClassOf: ['Service', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:jurisdiction',
			name: 'jurisdiction',
			label: 'jurisdiction',
			comment:
				'Indicates a legal jurisdiction, e.g. of some legislation, or where some government service is based.',
			rangeIncludes: ['AdministrativeArea', 'Text'],
		},
		{
			id: 'schema:serviceOperator',
			name: 'serviceOperator',
			label: 'serviceOperator',
			comment:
				'The operating organization, if different from the provider.  This enables the representation of services that are provided by an organization, but operated by another organization like a subcontractor.',
			rangeIncludes: ['Organization'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGovernmentService;
export const GovernmentService = schemaOrgGovernmentService;

export default schemaOrgGovernmentService;
