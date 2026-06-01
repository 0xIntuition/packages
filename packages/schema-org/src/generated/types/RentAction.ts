import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRentAction = {
	id: 'schema:RentAction',
	name: 'RentAction',
	label: 'RentAction',
	comment:
		'The act of giving money in return for temporary use, but not ownership, of an object such as a vehicle or property. For example, an agent rents a property from a landlord in exchange for a periodic payment.',
	subClassOf: ['TradeAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:landlord',
			name: 'landlord',
			label: 'landlord',
			comment: 'A sub property of participant. The owner of the real estate property.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:realEstateAgent',
			name: 'realEstateAgent',
			label: 'realEstateAgent',
			comment: 'A sub property of participant. The real estate agent involved in the action.',
			rangeIncludes: ['RealEstateAgent'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRentAction;
export const RentAction = schemaOrgRentAction;

export default schemaOrgRentAction;
