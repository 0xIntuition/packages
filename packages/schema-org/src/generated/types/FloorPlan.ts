import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFloorPlan = {
	id: 'schema:FloorPlan',
	name: 'FloorPlan',
	label: 'FloorPlan',
	comment:
		'A FloorPlan is an explicit representation of a collection of similar accommodations, allowing the provision of common information (room counts, sizes, layout diagrams) and offers for rental or sale. In typical use, some [[ApartmentComplex]] has an [[accommodationFloorPlan]] which is a [[FloorPlan]].  A FloorPlan is always in the context of a particular place, either a larger [[ApartmentComplex]] or a single [[Apartment]]. The visual/spatial aspects of a floor plan (i.e. room layout, [see wikipedia](https://en.wikipedia.org/wiki/Floor_plan)) can be indicated using [[image]]. ',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:amenityFeature',
			name: 'amenityFeature',
			label: 'amenityFeature',
			comment:
				'An amenity feature (e.g. a characteristic or service) of the Accommodation. This generic property does not make a statement about whether the feature is included in an offer for the main accommodation or available at extra costs.',
			rangeIncludes: ['LocationFeatureSpecification'],
		},
		{
			id: 'schema:floorSize',
			name: 'floorSize',
			label: 'floorSize',
			comment:
				'The size of the accommodation, e.g. in square meter or squarefoot.\nTypical unit code(s): MTK for square meter, FTK for square foot, or YDK for square yard.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:isPlanForApartment',
			name: 'isPlanForApartment',
			label: 'isPlanForApartment',
			comment: 'Indicates some accommodation that this floor plan describes.',
			rangeIncludes: ['Accommodation'],
		},
		{
			id: 'schema:layoutImage',
			name: 'layoutImage',
			label: 'layoutImage',
			comment: 'A schematic image showing the floorplan layout.',
			rangeIncludes: ['ImageObject', 'URL'],
		},
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
			id: 'schema:numberOfBathroomsTotal',
			name: 'numberOfBathroomsTotal',
			label: 'numberOfBathroomsTotal',
			comment:
				'The total integer number of bathrooms in some [[Accommodation]], following real estate conventions as [documented in RESO](https://ddwiki.reso.org/display/DDW17/BathroomsTotalInteger+Field): "The simple sum of the number of bathrooms. For example for a property with two Full Bathrooms and one Half Bathroom, the Bathrooms Total Integer will be 3.". See also [[numberOfRooms]].',
			rangeIncludes: ['Integer'],
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
			id: 'schema:numberOfFullBathrooms',
			name: 'numberOfFullBathrooms',
			label: 'numberOfFullBathrooms',
			comment:
				'Number of full bathrooms - The total number of full and ¾ bathrooms in an [[Accommodation]]. This corresponds to the [BathroomsFull field in RESO](https://ddwiki.reso.org/display/DDW17/BathroomsFull+Field).',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:numberOfPartialBathrooms',
			name: 'numberOfPartialBathrooms',
			label: 'numberOfPartialBathrooms',
			comment:
				'Number of partial bathrooms - The total number of half and ¼ bathrooms in an [[Accommodation]]. This corresponds to the [BathroomsPartial field in RESO](https://ddwiki.reso.org/display/DDW17/BathroomsPartial+Field). ',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:numberOfRooms',
			name: 'numberOfRooms',
			label: 'numberOfRooms',
			comment:
				'The number of rooms (excluding bathrooms and closets) of the accommodation or lodging business.\nTypical unit code(s): ROM for room or C62 for no unit. The type of room can be put in the unitText property of the QuantitativeValue.',
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
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFloorPlan;
export const FloorPlan = schemaOrgFloorPlan;

export default schemaOrgFloorPlan;
