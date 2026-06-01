import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSatiricalArticle = {
	id: 'schema:SatiricalArticle',
	name: 'SatiricalArticle',
	label: 'SatiricalArticle',
	comment:
		'An [[Article]] whose content is primarily [[satirical]](https://en.wikipedia.org/wiki/Satire) in nature, i.e. unlikely to be literally true. A satirical article is sometimes but not necessarily also a [[NewsArticle]]. [[ScholarlyArticle]]s are also sometimes satirized.',
	subClassOf: ['Article', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSatiricalArticle;
export const SatiricalArticle = schemaOrgSatiricalArticle;

export default schemaOrgSatiricalArticle;
