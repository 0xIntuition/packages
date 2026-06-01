import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalContraindication = {
	id: 'schema:MedicalContraindication',
	name: 'MedicalContraindication',
	label: 'MedicalContraindication',
	comment:
		'A condition or factor that serves as a reason to withhold a certain medical therapy. Contraindications can be absolute (there are no reasonable circumstances for undertaking a course of action) or relative (the patient is at higher risk of complications, but these risks may be outweighed by other considerations or mitigated by other measures).',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalContraindication;
export const MedicalContraindication = schemaOrgMedicalContraindication;

export default schemaOrgMedicalContraindication;
