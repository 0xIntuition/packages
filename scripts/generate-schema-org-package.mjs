#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';
const SCHEMA_ORG_VERSION = '30.0';
const SCHEMA_ORG_RELEASE_DATE = '2026-03-19';
const SCHEMA_ORG_SOURCE_URL = 'https://schema.org/version/30.0/schemaorg-current-https.jsonld';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const packageRoot = resolve(repoRoot, 'packages/schema-org');
const generatedRoot = resolve(packageRoot, 'src/generated');
const generatedTypesRoot = resolve(generatedRoot, 'types');
const restrictedGlobalExportNames = new Set([
	'Array',
	'Boolean',
	'Date',
	'Error',
	'Map',
	'Number',
	'Object',
	'Promise',
	'RegExp',
	'Set',
	'String',
	'Symbol',
	'URL',
	'WeakMap',
	'WeakSet',
]);

function asArray(value) {
	if (value === undefined || value === null) {
		return [];
	}

	return Array.isArray(value) ? value : [value];
}

function hasType(node, typeName) {
	return asArray(node['@type']).includes(typeName);
}

function textValue(value) {
	if (typeof value === 'string') {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(textValue).filter(Boolean).join(' ');
	}

	if (value && typeof value === 'object') {
		if (typeof value['@value'] === 'string') {
			return value['@value'];
		}

		if (typeof value['@id'] === 'string') {
			return value['@id'];
		}
	}

	return '';
}

function idValue(value) {
	if (typeof value === 'string') {
		return value;
	}

	if (value && typeof value === 'object' && typeof value['@id'] === 'string') {
		return value['@id'];
	}

	return undefined;
}

function idsFrom(value) {
	return asArray(value).map(idValue).filter((id) => typeof id === 'string');
}

function schemaNameFromId(id) {
	if (id.startsWith('schema:')) {
		return id.slice('schema:'.length);
	}

	if (id.startsWith(SCHEMA_ORG_CONTEXT)) {
		return id.slice(SCHEMA_ORG_CONTEXT.length);
	}

	return id;
}

function isSchemaNode(node) {
	return typeof node['@id'] === 'string' && node['@id'].startsWith('schema:');
}

function isIdentifier(value) {
	return /^[$A-Z_a-z][$\w]*$/.test(value);
}

function canExportExactTypeName(typeName) {
	return isIdentifier(typeName) && !restrictedGlobalExportNames.has(typeName);
}

function aliasForTypeName(typeName) {
	return `schemaOrg${typeName.replace(/[^$\w]/g, '_')}`;
}

function sortByName(left, right) {
	if (left.name < right.name) {
		return -1;
	}

	if (left.name > right.name) {
		return 1;
	}

	return 0;
}

function jsonLiteral(value) {
	return JSON.stringify(value, null, '\t');
}

function moduleSourceForType(typeSpec) {
	const alias = aliasForTypeName(typeSpec.name);
	const exactExport = canExportExactTypeName(typeSpec.name)
		? `\nexport const ${typeSpec.name} = ${alias};\n`
		: '\n';

	return `import type { SchemaOrgTypeSpec } from '../../types.js';

export const ${alias} = ${jsonLiteral(typeSpec)} as const satisfies SchemaOrgTypeSpec;

export const spec = ${alias};${exactExport}
export default ${alias};
`;
}

function metadataSource({ propertyCount, typeCount }) {
	return `export const SCHEMA_ORG_CONTEXT = '${SCHEMA_ORG_CONTEXT}' as const;
export const SCHEMA_ORG_VERSION = '${SCHEMA_ORG_VERSION}' as const;
export const SCHEMA_ORG_RELEASE_DATE = '${SCHEMA_ORG_RELEASE_DATE}' as const;
export const SCHEMA_ORG_SOURCE_URL = '${SCHEMA_ORG_SOURCE_URL}' as const;
export const SCHEMA_ORG_GENERATED_TYPE_COUNT = ${typeCount} as const;
export const SCHEMA_ORG_GENERATED_PROPERTY_COUNT = ${propertyCount} as const;
`;
}

