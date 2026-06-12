import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHousePainter = {
	id: 'schema:HousePainter',
	name: 'HousePainter',
	label: 'HousePainter',
	comment: 'A house painting service.',
	subClassOf: ['HomeAndConstructionBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHousePainter;
export const HousePainter = schemaOrgHousePainter;

export default schemaOrgHousePainter;
