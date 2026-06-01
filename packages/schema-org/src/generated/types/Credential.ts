import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCredential = {
	id: 'schema:Credential',
	name: 'Credential',
	label: 'Credential',
	comment:
		'A credential is a certificate that is used to verify the identity of a person or entity.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:credentialCategory',
			name: 'credentialCategory',
			label: 'credentialCategory',
			comment:
				'The category or type of credential being described, for example "degree”, “certificate”, “badge”, or more specific term.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:recognizedBy',
			name: 'recognizedBy',
			label: 'recognizedBy',
			comment:
				'An organization that acknowledges the validity, value or utility of a credential. Note: recognition may include a process of quality assurance or accreditation.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:validFor',
			name: 'validFor',
			label: 'validFor',
			comment: 'The duration of validity of a permit or similar thing.',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:validIn',
			name: 'validIn',
			label: 'validIn',
			comment:
				'The geographic area where the item is valid. Applies for example to a [[Permit]], a [[Certification]], or an [[EducationalOccupationalCredential]]. ',
			rangeIncludes: ['AdministrativeArea'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCredential;
export const Credential = schemaOrgCredential;

export default schemaOrgCredential;
