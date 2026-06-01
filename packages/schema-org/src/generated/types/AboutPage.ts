import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAboutPage = {
	id: 'schema:AboutPage',
	name: 'AboutPage',
	label: 'AboutPage',
	comment: 'Web page type: About page.',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAboutPage;
export const AboutPage = schemaOrgAboutPage;

export default schemaOrgAboutPage;
