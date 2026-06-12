import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTravelAction = {
	id: 'schema:TravelAction',
	name: 'TravelAction',
	label: 'TravelAction',
	comment:
		'The act of traveling from a fromLocation to a destination by a specified mode of transport, optionally with participants.',
	subClassOf: ['MoveAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:distance',
			name: 'distance',
			label: 'distance',
			comment: 'The distance travelled, e.g. exercising or travelling.',
			rangeIncludes: ['Distance'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTravelAction;
export const TravelAction = schemaOrgTravelAction;

export default schemaOrgTravelAction;
