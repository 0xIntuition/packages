import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgActionStatusType = {
	id: 'schema:ActionStatusType',
	name: 'ActionStatusType',
	label: 'ActionStatusType',
	comment: 'The status of an Action.',
	subClassOf: ['StatusEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgActionStatusType;
export const ActionStatusType = schemaOrgActionStatusType;

export default schemaOrgActionStatusType;
