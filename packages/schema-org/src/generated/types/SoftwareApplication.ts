import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSoftwareApplication = {
	id: 'schema:SoftwareApplication',
	name: 'SoftwareApplication',
	label: 'SoftwareApplication',
	comment: 'A software application.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:applicationCategory',
			name: 'applicationCategory',
			label: 'applicationCategory',
			comment: "Type of software application, e.g. 'Game, Multimedia'.",
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:applicationSubCategory',
			name: 'applicationSubCategory',
			label: 'applicationSubCategory',
			comment: "Subcategory of the application, e.g. 'Arcade Game'.",
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:applicationSuite',
			name: 'applicationSuite',
			label: 'applicationSuite',
			comment:
				'The name of the application suite to which the application belongs (e.g. Excel belongs to Office).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:availableOnDevice',
			name: 'availableOnDevice',
			label: 'availableOnDevice',
			comment:
				'Device required to run the application. Used in cases where a specific make/model is required to run the application.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:countriesNotSupported',
			name: 'countriesNotSupported',
			label: 'countriesNotSupported',
			comment:
				'Countries for which the application is not supported. You can also provide the two-letter ISO 3166-1 alpha-2 country code.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:countriesSupported',
			name: 'countriesSupported',
			label: 'countriesSupported',
			comment:
				'Countries for which the application is supported. You can also provide the two-letter ISO 3166-1 alpha-2 country code.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:device',
			name: 'device',
			label: 'device',
			comment:
				'Device required to run the application. Used in cases where a specific make/model is required to run the application.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:downloadUrl',
			name: 'downloadUrl',
			label: 'downloadUrl',
			comment: 'If the file can be downloaded, URL to download the binary.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:featureList',
			name: 'featureList',
			label: 'featureList',
			comment:
				'Features or modules provided by this application (and possibly required by other applications).',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:fileSize',
			name: 'fileSize',
			label: 'fileSize',
			comment:
				'Size of the application / package (e.g. 18MB). In the absence of a unit (MB, KB etc.), KB will be assumed.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:installUrl',
			name: 'installUrl',
			label: 'installUrl',
			comment: 'URL at which the app may be installed, if different from the URL of the item.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:memoryRequirements',
			name: 'memoryRequirements',
			label: 'memoryRequirements',
			comment: 'Minimum memory requirements.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:operatingSystem',
			name: 'operatingSystem',
			label: 'operatingSystem',
			comment: 'Operating systems supported (Windows 7, OS X 10.6, Android 1.6).',
			rangeIncludes: ['OperatingSystem', 'Text'],
		},
		{
			id: 'schema:permissions',
			name: 'permissions',
			label: 'permissions',
			comment:
				'Permission(s) required to run the app (for example, a mobile app may require full internet access or may run only on wifi).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:processorRequirements',
			name: 'processorRequirements',
			label: 'processorRequirements',
			comment: 'Processor architecture required to run the application (e.g. IA64).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:releaseNotes',
			name: 'releaseNotes',
			label: 'releaseNotes',
			comment: 'Description of what changed in this version.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:requirements',
			name: 'requirements',
			label: 'requirements',
			comment:
				'Component dependency requirements for application. This includes runtime environments and shared libraries that are not included in the application distribution package, but required to run the application (examples: DirectX, Java or .NET runtime).',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:runtimePlatform',
			name: 'runtimePlatform',
			label: 'runtimePlatform',
			comment:
				'Runtime platform or script interpreter dependencies (example: Java v1, Python 2.3, .NET Framework 3.0).',
			rangeIncludes: ['RuntimePlatform', 'Text'],
		},
		{
			id: 'schema:screenshot',
			name: 'screenshot',
			label: 'screenshot',
			comment: 'A link to a screenshot image of the app.',
			rangeIncludes: ['ImageObject', 'URL'],
		},
		{
			id: 'schema:softwareAddOn',
			name: 'softwareAddOn',
			label: 'softwareAddOn',
			comment: 'Additional content for a software application.',
			rangeIncludes: ['SoftwareApplication'],
		},
		{
			id: 'schema:softwareHelp',
			name: 'softwareHelp',
			label: 'softwareHelp',
			comment: 'Software application help.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:softwareRequirements',
			name: 'softwareRequirements',
			label: 'softwareRequirements',
			comment:
				'Component dependency requirements for application. This includes runtime environments and shared libraries that are not included in the application distribution package, but required to run the application (examples: DirectX, Java or .NET runtime).',
			rangeIncludes: ['SoftwareApplication', 'Text', 'URL'],
		},
		{
			id: 'schema:softwareVersion',
			name: 'softwareVersion',
			label: 'softwareVersion',
			comment: 'Version of the software instance.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:storageRequirements',
			name: 'storageRequirements',
			label: 'storageRequirements',
			comment: 'Storage requirements (free space required).',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:supportingData',
			name: 'supportingData',
			label: 'supportingData',
			comment: 'Supporting data for a SoftwareApplication.',
			rangeIncludes: ['DataFeed'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSoftwareApplication;
export const SoftwareApplication = schemaOrgSoftwareApplication;

export default schemaOrgSoftwareApplication;
