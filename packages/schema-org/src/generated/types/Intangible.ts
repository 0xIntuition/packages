import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgIntangible = {
	id: 'schema:Intangible',
	name: 'Intangible',
	label: 'Intangible',
	comment:
		"A utility class that serves as the umbrella for a number of 'intangible' things such as quantities, structured values, etc.",
	subClassOf: ['Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgIntangible;
export const Intangible = schemaOrgIntangible;

export default schemaOrgIntangible;
