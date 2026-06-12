import { SCHEMA_ORG_TYPES } from './generated/index.js';
import type { ResolvedSchemaOrgPropertySpec, SchemaOrgTypeSpec } from './types.js';

const TYPE_BY_NAME = new Map<string, SchemaOrgTypeSpec>();

for (const type of SCHEMA_ORG_TYPES) {
	TYPE_BY_NAME.set(type.name, type);
	TYPE_BY_NAME.set(type.id, type);
	TYPE_BY_NAME.set(`https://schema.org/${type.name}`, type);
}

export function normalizeSchemaOrgName(name: string): string {
	if (name.startsWith('schema:')) {
		return name.slice('schema:'.length);
	}

	if (name.startsWith('https://schema.org/')) {
		return name.slice('https://schema.org/'.length);
	}

	return name;
}

export function listTypes(): readonly SchemaOrgTypeSpec[] {
	return SCHEMA_ORG_TYPES;
}

export function getType(name: string): SchemaOrgTypeSpec | undefined {
	return TYPE_BY_NAME.get(name) ?? TYPE_BY_NAME.get(normalizeSchemaOrgName(name));
}

export function hasType(name: string): boolean {
	return getType(name) !== undefined;
}

export function getPropertiesFor(name: string): readonly ResolvedSchemaOrgPropertySpec[] {
	const type = getType(name);

	if (!type) {
		return [];
	}

	const properties: ResolvedSchemaOrgPropertySpec[] = [];
	const seenProperties = new Set<string>();

	for (const originTypeName of [type.name, ...type.subClassOf]) {
		const originType = getType(originTypeName);

		if (!originType) {
			continue;
		}

		for (const property of originType.properties) {
			if (seenProperties.has(property.id)) {
				continue;
			}

			seenProperties.add(property.id);
			properties.push({
				...property,
				originType: originType.name,
				originTypeId: originType.id,
			});
		}
	}

	return properties;
}
