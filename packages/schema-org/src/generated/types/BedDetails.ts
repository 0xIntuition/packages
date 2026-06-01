import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBedDetails = {
	id: 'schema:BedDetails',
	name: 'BedDetails',
	label: 'BedDetails',
	comment:
		'An entity holding detailed information about the available bed types, e.g. the quantity of twin beds for a hotel room. For the single case of just one bed of a certain type, you can use bed directly with a text. See also [[BedType]] (under development).',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:numberOfBeds',
			name: 'numberOfBeds',
			label: 'numberOfBeds',
			comment:
				'The quantity of the given bed type available in the HotelRoom, Suite, House, or Apartment.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:typeOfBed',
			name: 'typeOfBed',
			label: 'typeOfBed',
			comment:
				'The type of bed to which the BedDetail refers, i.e. the type of bed available in the quantity indicated by quantity.',
			rangeIncludes: ['BedType', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBedDetails;
export const BedDetails = schemaOrgBedDetails;

export default schemaOrgBedDetails;
