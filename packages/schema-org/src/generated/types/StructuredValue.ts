import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgStructuredValue = {
	id: 'schema:StructuredValue',
	name: 'StructuredValue',
	label: 'StructuredValue',
	comment:
		'Structured values are used when the value of a property has a more complex structure than simply being a textual value or a reference to another thing.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgStructuredValue;
export const StructuredValue = schemaOrgStructuredValue;

export default schemaOrgStructuredValue;
