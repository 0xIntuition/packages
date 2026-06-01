import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPeriodical = {
	id: 'schema:Periodical',
	name: 'Periodical',
	label: 'Periodical',
	comment:
		'A publication in any medium issued in successive parts bearing numerical or chronological designations and intended to continue indefinitely, such as a magazine, scholarly journal, or newspaper.\\n\\nSee also [blog post](https://blog.schema.org/2014/09/02/schema-org-support-for-bibliographic-relationships-and-periodicals/).',
	subClassOf: ['CreativeWorkSeries', 'CreativeWork', 'Thing', 'Series', 'Intangible'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPeriodical;
export const Periodical = schemaOrgPeriodical;

export default schemaOrgPeriodical;
