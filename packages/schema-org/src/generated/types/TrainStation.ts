import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTrainStation = {
	id: 'schema:TrainStation',
	name: 'TrainStation',
	label: 'TrainStation',
	comment: 'A train station.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTrainStation;
export const TrainStation = schemaOrgTrainStation;

export default schemaOrgTrainStation;
