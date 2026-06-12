import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRadioStation = {
	id: 'schema:RadioStation',
	name: 'RadioStation',
	label: 'RadioStation',
	comment: 'A radio station.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRadioStation;
export const RadioStation = schemaOrgRadioStation;

export default schemaOrgRadioStation;
