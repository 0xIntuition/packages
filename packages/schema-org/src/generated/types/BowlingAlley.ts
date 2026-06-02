import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBowlingAlley = {
	id: 'schema:BowlingAlley',
	name: 'BowlingAlley',
	label: 'BowlingAlley',
	comment: 'A bowling alley.',
	subClassOf: ['SportsActivityLocation', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBowlingAlley;
export const BowlingAlley = schemaOrgBowlingAlley;

export default schemaOrgBowlingAlley;
