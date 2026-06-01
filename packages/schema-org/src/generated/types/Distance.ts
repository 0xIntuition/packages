import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDistance = {
	id: 'schema:Distance',
	name: 'Distance',
	label: 'Distance',
	comment:
		"Properties that take Distances as values are of the form '&lt;Number&gt; &lt;Length unit of measure&gt;'. E.g., '7 ft'.",
	subClassOf: ['Quantity'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDistance;
export const Distance = schemaOrgDistance;

export default schemaOrgDistance;
