import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSoftwareSourceCode = {
	id: 'schema:SoftwareSourceCode',
	name: 'SoftwareSourceCode',
	label: 'SoftwareSourceCode',
	comment:
		'Computer programming source code. Example: Full (compile ready) solutions, code snippet samples, scripts, templates.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:codeRepository',
			name: 'codeRepository',
			label: 'codeRepository',
			comment:
				'Link to the repository where the un-compiled, human readable code and related code is located (SVN, GitHub, CodePlex).',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:codeSampleType',
			name: 'codeSampleType',
			label: 'codeSampleType',
			comment:
				'What type of code sample: full (compile ready) solution, code snippet, inline code, scripts, template.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:programmingLanguage',
			name: 'programmingLanguage',
			label: 'programmingLanguage',
			comment: 'The computer programming language.',
			rangeIncludes: ['ComputerLanguage', 'Text'],
		},
		{
			id: 'schema:runtime',
			name: 'runtime',
			label: 'runtime',
			comment:
				'Runtime platform or script interpreter dependencies (example: Java v1, Python 2.3, .NET Framework 3.0).',
			rangeIncludes: ['Text'],
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
			id: 'schema:sampleType',
			name: 'sampleType',
			label: 'sampleType',
			comment:
				'What type of code sample: full (compile ready) solution, code snippet, inline code, scripts, template.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:targetProduct',
			name: 'targetProduct',
			label: 'targetProduct',
			comment:
				'Target Operating System / Product to which the code applies.  If applies to several versions, just the product name can be used.',
			rangeIncludes: ['SoftwareApplication'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSoftwareSourceCode;
export const SoftwareSourceCode = schemaOrgSoftwareSourceCode;

export default schemaOrgSoftwareSourceCode;
