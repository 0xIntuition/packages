import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgResidence = {
	id: 'schema:Residence',
	name: 'Residence',
	label: 'Residence',
	comment: 'The place where a person lives.',
	subClassOf: ['Place', 'Thing'],
	properties: [
		{
			id: 'schema:accommodationFloorPlan',
			name: 'accommodationFloorPlan',
			label: 'accommodationFloorPlan',
			comment: 'A floorplan of some [[Accommodation]].',
			rangeIncludes: ['FloorPlan'],
		},
		{
			id: 'schema:floorLevel',
			name: 'floorLevel',
			label: 'floorLevel',
			comment:
				'The floor level for an [[Accommodation]] in a multi-storey building. Since counting\n  systems [vary internationally](https://en.wikipedia.org/wiki/Storey#Consecutive_number_floor_designations), the local system should be used where possible.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgResidence;
export const Residence = schemaOrgResidence;

export default schemaOrgResidence;
