import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgApartmentComplex = {
	id: 'schema:ApartmentComplex',
	name: 'ApartmentComplex',
	label: 'ApartmentComplex',
	comment: 'Residence type: Apartment complex.',
	subClassOf: ['Residence', 'Place', 'Thing'],
	properties: [
		{
			id: 'schema:numberOfAccommodationUnits',
			name: 'numberOfAccommodationUnits',
			label: 'numberOfAccommodationUnits',
			comment:
				'Indicates the total (available plus unavailable) number of accommodation units in an [[ApartmentComplex]], or the number of accommodation units for a specific [[FloorPlan]] (within its specific [[ApartmentComplex]]). See also [[numberOfAvailableAccommodationUnits]].',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:numberOfAvailableAccommodationUnits',
			name: 'numberOfAvailableAccommodationUnits',
			label: 'numberOfAvailableAccommodationUnits',
			comment:
				'Indicates the number of available accommodation units in an [[ApartmentComplex]], or the number of accommodation units for a specific [[FloorPlan]] (within its specific [[ApartmentComplex]]). See also [[numberOfAccommodationUnits]].',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:numberOfBedrooms',
			name: 'numberOfBedrooms',
			label: 'numberOfBedrooms',
			comment:
				'The total integer number of bedrooms in a some [[Accommodation]], [[ApartmentComplex]] or [[FloorPlan]].',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:petsAllowed',
			name: 'petsAllowed',
			label: 'petsAllowed',
			comment:
				'Indicates whether pets are allowed to enter the accommodation or lodging business. More detailed information can be put in a text value.',
			rangeIncludes: ['Boolean', 'Text'],
		},
		{
			id: 'schema:tourBookingPage',
			name: 'tourBookingPage',
			label: 'tourBookingPage',
			comment:
				'A page providing information on how to book a tour of some [[Place]], such as an [[Accommodation]] or [[ApartmentComplex]] in a real estate setting, as well as other kinds of tours as appropriate.',
			rangeIncludes: ['URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgApartmentComplex;
export const ApartmentComplex = schemaOrgApartmentComplex;

export default schemaOrgApartmentComplex;
