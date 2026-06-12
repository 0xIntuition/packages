import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPermit = {
	id: 'schema:Permit',
	name: 'Permit',
	label: 'Permit',
	comment: 'A permit issued by an organization, e.g. a parking pass.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:issuedBy',
			name: 'issuedBy',
			label: 'issuedBy',
			comment:
				'The organization issuing the item, for example a [[Permit]], [[Ticket]], or [[Certification]].',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:issuedThrough',
			name: 'issuedThrough',
			label: 'issuedThrough',
			comment: 'The service through which the permit was granted.',
			rangeIncludes: ['Service'],
		},
		{
			id: 'schema:permitAudience',
			name: 'permitAudience',
			label: 'permitAudience',
			comment: 'The target audience for this permit.',
			rangeIncludes: ['Audience'],
		},
		{
			id: 'schema:validFor',
			name: 'validFor',
			label: 'validFor',
			comment: 'The duration of validity of a permit or similar thing.',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:validFrom',
			name: 'validFrom',
			label: 'validFrom',
			comment: 'The date when the item becomes valid.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:validIn',
			name: 'validIn',
			label: 'validIn',
			comment:
				'The geographic area where the item is valid. Applies for example to a [[Permit]], a [[Certification]], or an [[EducationalOccupationalCredential]]. ',
			rangeIncludes: ['AdministrativeArea'],
		},
		{
			id: 'schema:validUntil',
			name: 'validUntil',
			label: 'validUntil',
			comment: 'The date when the item is no longer valid.',
			rangeIncludes: ['Date'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPermit;
export const Permit = schemaOrgPermit;

export default schemaOrgPermit;
