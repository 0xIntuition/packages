import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgProject = {
	id: 'schema:Project',
	name: 'Project',
	label: 'Project',
	comment:
		'An enterprise (potentially individual but typically collaborative), planned to achieve a particular aim.\nUse properties from [[Organization]], [[subOrganization]]/[[parentOrganization]] to indicate project sub-structures. \n   ',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgProject;
export const Project = schemaOrgProject;

export default schemaOrgProject;
