import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHomeAndConstructionBusiness = {
	id: 'schema:HomeAndConstructionBusiness',
	name: 'HomeAndConstructionBusiness',
	label: 'HomeAndConstructionBusiness',
	comment:
		'A construction business.\\n\\nA HomeAndConstructionBusiness is a [[LocalBusiness]] that provides services around homes and buildings.\\n\\nAs a [[LocalBusiness]] it can be described as a [[provider]] of one or more [[Service]]\\(s).',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHomeAndConstructionBusiness;
export const HomeAndConstructionBusiness = schemaOrgHomeAndConstructionBusiness;

export default schemaOrgHomeAndConstructionBusiness;
