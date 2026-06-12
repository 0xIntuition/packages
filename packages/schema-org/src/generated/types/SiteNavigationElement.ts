import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSiteNavigationElement = {
	id: 'schema:SiteNavigationElement',
	name: 'SiteNavigationElement',
	label: 'SiteNavigationElement',
	comment: 'A navigation element of the page.',
	subClassOf: ['WebPageElement', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSiteNavigationElement;
export const SiteNavigationElement = schemaOrgSiteNavigationElement;

export default schemaOrgSiteNavigationElement;
