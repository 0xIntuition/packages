import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLandmarksOrHistoricalBuildings = {
	id: 'schema:LandmarksOrHistoricalBuildings',
	name: 'LandmarksOrHistoricalBuildings',
	label: 'LandmarksOrHistoricalBuildings',
	comment: 'An historical landmark or building.',
	subClassOf: ['Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLandmarksOrHistoricalBuildings;
export const LandmarksOrHistoricalBuildings = schemaOrgLandmarksOrHistoricalBuildings;

export default schemaOrgLandmarksOrHistoricalBuildings;
