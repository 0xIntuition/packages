import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHealthAspectEnumeration = {
	id: 'schema:HealthAspectEnumeration',
	name: 'HealthAspectEnumeration',
	label: 'HealthAspectEnumeration',
	comment:
		'HealthAspectEnumeration enumerates several aspects of health content online, each of which might be described using [[hasHealthAspect]] and [[HealthTopicContent]].',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHealthAspectEnumeration;
export const HealthAspectEnumeration = schemaOrgHealthAspectEnumeration;

export default schemaOrgHealthAspectEnumeration;
