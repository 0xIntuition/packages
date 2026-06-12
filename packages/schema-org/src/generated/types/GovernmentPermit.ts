import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGovernmentPermit = {
	id: 'schema:GovernmentPermit',
	name: 'GovernmentPermit',
	label: 'GovernmentPermit',
	comment: 'A permit issued by a government agency.',
	subClassOf: ['Permit', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGovernmentPermit;
export const GovernmentPermit = schemaOrgGovernmentPermit;

export default schemaOrgGovernmentPermit;
