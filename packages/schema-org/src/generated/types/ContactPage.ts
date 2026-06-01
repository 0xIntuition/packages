import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgContactPage = {
	id: 'schema:ContactPage',
	name: 'ContactPage',
	label: 'ContactPage',
	comment: 'Web page type: Contact page.',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgContactPage;
export const ContactPage = schemaOrgContactPage;

export default schemaOrgContactPage;
