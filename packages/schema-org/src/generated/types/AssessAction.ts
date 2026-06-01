import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAssessAction = {
	id: 'schema:AssessAction',
	name: 'AssessAction',
	label: 'AssessAction',
	comment: "The act of forming one's opinion, reaction or sentiment.",
	subClassOf: ['Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAssessAction;
export const AssessAction = schemaOrgAssessAction;

export default schemaOrgAssessAction;
