import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGasStation = {
	id: 'schema:GasStation',
	name: 'GasStation',
	label: 'GasStation',
	comment: 'A gas station.',
	subClassOf: ['AutomotiveBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGasStation;
export const GasStation = schemaOrgGasStation;

export default schemaOrgGasStation;
