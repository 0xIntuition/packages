import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMapCategoryType = {
	id: 'schema:MapCategoryType',
	name: 'MapCategoryType',
	label: 'MapCategoryType',
	comment: 'An enumeration of several kinds of Map.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMapCategoryType;
export const MapCategoryType = schemaOrgMapCategoryType;

export default schemaOrgMapCategoryType;
