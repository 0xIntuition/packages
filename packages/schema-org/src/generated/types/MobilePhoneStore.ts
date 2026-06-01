import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMobilePhoneStore = {
	id: 'schema:MobilePhoneStore',
	name: 'MobilePhoneStore',
	label: 'MobilePhoneStore',
	comment: 'A store that sells mobile phones and related accessories.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMobilePhoneStore;
export const MobilePhoneStore = schemaOrgMobilePhoneStore;

export default schemaOrgMobilePhoneStore;
