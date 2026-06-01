import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWPHeader = {
	id: 'schema:WPHeader',
	name: 'WPHeader',
	label: 'WPHeader',
	comment: 'The header section of the page.',
	subClassOf: ['WebPageElement', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWPHeader;
export const WPHeader = schemaOrgWPHeader;

export default schemaOrgWPHeader;
