import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOnlineStore = {
	id: 'schema:OnlineStore',
	name: 'OnlineStore',
	label: 'OnlineStore',
	comment: 'An eCommerce site.',
	subClassOf: ['OnlineBusiness', 'Organization', 'Thing'],
	properties: [
		{
			id: 'schema:isStoreOn',
			name: 'isStoreOn',
			label: 'isStoreOn',
			comment: 'The eCommerce marketplace this online store is on.',
			rangeIncludes: ['OnlineMarketplace'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOnlineStore;
export const OnlineStore = schemaOrgOnlineStore;

export default schemaOrgOnlineStore;
