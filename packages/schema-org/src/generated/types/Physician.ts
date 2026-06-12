import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPhysician = {
	id: 'schema:Physician',
	name: 'Physician',
	label: 'Physician',
	comment:
		"An individual physician or a physician's office considered as a [[MedicalOrganization]].",
	subClassOf: [
		'MedicalBusiness',
		'MedicalOrganization',
		'LocalBusiness',
		'Organization',
		'Place',
		'Thing',
	],
	properties: [
		{
			id: 'schema:availableService',
			name: 'availableService',
			label: 'availableService',
			comment: 'A medical service available from this provider.',
			rangeIncludes: ['MedicalProcedure', 'MedicalTest', 'MedicalTherapy'],
		},
		{
			id: 'schema:hospitalAffiliation',
			name: 'hospitalAffiliation',
			label: 'hospitalAffiliation',
			comment: 'A hospital with which the physician or office is affiliated.',
			rangeIncludes: ['Hospital'],
		},
		{
			id: 'schema:medicalSpecialty',
			name: 'medicalSpecialty',
			label: 'medicalSpecialty',
			comment: 'A medical specialty of the provider.',
			rangeIncludes: ['MedicalSpecialty'],
		},
		{
			id: 'schema:occupationalCategory',
			name: 'occupationalCategory',
			label: 'occupationalCategory',
			comment:
				'A category describing the job, preferably using a term from a taxonomy such as [BLS O*NET-SOC](http://www.onetcenter.org/taxonomy.html), [ISCO-08](https://www.ilo.org/public/english/bureau/stat/isco/isco08/) or similar, with the property repeated for each applicable value. Ideally the taxonomy should be identified, and both the textual label and formal code for the category should be provided.\\n\nNote: for historical reasons, any textual label and formal code provided as a literal may be assumed to be from O*NET-SOC.',
			rangeIncludes: ['CategoryCode', 'Text'],
		},
		{
			id: 'schema:usNPI',
			name: 'usNPI',
			label: 'usNPI',
			comment:
				'A <a href="https://en.wikipedia.org/wiki/National_Provider_Identifier">National Provider Identifier</a> (NPI) \n    is a unique 10-digit identification number issued to health care providers in the United States by the Centers for Medicare and Medicaid Services.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPhysician;
export const Physician = schemaOrgPhysician;

export default schemaOrgPhysician;
