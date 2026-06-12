import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOnlineBusiness = {
	id: 'schema:OnlineBusiness',
	name: 'OnlineBusiness',
	label: 'OnlineBusiness',
	comment:
		'A particular online business, either standalone or the online part of a broader organization. Examples include an eCommerce site, an online travel booking site, an online learning site, an online logistics and shipping provider, an online (virtual) doctor, etc.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOnlineBusiness;
export const OnlineBusiness = schemaOrgOnlineBusiness;

export default schemaOrgOnlineBusiness;
