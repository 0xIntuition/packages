import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAchieveAction = {
	id: 'schema:AchieveAction',
	name: 'AchieveAction',
	label: 'AchieveAction',
	comment:
		'The act of accomplishing something via previous efforts. It is an instantaneous action rather than an ongoing process.',
	subClassOf: ['Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAchieveAction;
export const AchieveAction = schemaOrgAchieveAction;

export default schemaOrgAchieveAction;
