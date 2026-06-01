import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSeat = {
	id: 'schema:Seat',
	name: 'Seat',
	label: 'Seat',
	comment: 'Used to describe a seat, such as a reserved seat in an event reservation.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:seatNumber',
			name: 'seatNumber',
			label: 'seatNumber',
			comment: 'The location of the reserved seat (e.g., 27).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:seatRow',
			name: 'seatRow',
			label: 'seatRow',
			comment: 'The row location of the reserved seat (e.g., B).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:seatSection',
			name: 'seatSection',
			label: 'seatSection',
			comment: 'The section location of the reserved seat (e.g. Orchestra).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:seatingType',
			name: 'seatingType',
			label: 'seatingType',
			comment: 'The type/class of the seat.',
			rangeIncludes: ['QualitativeValue', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSeat;
export const Seat = schemaOrgSeat;

export default schemaOrgSeat;
