import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAPIReference = {
	id: 'schema:APIReference',
	name: 'APIReference',
	label: 'APIReference',
	comment: 'Reference documentation for application programming interfaces (APIs).',
	subClassOf: ['TechArticle', 'Article', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:assembly',
			name: 'assembly',
			label: 'assembly',
			comment: 'Library file name, e.g., mscorlib.dll, system.web.dll.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:assemblyVersion',
			name: 'assemblyVersion',
			label: 'assemblyVersion',
			comment: 'Associated product/technology version. E.g., .NET Framework 4.5.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:executableLibraryName',
			name: 'executableLibraryName',
			label: 'executableLibraryName',
			comment: 'Library file name, e.g., mscorlib.dll, system.web.dll.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:programmingModel',
			name: 'programmingModel',
			label: 'programmingModel',
			comment: 'Indicates whether API is managed or unmanaged.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:targetPlatform',
			name: 'targetPlatform',
			label: 'targetPlatform',
			comment: 'Type of app development: phone, Metro style, desktop, XBox, etc.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAPIReference;
export const APIReference = schemaOrgAPIReference;

export default schemaOrgAPIReference;
