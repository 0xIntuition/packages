import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOnlineMarketplace = {
	id: 'schema:OnlineMarketplace',
	name: 'OnlineMarketplace',
	label: 'OnlineMarketplace',
	comment: 'An eCommerce marketplace.',
	subClassOf: ['OnlineStore', 'OnlineBusiness', 'Organization', 'Thing'],
	properties: [
		{
			id: 'schema:hasStore',
			name: 'hasStore',
			label: 'hasStore',
			comment: 'An eCommerce store part of an online marketplace.',
			rangeIncludes: ['OnlineStore'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOnlineMarketplace;
export const OnlineMarketplace = schemaOrgOnlineMarketplace;

export default schemaOrgOnlineMarketplace;
