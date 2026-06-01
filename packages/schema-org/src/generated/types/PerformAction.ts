import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPerformAction = {
	id: 'schema:PerformAction',
	name: 'PerformAction',
	label: 'PerformAction',
	comment: 'The act of participating in performance arts.',
	subClassOf: ['PlayAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:entertainmentBusiness',
			name: 'entertainmentBusiness',
			label: 'entertainmentBusiness',
			comment: 'A sub property of location. The entertainment business where the action occurred.',
			rangeIncludes: ['EntertainmentBusiness'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPerformAction;
export const PerformAction = schemaOrgPerformAction;

export default schemaOrgPerformAction;
