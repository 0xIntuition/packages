import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWPSideBar = {
	id: 'schema:WPSideBar',
	name: 'WPSideBar',
	label: 'WPSideBar',
	comment: 'A sidebar section of the page.',
	subClassOf: ['WebPageElement', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWPSideBar;
export const WPSideBar = schemaOrgWPSideBar;

export default schemaOrgWPSideBar;
