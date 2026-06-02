import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFoodEstablishment = {
	id: 'schema:FoodEstablishment',
	name: 'FoodEstablishment',
	label: 'FoodEstablishment',
	comment: 'A food-related business.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [
		{
			id: 'schema:acceptsReservations',
			name: 'acceptsReservations',
			label: 'acceptsReservations',
			comment:
				'Indicates whether a FoodEstablishment accepts reservations. Values can be Boolean, an URL at which reservations can be made or (for backwards compatibility) the strings ```Yes``` or ```No```.',
			rangeIncludes: ['Boolean', 'Text', 'URL'],
		},
		{
			id: 'schema:hasMenu',
			name: 'hasMenu',
			label: 'hasMenu',
			comment:
				'Either the actual menu as a structured representation, as text, or a URL of the menu.',
			rangeIncludes: ['Menu', 'Text', 'URL'],
		},
		{
			id: 'schema:menu',
			name: 'menu',
			label: 'menu',
			comment:
				'Either the actual menu as a structured representation, as text, or a URL of the menu.',
			rangeIncludes: ['Menu', 'Text', 'URL'],
		},
		{
			id: 'schema:servesCuisine',
			name: 'servesCuisine',
			label: 'servesCuisine',
			comment: 'The cuisine of the restaurant.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:starRating',
			name: 'starRating',
			label: 'starRating',
			comment:
				'An official rating for a lodging business or food establishment, e.g. from national associations or standards bodies. Use the author property to indicate the rating organization, e.g. as an Organization with name such as (e.g. HOTREC, DEHOGA, WHR, or Hotelstars).',
			rangeIncludes: ['Rating'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFoodEstablishment;
export const FoodEstablishment = schemaOrgFoodEstablishment;

export default schemaOrgFoodEstablishment;
