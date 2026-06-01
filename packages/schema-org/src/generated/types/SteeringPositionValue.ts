import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSteeringPositionValue = {
	id: 'schema:SteeringPositionValue',
	name: 'SteeringPositionValue',
	label: 'SteeringPositionValue',
	comment: 'A value indicating a steering position.',
	subClassOf: ['QualitativeValue', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSteeringPositionValue;
export const SteeringPositionValue = schemaOrgSteeringPositionValue;

export default schemaOrgSteeringPositionValue;
