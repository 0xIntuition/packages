import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEntryPoint = {
	id: 'schema:EntryPoint',
	name: 'EntryPoint',
	label: 'EntryPoint',
	comment: 'An entry point, within some Web-based protocol.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:actionApplication',
			name: 'actionApplication',
			label: 'actionApplication',
			comment: 'An application that can complete the request.',
			rangeIncludes: ['SoftwareApplication'],
		},
		{
			id: 'schema:actionPlatform',
			name: 'actionPlatform',
			label: 'actionPlatform',
			comment:
				'The high level platform(s) where the Action can be performed for the given URL. To specify a specific application or operating system instance, use actionApplication.',
			rangeIncludes: ['DigitalPlatformEnumeration', 'Text', 'URL'],
		},
		{
			id: 'schema:application',
			name: 'application',
			label: 'application',
			comment: 'An application that can complete the request.',
			rangeIncludes: ['SoftwareApplication'],
		},
		{
			id: 'schema:contentType',
			name: 'contentType',
			label: 'contentType',
			comment: 'The supported content type(s) for an EntryPoint response.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:encodingType',
			name: 'encodingType',
			label: 'encodingType',
			comment: 'The supported encoding type(s) for an EntryPoint request.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:httpMethod',
			name: 'httpMethod',
			label: 'httpMethod',
			comment:
				'An HTTP method that specifies the appropriate HTTP method for a request to an HTTP EntryPoint. Values are capitalized strings as used in HTTP.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:urlTemplate',
			name: 'urlTemplate',
			label: 'urlTemplate',
			comment:
				'An url template (RFC6570) that will be used to construct the target of the execution of the action.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEntryPoint;
export const EntryPoint = schemaOrgEntryPoint;

export default schemaOrgEntryPoint;
