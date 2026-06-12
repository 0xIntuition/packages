import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMotorizedBicycle = {
	id: 'schema:MotorizedBicycle',
	name: 'MotorizedBicycle',
	label: 'MotorizedBicycle',
	comment:
		'A motorized bicycle is a bicycle with an attached motor used to power the vehicle, or to assist with pedaling.',
	subClassOf: ['Vehicle', 'Product', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMotorizedBicycle;
export const MotorizedBicycle = schemaOrgMotorizedBicycle;

export default schemaOrgMotorizedBicycle;
