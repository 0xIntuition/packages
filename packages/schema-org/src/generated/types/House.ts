import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHouse = {
	id: 'schema:House',
	name: 'House',
	label: 'House',
	comment:
		'A house is a building or structure that has the ability to be occupied for habitation by humans or other creatures (source: Wikipedia, the free encyclopedia, see <a href="http://en.wikipedia.org/wiki/House">http://en.wikipedia.org/wiki/House</a>).',
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
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHouse;
export const House = schemaOrgHouse;

export default schemaOrgHouse;
