import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLodgingReservation = {
	id: 'schema:LodgingReservation',
	name: 'LodgingReservation',
	label: 'LodgingReservation',
	comment:
		'A reservation for lodging at a hotel, motel, inn, etc.\\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations.',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:checkinTime',
			name: 'checkinTime',
			label: 'checkinTime',
			comment: 'The earliest someone may check into a lodging establishment.',
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:checkoutTime',
			name: 'checkoutTime',
			label: 'checkoutTime',
			comment: 'The latest someone may check out of a lodging establishment.',
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:lodgingUnitDescription',
			name: 'lodgingUnitDescription',
			label: 'lodgingUnitDescription',
			comment: 'A full description of the lodging unit.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:lodgingUnitType',
			name: 'lodgingUnitType',
			label: 'lodgingUnitType',
			comment:
				'Textual description of the unit type (including suite vs. room, size of bed, etc.).',
			rangeIncludes: ['QualitativeValue', 'Text'],
		},
		{
			id: 'schema:numAdults',
			name: 'numAdults',
			label: 'numAdults',
			comment: 'The number of adults staying in the unit.',
			rangeIncludes: ['Integer', 'QuantitativeValue'],
		},
		{
			id: 'schema:numChildren',
			name: 'numChildren',
			label: 'numChildren',
			comment: 'The number of children staying in the unit.',
			rangeIncludes: ['Integer', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLodgingReservation;
export const LodgingReservation = schemaOrgLodgingReservation;

export default schemaOrgLodgingReservation;
