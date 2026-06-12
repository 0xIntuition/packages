import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAdministrativeArea = {
	id: 'schema:AdministrativeArea',
	name: 'AdministrativeArea',
	label: 'AdministrativeArea',
	comment: 'A geographical region, typically under the jurisdiction of a particular government.',
	subClassOf: ['Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAdministrativeArea;
export const AdministrativeArea = schemaOrgAdministrativeArea;

export default schemaOrgAdministrativeArea;
