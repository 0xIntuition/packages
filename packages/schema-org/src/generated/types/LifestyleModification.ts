import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLifestyleModification = {
	id: 'schema:LifestyleModification',
	name: 'LifestyleModification',
	label: 'LifestyleModification',
	comment:
		'A process of care involving exercise, changes to diet, fitness routines, and other lifestyle changes aimed at improving a health condition.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLifestyleModification;
export const LifestyleModification = schemaOrgLifestyleModification;

export default schemaOrgLifestyleModification;
