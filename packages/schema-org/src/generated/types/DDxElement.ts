import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDDxElement = {
	id: 'schema:DDxElement',
	name: 'DDxElement',
	label: 'DDxElement',
	comment:
		'An alternative, closely-related condition typically considered later in the differential diagnosis process along with the signs that are used to distinguish it.',
	subClassOf: ['MedicalIntangible', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:diagnosis',
			name: 'diagnosis',
			label: 'diagnosis',
			comment:
				'One or more alternative conditions considered in the differential diagnosis process as output of a diagnosis process.',
			rangeIncludes: ['MedicalCondition'],
		},
		{
			id: 'schema:distinguishingSign',
			name: 'distinguishingSign',
			label: 'distinguishingSign',
			comment:
				'One of a set of signs and symptoms that can be used to distinguish this diagnosis from others in the differential diagnosis.',
			rangeIncludes: ['MedicalSignOrSymptom'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDDxElement;
export const DDxElement = schemaOrgDDxElement;

export default schemaOrgDDxElement;
