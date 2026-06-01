import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRecommendation = {
	id: 'schema:Recommendation',
	name: 'Recommendation',
	label: 'Recommendation',
	comment:
		'[[Recommendation]] is a type of [[Review]] that suggests or proposes something as the best option or best course of action. Recommendations may be for products or services, or other concrete things, as in the case of a ranked list or product guide. A [[Guide]] may list multiple recommendations for different categories. For example, in a [[Guide]] about which TVs to buy, the author may have several [[Recommendation]]s.',
	subClassOf: ['Review', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:category',
			name: 'category',
			label: 'category',
			comment:
				'A category for the item. Greater signs or slashes can be used to informally indicate a category hierarchy.',
			rangeIncludes: ['CategoryCode', 'PhysicalActivityCategory', 'Text', 'Thing', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRecommendation;
export const Recommendation = schemaOrgRecommendation;

export default schemaOrgRecommendation;
