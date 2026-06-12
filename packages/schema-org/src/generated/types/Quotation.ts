import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQuotation = {
	id: 'schema:Quotation',
	name: 'Quotation',
	label: 'Quotation',
	comment:
		'A quotation. Often but not necessarily from some written work, attributable to a real world author and - if associated with a fictional character - to any fictional Person. Use [[isBasedOn]] to link to source/origin. The [[recordedIn]] property can be used to reference a Quotation from an [[Event]].',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:spokenByCharacter',
			name: 'spokenByCharacter',
			label: 'spokenByCharacter',
			comment:
				'The (e.g. fictional) character, Person or Organization to whom the quotation is attributed within the containing CreativeWork.',
			rangeIncludes: ['Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgQuotation;
export const Quotation = schemaOrgQuotation;

export default schemaOrgQuotation;
