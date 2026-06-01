import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgApprovedIndication = {
	id: 'schema:ApprovedIndication',
	name: 'ApprovedIndication',
	label: 'ApprovedIndication',
	comment:
		'An indication for a medical therapy that has been formally specified or approved by a regulatory body that regulates use of the therapy; for example, the US FDA approves indications for most drugs in the US.',
	subClassOf: ['MedicalIndication', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgApprovedIndication;
export const ApprovedIndication = schemaOrgApprovedIndication;

export default schemaOrgApprovedIndication;
