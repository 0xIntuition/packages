import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFoodEstablishmentReservation = {
	id: 'schema:FoodEstablishmentReservation',
	name: 'FoodEstablishmentReservation',
	label: 'FoodEstablishmentReservation',
	comment:
		'A reservation to dine at a food-related business.\\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations.',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:endTime',
			name: 'endTime',
			label: 'endTime',
			comment:
				"The endTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to end. For actions that span a period of time, when the action was performed. E.g. John wrote a book from January to *December*. For media, including audio and video, it's the time offset of the end of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:partySize',
			name: 'partySize',
			label: 'partySize',
			comment: 'Number of people the reservation should accommodate.',
			rangeIncludes: ['Integer', 'QuantitativeValue'],
		},
		{
			id: 'schema:startTime',
			name: 'startTime',
			label: 'startTime',
			comment:
				"The startTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to start. For actions that span a period of time, when the action was performed. E.g. John wrote a book from *January* to December. For media, including audio and video, it's the time offset of the start of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
			rangeIncludes: ['DateTime', 'Time'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFoodEstablishmentReservation;
export const FoodEstablishmentReservation = schemaOrgFoodEstablishmentReservation;

export default schemaOrgFoodEstablishmentReservation;
