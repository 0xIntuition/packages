import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMediaEnumeration = {
	id: 'schema:MediaEnumeration',
	name: 'MediaEnumeration',
	label: 'MediaEnumeration',
	comment:
		'MediaEnumeration enumerations are lists of codes, labels etc. useful for describing media objects. They may be reflections of externally developed lists, or created at schema.org, or a combination.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMediaEnumeration;
export const MediaEnumeration = schemaOrgMediaEnumeration;

export default schemaOrgMediaEnumeration;
