import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPhysicalActivity = {
	id: 'schema:PhysicalActivity',
	name: 'PhysicalActivity',
	label: 'PhysicalActivity',
	comment:
		'Any bodily activity that enhances or maintains physical fitness and overall health and wellness. Includes activity that is part of daily living and routine, structured exercise, and exercise prescribed as part of a medical treatment or recovery plan.',
	subClassOf: ['LifestyleModification', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:associatedAnatomy',
			name: 'associatedAnatomy',
			label: 'associatedAnatomy',
			comment:
				'The anatomy of the underlying organ system or structures associated with this entity.',
			rangeIncludes: ['AnatomicalStructure', 'AnatomicalSystem', 'SuperficialAnatomy'],
		},
		{
			id: 'schema:category',
			name: 'category',
			label: 'category',
			comment:
				'A category for the item. Greater signs or slashes can be used to informally indicate a category hierarchy.',
			rangeIncludes: ['CategoryCode', 'PhysicalActivityCategory', 'Text', 'Thing', 'URL'],
		},
		{
			id: 'schema:epidemiology',
			name: 'epidemiology',
			label: 'epidemiology',
			comment: 'The characteristics of associated patients, such as age, gender, race etc.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:pathophysiology',
			name: 'pathophysiology',
			label: 'pathophysiology',
			comment:
				'Changes in the normal mechanical, physical, and biochemical functions that are associated with this activity or condition.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPhysicalActivity;
export const PhysicalActivity = schemaOrgPhysicalActivity;

export default schemaOrgPhysicalActivity;
