import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInstallAction = {
	id: 'schema:InstallAction',
	name: 'InstallAction',
	label: 'InstallAction',
	comment: 'The act of installing an application.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInstallAction;
export const InstallAction = schemaOrgInstallAction;

export default schemaOrgInstallAction;
