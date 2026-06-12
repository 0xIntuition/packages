import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQAPage = {
	id: 'schema:QAPage',
	name: 'QAPage',
	label: 'QAPage',
	comment:
		'A QAPage is a WebPage focussed on a specific Question and its Answer(s), e.g. in a question answering site or documenting Frequently Asked Questions (FAQs).',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgQAPage;
export const QAPage = schemaOrgQAPage;

export default schemaOrgQAPage;
