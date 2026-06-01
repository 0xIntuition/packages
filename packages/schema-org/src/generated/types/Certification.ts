import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCertification = {
	id: 'schema:Certification',
	name: 'Certification',
	label: 'Certification',
	comment:
		'A Certification is an official and authoritative statement about a subject, for example a product, service, person, or organization. A certification is typically issued by an indendent certification body, for example a professional organization or government. It formally attests certain characteristics about the subject, for example Organizations can be ISO certified, Food products can be certified Organic or Vegan, a Person can be a certified professional, a Place can be certified for food processing. There are certifications for many domains: regulatory, organizational, recycling, food, efficiency, educational, ecological, etc. A certification is a form of credential, as are accreditations and licenses. Mapped from the [gs1:CertificationDetails](https://www.gs1.org/voc/CertificationDetails) class in the GS1 Web Vocabulary.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:about',
			name: 'about',
			label: 'about',
			comment: 'The subject matter of an object.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:auditDate',
			name: 'auditDate',
			label: 'auditDate',
			comment:
				'Date when a certification was last audited. See also  [gs1:certificationAuditDate](https://www.gs1.org/voc/certificationAuditDate).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:certificationIdentification',
			name: 'certificationIdentification',
			label: 'certificationIdentification',
			comment:
				'Identifier of a certification instance (as registered with an independent certification body). Typically this identifier can be used to consult and verify the certification instance. See also [gs1:certificationIdentification](https://www.gs1.org/voc/certificationIdentification).',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:certificationRating',
			name: 'certificationRating',
			label: 'certificationRating',
			comment:
				'Rating of a certification instance (as defined by an independent certification body). Typically this rating can be used to rate the level to which the requirements of the certification instance are fulfilled. See also [gs1:certificationValue](https://www.gs1.org/voc/certificationValue).',
			rangeIncludes: ['Rating'],
		},
		{
			id: 'schema:certificationStatus',
			name: 'certificationStatus',
			label: 'certificationStatus',
			comment:
				'Indicates the current status of a certification: active or inactive. See also  [gs1:certificationStatus](https://www.gs1.org/voc/certificationStatus).',
			rangeIncludes: ['CertificationStatusEnumeration'],
		},
		{
			id: 'schema:datePublished',
			name: 'datePublished',
			label: 'datePublished',
			comment:
				'Date of first publication or broadcast. For example the date a [[CreativeWork]] was broadcast or a [[Certification]] was issued.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:expires',
			name: 'expires',
			label: 'expires',
			comment:
				'Date the content expires and is no longer useful or available. For example a [[VideoObject]] or [[NewsArticle]] whose availability or relevance is time-limited, a [[ClaimReview]] fact check whose publisher wants to indicate that it may no longer be relevant (or helpful to highlight) after some date, or a [[Certification]] the validity has expired.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:hasMeasurement',
			name: 'hasMeasurement',
			label: 'hasMeasurement',
			comment:
				'A measurement of an item, For example, the inseam of pants, the wheel size of a bicycle, the gauge of a screw, or the carbon footprint measured for certification by an authority. Usually an exact measurement, but can also be a range of measurements for adjustable products, for example belts and ski bindings.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:issuedBy',
			name: 'issuedBy',
			label: 'issuedBy',
			comment:
				'The organization issuing the item, for example a [[Permit]], [[Ticket]], or [[Certification]].',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:logo',
			name: 'logo',
			label: 'logo',
			comment: 'An associated logo.',
			rangeIncludes: ['ImageObject', 'URL'],
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
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCertification;
export const Certification = schemaOrgCertification;

export default schemaOrgCertification;
