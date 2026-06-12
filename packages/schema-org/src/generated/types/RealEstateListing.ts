import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRealEstateListing = {
	id: 'schema:RealEstateListing',
	name: 'RealEstateListing',
	label: 'RealEstateListing',
	comment:
		'A [[RealEstateListing]] is a listing that describes one or more real-estate [[Offer]]s (whose [[businessFunction]] is typically to lease out, or to sell).\n  The [[RealEstateListing]] type itself represents the overall listing, as manifested in some [[WebPage]].\n  ',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:datePosted',
			name: 'datePosted',
			label: 'datePosted',
			comment: 'Publication date of an online listing.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:leaseLength',
			name: 'leaseLength',
			label: 'leaseLength',
			comment:
				'Length of the lease for some [[Accommodation]], either particular to some [[Offer]] or in some cases intrinsic to the property.',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRealEstateListing;
export const RealEstateListing = schemaOrgRealEstateListing;

export default schemaOrgRealEstateListing;
