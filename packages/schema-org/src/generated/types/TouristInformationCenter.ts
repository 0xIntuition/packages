import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTouristInformationCenter = {
	id: 'schema:TouristInformationCenter',
	name: 'TouristInformationCenter',
	label: 'TouristInformationCenter',
	comment: 'A tourist information center.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTouristInformationCenter;
export const TouristInformationCenter = schemaOrgTouristInformationCenter;

export default schemaOrgTouristInformationCenter;
