import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTaxiStand = {
	id: 'schema:TaxiStand',
	name: 'TaxiStand',
	label: 'TaxiStand',
	comment: 'A taxi stand.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTaxiStand;
export const TaxiStand = schemaOrgTaxiStand;

export default schemaOrgTaxiStand;
