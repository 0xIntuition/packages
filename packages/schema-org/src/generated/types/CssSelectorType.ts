import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCssSelectorType = {
	id: 'schema:CssSelectorType',
	name: 'CssSelectorType',
	label: 'CssSelectorType',
	comment: 'Text representing a CSS selector.',
	subClassOf: ['Text'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCssSelectorType;
export const CssSelectorType = schemaOrgCssSelectorType;

export default schemaOrgCssSelectorType;