function indexSource(typeSpecs) {
	const imports = typeSpecs
		.map(({ name }) => `import { ${aliasForTypeName(name)} } from './types/${name}.js';`)
		.join('\n');
	const exports = typeSpecs
		.flatMap(({ name }) => {
			const names = [`${aliasForTypeName(name)}`];
			if (canExportExactTypeName(name)) {
				names.push(name);
			}

			return [`export { ${names.join(', ')} } from './types/${name}.js';`];
		})
		.join('\n');
	const entries = typeSpecs.map(({ name }) => `\t${aliasForTypeName(name)},`).join('\n');

	return `import type { SchemaOrgTypeSpec } from '../types.js';
${imports}

export {
	SCHEMA_ORG_CONTEXT,
	SCHEMA_ORG_GENERATED_PROPERTY_COUNT,
	SCHEMA_ORG_GENERATED_TYPE_COUNT,
	SCHEMA_ORG_RELEASE_DATE,
	SCHEMA_ORG_SOURCE_URL,
	SCHEMA_ORG_VERSION,
} from './metadata.js';
${exports}

export const SCHEMA_ORG_TYPES: readonly SchemaOrgTypeSpec[] = [
${entries}
];
`;
}

function formatGeneratedFiles() {
	const biomeBin = resolve(repoRoot, 'node_modules/.bin/biome');

	execFileSync(biomeBin, ['check', '--write', 'packages/schema-org/src/generated'], {
		cwd: repoRoot,
		stdio: 'inherit',
	});
}

async function fetchSchemaOrgGraph() {
	const response = await fetch(SCHEMA_ORG_SOURCE_URL);

	if (!response.ok) {
		throw new Error(`Failed to fetch ${SCHEMA_ORG_SOURCE_URL}: ${response.status} ${response.statusText}`);
	}

	const body = await response.json();
	const graph = body['@graph'];

	if (!Array.isArray(graph)) {
		throw new Error('schema.org JSON-LD response did not include an @graph array.');
	}

	return graph;
}

function buildVocabulary(graph) {
	const classNodes = graph.filter((node) => hasType(node, 'rdfs:Class') && isSchemaNode(node));
	const propertyNodes = graph.filter((node) => hasType(node, 'rdf:Property') && isSchemaNode(node));
	const classNames = new Set(classNodes.map((node) => schemaNameFromId(node['@id'])));
	const directParentsByClass = new Map();
	const propertiesByClass = new Map();

	for (const classNode of classNodes) {
		const className = schemaNameFromId(classNode['@id']);
		const parentNames = idsFrom(classNode['rdfs:subClassOf'])
			.map(schemaNameFromId)
			.filter((name) => classNames.has(name))
			.sort();

		directParentsByClass.set(className, parentNames);
		propertiesByClass.set(className, []);
	}

	for (const propertyNode of propertyNodes) {
		const propertyId = propertyNode['@id'];
		const propertySpec = {
			id: propertyId,
			name: schemaNameFromId(propertyId),
			label: textValue(propertyNode['rdfs:label']),
			comment: textValue(propertyNode['rdfs:comment']),
			rangeIncludes: idsFrom(propertyNode['schema:rangeIncludes']).map(schemaNameFromId).sort(),
		};

		for (const domainName of idsFrom(propertyNode['schema:domainIncludes']).map(schemaNameFromId)) {
			const properties = propertiesByClass.get(domainName);

			if (properties) {
				properties.push(propertySpec);
			}
		}
	}

	function resolveSubClassChain(className, seen = new Set()) {
		const parents = directParentsByClass.get(className) ?? [];
		const chain = [];

		for (const parent of parents) {
			if (seen.has(parent)) {
				continue;
			}

			seen.add(parent);
			chain.push(parent, ...resolveSubClassChain(parent, seen));
		}

		return chain;
	}

	const typeSpecs = classNodes
		.map((classNode) => {
			const name = schemaNameFromId(classNode['@id']);
			const properties = propertiesByClass.get(name) ?? [];

			return {
				id: classNode['@id'],
				name,
				label: textValue(classNode['rdfs:label']),
				comment: textValue(classNode['rdfs:comment']),
				subClassOf: resolveSubClassChain(name),
				properties: [...properties].sort(sortByName),
			};
		})
		.sort(sortByName);

	return {
		propertyCount: propertyNodes.length,
		typeSpecs,
	};
}

const graph = await fetchSchemaOrgGraph();
const { propertyCount, typeSpecs } = buildVocabulary(graph);

rmSync(generatedRoot, { force: true, recursive: true });
mkdirSync(generatedTypesRoot, { recursive: true });

for (const typeSpec of typeSpecs) {
	writeFileSync(resolve(generatedTypesRoot, `${typeSpec.name}.ts`), moduleSourceForType(typeSpec));
}

writeFileSync(resolve(generatedRoot, 'metadata.ts'), metadataSource({ propertyCount, typeCount: typeSpecs.length }));
writeFileSync(resolve(generatedRoot, 'index.ts'), indexSource(typeSpecs));
formatGeneratedFiles();

console.log(
	`Generated ${typeSpecs.length} schema.org type modules and ${propertyCount} property records from V${SCHEMA_ORG_VERSION}.`
);
