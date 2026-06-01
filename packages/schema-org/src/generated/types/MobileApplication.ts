import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMobileApplication = {
	id: 'schema:MobileApplication',
	name: 'MobileApplication',
	label: 'MobileApplication',
	comment:
		'A software application designed specifically to work well on a mobile device such as a telephone.',
	subClassOf: ['SoftwareApplication', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:carrierRequirements',
			name: 'carrierRequirements',
			label: 'carrierRequirements',
			comment:
				'Specifies specific carrier(s) requirements for the application (e.g. an application may only work on a specific carrier network).',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMobileApplication;
export const MobileApplication = schemaOrgMobileApplication;

export default schemaOrgMobileApplication;
