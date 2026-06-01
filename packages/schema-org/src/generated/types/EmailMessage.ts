import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEmailMessage = {
	id: 'schema:EmailMessage',
	name: 'EmailMessage',
	label: 'EmailMessage',
	comment: 'An email message.',
	subClassOf: ['Message', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEmailMessage;
export const EmailMessage = schemaOrgEmailMessage;

export default schemaOrgEmailMessage;
