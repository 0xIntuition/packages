import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFAQPage = {
	id: 'schema:FAQPage',
	name: 'FAQPage',
	label: 'FAQPage',
	comment:
		'A [[FAQPage]] is a [[WebPage]] presenting one or more "[Frequently asked questions](https://en.wikipedia.org/wiki/FAQ)" (see also [[QAPage]]).',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFAQPage;
export const FAQPage = schemaOrgFAQPage;

export default schemaOrgFAQPage;
