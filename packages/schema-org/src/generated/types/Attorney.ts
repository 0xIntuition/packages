import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAttorney = {
	id: 'schema:Attorney',
	name: 'Attorney',
	label: 'Attorney',
	comment:
		'Professional service: Attorney. \\n\\nThis type is deprecated - [[LegalService]] is more inclusive and less ambiguous.',
	subClassOf: ['LegalService', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAttorney;
export const Attorney = schemaOrgAttorney;

export default schemaOrgAttorney;
