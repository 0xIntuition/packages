import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCorporation = {
	id: 'schema:Corporation',
	name: 'Corporation',
	label: 'Corporation',
	comment: 'Organization: A business corporation.',
	subClassOf: ['Organization', 'Thing'],
	properties: [
		{
			id: 'schema:tickerSymbol',
			name: 'tickerSymbol',
			label: 'tickerSymbol',
			comment:
				'The exchange traded instrument associated with a Corporation object. The tickerSymbol is expressed as an exchange and an instrument name separated by a space character. For the exchange component of the tickerSymbol attribute, we recommend using the controlled vocabulary of Market Identifier Codes (MIC) specified in ISO 15022.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCorporation;
export const Corporation = schemaOrgCorporation;

export default schemaOrgCorporation;
