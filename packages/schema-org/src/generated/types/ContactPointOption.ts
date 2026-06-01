import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgContactPointOption = {
	id: 'schema:ContactPointOption',
	name: 'ContactPointOption',
	label: 'ContactPointOption',
	comment: 'Enumerated options related to a ContactPoint.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgContactPointOption;
export const ContactPointOption = schemaOrgContactPointOption;

export default schemaOrgContactPointOption;
