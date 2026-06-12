import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWPAdBlock = {
	id: 'schema:WPAdBlock',
	name: 'WPAdBlock',
	label: 'WPAdBlock',
	comment: 'An advertising section of the page.',
	subClassOf: ['WebPageElement', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWPAdBlock;
export const WPAdBlock = schemaOrgWPAdBlock;

export default schemaOrgWPAdBlock;
