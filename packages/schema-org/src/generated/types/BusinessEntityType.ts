import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBusinessEntityType = {
	id: 'schema:BusinessEntityType',
	name: 'BusinessEntityType',
	label: 'BusinessEntityType',
	comment:
		'A business entity type is a conceptual entity representing the legal form, the size, the main line of business, the position in the value chain, or any combination thereof, of an organization or business person.\\n\\nCommonly used values:\\n\\n* http://purl.org/goodrelations/v1#Business\\n* http://purl.org/goodrelations/v1#Enduser\\n* http://purl.org/goodrelations/v1#PublicInstitution\\n* http://purl.org/goodrelations/v1#Reseller\n    ',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBusinessEntityType;
export const BusinessEntityType = schemaOrgBusinessEntityType;

export default schemaOrgBusinessEntityType;
