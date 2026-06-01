import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCurrencyConversionService = {
	id: 'schema:CurrencyConversionService',
	name: 'CurrencyConversionService',
	label: 'CurrencyConversionService',
	comment: 'A service to convert funds from one currency to another currency.',
	subClassOf: ['FinancialProduct', 'Service', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCurrencyConversionService;
export const CurrencyConversionService = schemaOrgCurrencyConversionService;

export default schemaOrgCurrencyConversionService;
