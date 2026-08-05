import type { ClassificationSpec } from '../../types.js';

export const software: ClassificationSpec = {
	slug: 'software',
	type: 'SoftwareSourceCode',
	displayName: 'Software',
	description: 'A code project or software identity with a canonical repository URL.',
	category: 'Product',
	schema: { context: 'https://schema.org/', type: 'SoftwareSourceCode' },
	metadataPredicates: ['createdBy', 'url', 'implement', 'compatibleWith', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Software Name',
			description: 'The software or project name.',
			fieldType: 'string',
			required: true,
			placeholder: 'intuition-data-structure',
		},
		{
			key: 'codeRepository',
			schemaProperty: 'codeRepository',
			label: 'Repository URL',
			description: 'The canonical code repository URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://github.com/0xintuition/intuition-data-structure',
		},
		{
			key: 'packageUrl',
			label: 'Package URL',
			description: 'The purl package coordinate, version-free.',
			fieldType: 'string',
			required: false,
			placeholder: 'pkg:npm/react',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same software.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
		},
	],
	defaults: { pluginId: 'software', provider: 'github' },
	identity: {
		identifies:
			'the package/project, version-free — purl (open spec) first; repo URLs migrate (F5)',
		ladder: [
			{ kind: 'scheme', scheme: 'purl', source: { kind: 'field', key: 'packageUrl' } },
			{ kind: 'scheme', scheme: 'url', source: { kind: 'field', key: 'codeRepository' } },
			{ kind: 'gen1', tag: 3, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};
