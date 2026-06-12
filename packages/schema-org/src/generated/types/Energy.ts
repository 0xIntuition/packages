import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEnergy = {
	id: 'schema:Energy',
	name: 'Energy',
	label: 'Energy',
	comment:
		"Properties that take Energy as values are of the form '&lt;Number&gt; &lt;Energy unit of measure&gt;'.",
	subClassOf: ['Quantity'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEnergy;
export const Energy = schemaOrgEnergy;

export default schemaOrgEnergy;
