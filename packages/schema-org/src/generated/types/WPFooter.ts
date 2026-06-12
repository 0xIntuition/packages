import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWPFooter = {
	id: 'schema:WPFooter',
	name: 'WPFooter',
	label: 'WPFooter',
	comment: 'The footer section of the page.',
	subClassOf: ['WebPageElement', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWPFooter;
export const WPFooter = schemaOrgWPFooter;

export default schemaOrgWPFooter;
