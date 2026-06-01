import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCorrectionComment = {
	id: 'schema:CorrectionComment',
	name: 'CorrectionComment',
	label: 'CorrectionComment',
	comment: 'A [[comment]] that corrects [[CreativeWork]].',
	subClassOf: ['Comment', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCorrectionComment;
export const CorrectionComment = schemaOrgCorrectionComment;

export default schemaOrgCorrectionComment;
