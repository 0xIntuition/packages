import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMass = {
	id: 'schema:Mass',
	name: 'Mass',
	label: 'Mass',
	comment:
		"Properties that take Mass as values are of the form '&lt;Number&gt; &lt;Mass unit of measure&gt;'. E.g., '7 kg'.",
	subClassOf: ['Quantity'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMass;
export const Mass = schemaOrgMass;

export default schemaOrgMass;
