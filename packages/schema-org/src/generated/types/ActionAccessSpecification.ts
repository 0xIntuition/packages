import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgActionAccessSpecification = {
	id: 'schema:ActionAccessSpecification',
	name: 'ActionAccessSpecification',
	label: 'ActionAccessSpecification',
	comment: 'A set of requirements that must be fulfilled in order to perform an Action.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:availabilityEnds',
			name: 'availabilityEnds',
			label: 'availabilityEnds',
			comment: 'The end of the availability of the product or service included in the offer.',
			rangeIncludes: ['Date', 'DateTime', 'Time'],
		},
		{
			id: 'schema:availabilityStarts',
			name: 'availabilityStarts',
			label: 'availabilityStarts',
			comment: 'The beginning of the availability of the product or service included in the offer.',
			rangeIncludes: ['Date', 'DateTime', 'Time'],
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
			id: 'schema:eligibleRegion',
			name: 'eligibleRegion',
			label: 'eligibleRegion',
			comment:
				'The ISO 3166-1 (ISO 3166-1 alpha-2) or ISO 3166-2 code, the place, or the GeoShape for the geo-political region(s) for which the offer or delivery charge specification is valid.\\n\\nSee also [[ineligibleRegion]].\n    ',
			rangeIncludes: ['GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:expectsAcceptanceOf',
			name: 'expectsAcceptanceOf',
			label: 'expectsAcceptanceOf',
			comment:
				'An Offer which must be accepted before the user can perform the Action. For example, the user may need to buy a movie before being able to watch it.',
			rangeIncludes: ['Offer'],
		},
		{
			id: 'schema:ineligibleRegion',
			name: 'ineligibleRegion',
			label: 'ineligibleRegion',
			comment:
				'The ISO 3166-1 (ISO 3166-1 alpha-2) or ISO 3166-2 code, the place, or the GeoShape for the geo-political region(s) for which the offer or delivery charge specification is not valid, e.g. a region where the transaction is not allowed.\\n\\nSee also [[eligibleRegion]].\n      ',
			rangeIncludes: ['GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:requiresSubscription',
			name: 'requiresSubscription',
			label: 'requiresSubscription',
			comment:
				"Indicates if use of the media require a subscription  (either paid or free). Allowed values are ```true``` or ```false``` (note that an earlier version had 'yes', 'no').",
			rangeIncludes: ['Boolean', 'MediaSubscription'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgActionAccessSpecification;
export const ActionAccessSpecification = schemaOrgActionAccessSpecification;

export default schemaOrgActionAccessSpecification;
