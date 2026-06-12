import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAdultOrientedEnumeration = {
	id: 'schema:AdultOrientedEnumeration',
	name: 'AdultOrientedEnumeration',
	label: 'AdultOrientedEnumeration',
	comment:
		'Enumeration of considerations that make a product relevant or potentially restricted for adults only.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAdultOrientedEnumeration;
export const AdultOrientedEnumeration = schemaOrgAdultOrientedEnumeration;

export default schemaOrgAdultOrientedEnumeration;
