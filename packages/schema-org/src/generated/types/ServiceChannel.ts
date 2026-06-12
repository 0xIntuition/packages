import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgServiceChannel = {
	id: 'schema:ServiceChannel',
	name: 'ServiceChannel',
	label: 'ServiceChannel',
	comment:
		'A means for accessing a service, e.g. a government office location, web site, or phone number.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:availableLanguage',
			name: 'availableLanguage',
			label: 'availableLanguage',
			comment:
				'A language someone may use with or at the item, service or place. Please use one of the language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47). See also [[inLanguage]].',
			rangeIncludes: ['Language', 'Text'],
		},
		{
			id: 'schema:processingTime',
			name: 'processingTime',
			label: 'processingTime',
			comment: 'Estimated processing time for the service using this channel.',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:providesService',
			name: 'providesService',
			label: 'providesService',
			comment: 'The service provided by this channel.',
			rangeIncludes: ['Service'],
		},
		{
			id: 'schema:serviceLocation',
			name: 'serviceLocation',
			label: 'serviceLocation',
			comment:
				'The location (e.g. civic structure, local business, etc.) where a person can go to access the service.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:servicePhone',
			name: 'servicePhone',
			label: 'servicePhone',
			comment: 'The phone number to use to access the service.',
			rangeIncludes: ['ContactPoint'],
		},
		{
			id: 'schema:servicePostalAddress',
			name: 'servicePostalAddress',
			label: 'servicePostalAddress',
			comment: 'The address for accessing the service by mail.',
			rangeIncludes: ['PostalAddress'],
		},
		{
			id: 'schema:serviceSmsNumber',
			name: 'serviceSmsNumber',
			label: 'serviceSmsNumber',
			comment: 'The number to access the service by text message.',
			rangeIncludes: ['ContactPoint'],
		},
		{
			id: 'schema:serviceUrl',
			name: 'serviceUrl',
			label: 'serviceUrl',
			comment: 'The website to access the service.',
			rangeIncludes: ['URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgServiceChannel;
export const ServiceChannel = schemaOrgServiceChannel;

export default schemaOrgServiceChannel;
