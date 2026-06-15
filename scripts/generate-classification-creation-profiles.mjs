#!/usr/bin/env bun

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const generatedRoot = resolve(repoRoot, 'packages/classifications/src/generated/creation');

const [{ CLASSIFICATION_SPECS }, { getMetadataPredicateRelation }, schemaOrg, predicates] =
	await Promise.all([
		import('../packages/classifications/src/generated/index.ts'),
		import('../packages/classifications/src/metadata-predicate-matrix.ts'),
		import('../packages/schema-org/src/index.ts'),
		import('../packages/predicates/src/index.ts'),
	]);

function variableNameForSlug(slug) {
	return `${slug.replace(/-([a-z0-9])/g, (_, value) => value.toUpperCase())}CreationProfile`;
}

function sortBySlug(left, right) {
	return left.slug.localeCompare(right.slug);
}

function jsonLiteral(value) {
	return JSON.stringify(value, null, '\t');
}

function schemaPropertiesFor(spec) {
	if (spec.schema?.context !== SCHEMA_ORG_CONTEXT) {
		return [];
	}

	return schemaOrg.getPropertiesFor(spec.schema.type);
}

function fieldSchemaProvenance(field, schemaProperties) {
	if (!field.schemaProperty) {
		return null;
	}

	const schemaProperty = schemaProperties.find((property) => property.name === field.schemaProperty);

	if (!schemaProperty) {
		return null;
	}

	return {
		context: SCHEMA_ORG_CONTEXT,
		property: schemaProperty.name,
		propertyId: schemaProperty.id,
		label: schemaProperty.label,
		comment: schemaProperty.comment,
		originType: schemaProperty.originType,
		originTypeId: schemaProperty.originTypeId,
		rangeIncludes: schemaProperty.rangeIncludes,
	};
}

function creationFieldFor(field, schemaProperties) {
	const creationField = {
		key: field.key,
		label: field.label,
		description: field.description,
		fieldType: field.fieldType,
		required: field.required,
		...(field.placeholder ? { placeholder: field.placeholder } : {}),
		...(field.schemaProperty ? { schemaProperty: field.schemaProperty } : {}),
		schema: fieldSchemaProvenance(field, schemaProperties),
	};

	return creationField;
}

function predicateSummaryFor(predicateKey) {
	const predicateRecord = predicates.getPredicateRecord(predicateKey);
	const predicateId = predicates.getPredicateId(predicateKey);

	if (!predicateRecord || !predicateId) {
		throw new Error(`Unknown predicate referenced by creation profile: ${predicateKey}`);
	}

	return {
		key: predicateRecord.key,
		id: predicateId,
		label: predicateRecord.name,
		description: predicateRecord.description,
		status: predicateRecord.status,
		category: predicateRecord.category,
		marketPattern: predicateRecord.marketPattern,
	};
}

function relationshipFor(spec, predicateKey) {
	const matrixEntry = getMetadataPredicateRelation(spec.slug, predicateKey);

	if (!matrixEntry) {
		throw new Error(`Missing metadata predicate matrix row for ${spec.slug}.${predicateKey}`);
	}

	return {
		subjectClassification: matrixEntry.subjectClassification,
		predicate: predicateSummaryFor(predicateKey),
		expectedObjects: matrixEntry.expectedObjects,
		...(matrixEntry.schemaMappings ? { schemaMappings: matrixEntry.schemaMappings } : {}),
		...(matrixEntry.priority ? { priority: matrixEntry.priority } : {}),
		...(matrixEntry.notes ? { notes: matrixEntry.notes } : {}),
	};
}

function profileForSpec(spec) {
	const schemaProperties = schemaPropertiesFor(spec);

	return {
		classification: {
			slug: spec.slug,
			type: spec.type,
			displayName: spec.displayName,
			description: spec.description,
			category: spec.category,
			schema: spec.schema,
		},
		fields: spec.fields.map((field) => creationFieldFor(field, schemaProperties)),
		relationships: spec.metadataPredicates.map((predicateKey) => relationshipFor(spec, predicateKey)),
		availableFieldCount: schemaProperties.length || spec.fields.length,
	};
}

function moduleSourceForProfile(spec, profile) {
	const exportName = variableNameForSlug(spec.slug);

	return `import type { CreationProfile } from '../../creation-profile.js';

export const ${exportName} = ${jsonLiteral(profile)} as const satisfies CreationProfile;

export const creationProfile = ${exportName};
export default ${exportName};
`;
}

function indexSource(specs) {
	const sortedSpecs = [...specs].sort(sortBySlug);
	const imports = sortedSpecs
		.map(
			(spec) =>
				`import { ${variableNameForSlug(spec.slug)} } from './${spec.slug}.js';`
		)
		.join('\n');
	const exports = sortedSpecs
		.map(
			(spec) =>
				`export { ${variableNameForSlug(spec.slug)} } from './${spec.slug}.js';`
		)
		.join('\n');
	const profileEntries = sortedSpecs
		.map((spec) => `\t${variableNameForSlug(spec.slug)},`)
		.join('\n');
	const slugEntries = sortedSpecs.map((spec) => `\t'${spec.slug}',`).join('\n');

	return `import type { CreationProfile } from '../../creation-profile.js';
${imports}

${exports}

export const CREATION_PROFILES = [
${profileEntries}
] as const satisfies readonly CreationProfile[];

export const CREATION_PROFILE_SLUGS = [
${slugEntries}
] as const;
`;
}

function formatGeneratedFiles() {
	const biomeBin = resolve(repoRoot, 'node_modules/.bin/biome');

	execFileSync(biomeBin, ['check', '--write', 'packages/classifications/src/generated/creation'], {
		cwd: repoRoot,
		stdio: 'inherit',
	});
}

const sortedSpecs = [...CLASSIFICATION_SPECS].sort(sortBySlug);

rmSync(generatedRoot, { force: true, recursive: true });
mkdirSync(generatedRoot, { recursive: true });

for (const spec of sortedSpecs) {
	writeFileSync(
		resolve(generatedRoot, `${spec.slug}.ts`),
		moduleSourceForProfile(spec, profileForSpec(spec))
	);
}

writeFileSync(resolve(generatedRoot, 'index.ts'), indexSource(sortedSpecs));
formatGeneratedFiles();
