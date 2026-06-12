import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAccommodation = {
	id: 'schema:Accommodation',
	name: 'Accommodation',
	label: 'Accommodation',
	comment:
		'An accommodation is a place that can accommodate human beings, e.g. a hotel room, a camping pitch, or a meeting room. Many accommodations are for overnight stays, but this is not a mandatory requirement.\nFor more specific types of accommodations not defined in schema.org, one can use [[additionalType]] with external vocabularies.\n<br /><br />\nSee also the <a href="/docs/hotels.html">dedicated document on the use of schema.org for marking up hotels and other forms of accommodations</a>.\n',
	subClassOf: ['Place', 'Thing'],
	properties: [
		{
			id: 'schema:accommodationCategory',
			name: 'accommodationCategory',
			label: 'accommodationCategory',
			comment:
				'Category of an [[Accommodation]], following real estate conventions, e.g. RESO (see [PropertySubType](https://ddwiki.reso.org/display/DDW17/PropertySubType+Field), and [PropertyType](https://ddwiki.reso.org/display/DDW17/PropertyType+Field) fields  for suggested values).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:accommodationFloorPlan',
			name: 'accommodationFloorPlan',
			label: 'accommodationFloorPlan',
			comment: 'A floorplan of some [[Accommodation]].',
			rangeIncludes: ['FloorPlan'],
		},
		{
			id: 'schema:amenityFeature',
			name: 'amenityFeature',
			label: 'amenityFeature',
			comment:
				'An amenity feature (e.g. a characteristic or service) of the Accommodation. This generic property does not make a statement about whether the feature is included in an offer for the main accommodation or available at extra costs.',
			rangeIncludes: ['LocationFeatureSpecification'],
		},
		{
			id: 'schema:bed',
			name: 'bed',
			label: 'bed',
			comment:
				'The type of bed or beds included in the accommodation. For the single case of just one bed of a certain type, you use bed directly with a text.\n      If you want to indicate the quantity of a certain kind of bed, use an instance of BedDetails. For more detailed information, use the amenityFeature property.',
			rangeIncludes: ['BedDetails', 'BedType', 'Text'],
		},
		{
			id: 'schema:floorLevel',
			name: 'floorLevel',
			label: 'floorLevel',
			comment:
				'The floor level for an [[Accommodation]] in a multi-storey building. Since counting\n  systems [vary internationally](https://en.wikipedia.org/wiki/Storey#Consecutive_number_floor_designations), the local system should be used where possible.',
			rangeIncludes: ['Text'],
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
			id: 'schema:leaseLength',
			name: 'leaseLength',
			label: 'leaseLength',
			comment:
				'Length of the lease for some [[Accommodation]], either particular to some [[Offer]] or in some cases intrinsic to the property.',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
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
			id: 'schema:occupancy',
			name: 'occupancy',
			label: 'occupancy',
			comment:
				'The allowed total occupancy for the accommodation in persons (including infants etc). For individual accommodations, this is not necessarily the legal maximum but defines the permitted usage as per the contractual agreement (e.g. a double room used by a single person).\nTypical unit code(s): C62 for person.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:permittedUsage',
			name: 'permittedUsage',
			label: 'permittedUsage',
			comment: 'Indications regarding the permitted usage of the accommodation.',
			rangeIncludes: ['Text'],
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
		{
			id: 'schema:yearBuilt',
			name: 'yearBuilt',
			label: 'yearBuilt',
			comment:
				'The year an [[Accommodation]] was constructed. This corresponds to the [YearBuilt field in RESO](https://ddwiki.reso.org/display/DDW17/YearBuilt+Field). ',
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAccommodation;
export const Accommodation = schemaOrgAccommodation;

export default schemaOrgAccommodation;
