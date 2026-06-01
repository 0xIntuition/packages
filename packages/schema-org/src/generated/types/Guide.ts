import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGuide = {
	id: 'schema:Guide',
	name: 'Guide',
	label: 'Guide',
	comment:
		'[[Guide]] is a page or article that recommends specific products or services, or aspects of a thing for a user to consider. A [[Guide]] may represent a Buying Guide and detail aspects of products or services for a user to consider. A [[Guide]] may represent a Product Guide and recommend specific products or services. A [[Guide]] may represent a Ranked List and recommend specific products or services with ranking.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:category',
			name: 'category',
			label: 'category',
			comment:
				'A category for the item. Greater signs or slashes can be used to informally indicate a category hierarchy.',
			rangeIncludes: ['CategoryCode', 'PhysicalActivityCategory', 'Text', 'Thing', 'URL'],
		},
		{
			id: 'schema:reviewAspect',
			name: 'reviewAspect',
			label: 'reviewAspect',
			comment: 'This Review or Rating is relevant to this part or facet of the itemReviewed.',
			rangeIncludes: ['StructuredValue', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGuide;
export const Guide = schemaOrgGuide;

export default schemaOrgGuide;
