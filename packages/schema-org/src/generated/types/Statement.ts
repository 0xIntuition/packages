import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgStatement = {
	id: 'schema:Statement',
	name: 'Statement',
	label: 'Statement',
	comment:
		'A statement about something, for example a fun or interesting fact. If known, the main entity this statement is about can be indicated using mainEntity. For more formal claims (e.g. in Fact Checking), consider using [[Claim]] instead. Use the [[text]] property to capture the text of the statement.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgStatement;
export const Statement = schemaOrgStatement;

export default schemaOrgStatement;
