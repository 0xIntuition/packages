import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgProfilePage = {
	id: 'schema:ProfilePage',
	name: 'ProfilePage',
	label: 'ProfilePage',
	comment: 'Web page type: Profile page.',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgProfilePage;
export const ProfilePage = schemaOrgProfilePage;

export default schemaOrgProfilePage;
