import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPhysicalActivityCategory = {
	id: 'schema:PhysicalActivityCategory',
	name: 'PhysicalActivityCategory',
	label: 'PhysicalActivityCategory',
	comment: 'Categories of physical activity, organized by physiologic classification.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPhysicalActivityCategory;
export const PhysicalActivityCategory = schemaOrgPhysicalActivityCategory;

export default schemaOrgPhysicalActivityCategory;
