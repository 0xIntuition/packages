import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgApartment = {
	id: 'schema:Apartment',
	name: 'Apartment',
	label: 'Apartment',
	comment:
		'An apartment (in American English) or flat (in British English) is a self-contained housing unit (a type of residential real estate) that occupies only part of a building (source: Wikipedia, the free encyclopedia, see <a href="http://en.wikipedia.org/wiki/Apartment">http://en.wikipedia.org/wiki/Apartment</a>).',
	subClassOf: ['Accommodation', 'Place', 'Thing'],
	properties: [
		{
			id: 'schema:numberOfRooms',
			name: 'numberOfRooms',
			label: 'numberOfRooms',
			comment:
				'The number of rooms (excluding bathrooms and closets) of the accommodation or lodging business.\nTypical unit code(s): ROM for room or C62 for no unit. The type of room can be put in the unitText property of the QuantitativeValue.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:occupancy',
			name: 'occupancy',
			label: 'occupancy',
			comment:
				'The allowed total occupancy for the accommodation in persons (including infants etc). For individual accommodations, this is not necessarily the legal maximum but defines the permitted usage as per the contractual agreement (e.g. a double room used by a single person).\nTypical unit code(s): C62 for person.',
			rangeIncludes: ['QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgApartment;
export const Apartment = schemaOrgApartment;

export default schemaOrgApartment;
