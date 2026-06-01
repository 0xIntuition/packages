import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVessel = {
	id: 'schema:Vessel',
	name: 'Vessel',
	label: 'Vessel',
	comment:
		'A component of the human body circulatory system comprised of an intricate network of hollow tubes that transport blood throughout the entire body.',
	subClassOf: ['AnatomicalStructure', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVessel;
export const Vessel = schemaOrgVessel;

export default schemaOrgVessel;
