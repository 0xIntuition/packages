import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTaxiService = {
	id: 'schema:TaxiService',
	name: 'TaxiService',
	label: 'TaxiService',
	comment:
		'A service for a vehicle for hire with a driver for local travel. Fares are usually calculated based on distance traveled.',
	subClassOf: ['Service', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTaxiService;
export const TaxiService = schemaOrgTaxiService;

export default schemaOrgTaxiService;
