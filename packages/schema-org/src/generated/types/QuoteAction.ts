import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQuoteAction = {
	id: 'schema:QuoteAction',
	name: 'QuoteAction',
	label: 'QuoteAction',
	comment:
		'An agent quotes/estimates/appraises an object/product/service with a price at a location/store.',
	subClassOf: ['TradeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgQuoteAction;
export const QuoteAction = schemaOrgQuoteAction;

export default schemaOrgQuoteAction;
