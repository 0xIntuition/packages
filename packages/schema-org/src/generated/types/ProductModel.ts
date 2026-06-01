import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgProductModel = {
	id: 'schema:ProductModel',
	name: 'ProductModel',
	label: 'ProductModel',
	comment:
		'A datasheet or vendor specification of a product (in the sense of a prototypical description).',
	subClassOf: ['Product', 'Thing'],
	properties: [
		{
			id: 'schema:isVariantOf',
			name: 'isVariantOf',
			label: 'isVariantOf',
			comment:
				'Indicates the kind of product that this is a variant of. In the case of [[ProductModel]], this is a pointer (from a ProductModel) to a base product from which this product is a variant. It is safe to infer that the variant inherits all product features from the base model, unless defined locally. This is not transitive. In the case of a [[ProductGroup]], the group description also serves as a template, representing a set of Products that vary on explicitly defined, specific dimensions only (so it defines both a set of variants, as well as which values distinguish amongst those variants). When used with [[ProductGroup]], this property can apply to any [[Product]] included in the group.',
			rangeIncludes: ['ProductGroup', 'ProductModel'],
		},
		{
			id: 'schema:predecessorOf',
			name: 'predecessorOf',
			label: 'predecessorOf',
			comment:
				'A pointer from a previous, often discontinued variant of the product to its newer variant.',
			rangeIncludes: ['ProductModel'],
		},
		{
			id: 'schema:successorOf',
			name: 'successorOf',
			label: 'successorOf',
			comment:
				'A pointer from a newer variant of a product  to its previous, often discontinued predecessor.',
			rangeIncludes: ['ProductModel'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgProductModel;
export const ProductModel = schemaOrgProductModel;

export default schemaOrgProductModel;
