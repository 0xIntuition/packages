import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgContactPoint = {
	id: 'schema:ContactPoint',
	name: 'ContactPoint',
	label: 'ContactPoint',
	comment: 'A contact point&#x2014;for example, a Customer Complaints department.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:areaServed',
			name: 'areaServed',
			label: 'areaServed',
			comment: 'The geographic area where a service or offered item is provided.',
			rangeIncludes: ['AdministrativeArea', 'GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:availableLanguage',
			name: 'availableLanguage',
			label: 'availableLanguage',
			comment:
				'A language someone may use with or at the item, service or place. Please use one of the language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47). See also [[inLanguage]].',
			rangeIncludes: ['Language', 'Text'],
		},
		{
			id: 'schema:contactOption',
			name: 'contactOption',
			label: 'contactOption',
			comment:
				'An option available on this contact point (e.g. a toll-free number or support for hearing-impaired callers).',
			rangeIncludes: ['ContactPointOption'],
		},
		{
			id: 'schema:contactType',
			name: 'contactType',
			label: 'contactType',
			comment:
				'A person or organization can have different contact points, for different purposes. For example, a sales contact point, a PR contact point and so on. This property is used to specify the kind of contact point.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:email',
			name: 'email',
			label: 'email',
			comment: 'Email address.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:faxNumber',
			name: 'faxNumber',
			label: 'faxNumber',
			comment: 'The fax number.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:hoursAvailable',
			name: 'hoursAvailable',
			label: 'hoursAvailable',
			comment: 'The hours during which this service or contact is available.',
			rangeIncludes: ['OpeningHoursSpecification'],
		},
		{
			id: 'schema:productSupported',
			name: 'productSupported',
			label: 'productSupported',
			comment:
				'The product or service this support contact point is related to (such as product support for a particular product line). This can be a specific product or product line (e.g. "iPhone") or a general category of products or services (e.g. "smartphones").',
			rangeIncludes: ['Product', 'Text'],
		},
		{
			id: 'schema:serviceArea',
			name: 'serviceArea',
			label: 'serviceArea',
			comment: 'The geographic area where the service is provided.',
			rangeIncludes: ['AdministrativeArea', 'GeoShape', 'Place'],
		},
		{
			id: 'schema:telephone',
			name: 'telephone',
			label: 'telephone',
			comment: 'The telephone number.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgContactPoint;
export const ContactPoint = schemaOrgContactPoint;

export default schemaOrgContactPoint;
