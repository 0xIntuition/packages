import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgXPathType = {
	id: 'schema:XPathType',
	name: 'XPathType',
	label: 'XPathType',
	comment: 'Text representing an XPath (typically but not necessarily version 1.0).',
	subClassOf: ['Text'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgXPathType;
export const XPathType = schemaOrgXPathType;

export default schemaOrgXPathType;
