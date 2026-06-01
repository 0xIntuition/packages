import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTrip = {
	id: 'schema:Trip',
	name: 'Trip',
	label: 'Trip',
	comment: 'A trip or journey. An itinerary of visits to one or more places.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:arrivalTime',
			name: 'arrivalTime',
			label: 'arrivalTime',
			comment: 'The expected arrival time.',
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:departureTime',
			name: 'departureTime',
			label: 'departureTime',
			comment: 'The expected departure time.',
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:itinerary',
			name: 'itinerary',
			label: 'itinerary',
			comment:
				'Destination(s) ( [[Place]] ) that make up a trip. For a trip where destination order is important use [[ItemList]] to specify that order (see examples).',
			rangeIncludes: ['ItemList', 'Place'],
		},
		{
			id: 'schema:offers',
			name: 'offers',
			label: 'offers',
			comment:
				'An offer to provide this item&#x2014;for example, an offer to sell a product, rent the DVD of a movie, perform a service, or give away tickets to an event. Use [[businessFunction]] to indicate the kind of transaction offered, i.e. sell, lease, etc. This property can also be used to describe a [[Demand]]. While this property is listed as expected on a number of common types, it can be used in others. In that case, using a second type, such as Product or a subtype of Product, can clarify the nature of the offer.\n      ',
			rangeIncludes: ['Demand', 'Offer'],
		},
		{
			id: 'schema:partOfTrip',
			name: 'partOfTrip',
			label: 'partOfTrip',
			comment:
				'Identifies that this [[Trip]] is a subTrip of another Trip.  For example Day 1, Day 2, etc. of a multi-day trip.',
			rangeIncludes: ['Trip'],
		},
		{
			id: 'schema:provider',
			name: 'provider',
			label: 'provider',
			comment:
				'The service provider, service operator, or service performer; the goods producer. Another party (a seller) may offer those services or goods on behalf of the provider. A provider may also serve as the seller.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:subTrip',
			name: 'subTrip',
			label: 'subTrip',
			comment:
				'Identifies a [[Trip]] that is a subTrip of this Trip.  For example Day 1, Day 2, etc. of a multi-day trip.',
			rangeIncludes: ['Trip'],
		},
		{
			id: 'schema:tripOrigin',
			name: 'tripOrigin',
			label: 'tripOrigin',
			comment: 'The location of origin of the trip, prior to any destination(s).',
			rangeIncludes: ['Place'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTrip;
export const Trip = schemaOrgTrip;

export default schemaOrgTrip;
