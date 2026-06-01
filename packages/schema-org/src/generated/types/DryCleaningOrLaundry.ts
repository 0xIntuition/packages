import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDryCleaningOrLaundry = {
	id: 'schema:DryCleaningOrLaundry',
	name: 'DryCleaningOrLaundry',
	label: 'DryCleaningOrLaundry',
	comment: 'A dry-cleaning business.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDryCleaningOrLaundry;
export const DryCleaningOrLaundry = schemaOrgDryCleaningOrLaundry;

export default schemaOrgDryCleaningOrLaundry;
