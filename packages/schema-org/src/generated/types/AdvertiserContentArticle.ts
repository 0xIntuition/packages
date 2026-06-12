import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAdvertiserContentArticle = {
	id: 'schema:AdvertiserContentArticle',
	name: 'AdvertiserContentArticle',
	label: 'AdvertiserContentArticle',
	comment:
		'An [[Article]] that an external entity has paid to place or to produce to its specifications. Includes [advertorials](https://en.wikipedia.org/wiki/Advertorial), sponsored content, native advertising and other paid content.',
	subClassOf: ['Article', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAdvertiserContentArticle;
export const AdvertiserContentArticle = schemaOrgAdvertiserContentArticle;

export default schemaOrgAdvertiserContentArticle;
