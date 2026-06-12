import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCheckoutPage = {
	id: 'schema:CheckoutPage',
	name: 'CheckoutPage',
	label: 'CheckoutPage',
	comment: 'Web page type: Checkout page.',
	subClassOf: ['WebPage', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCheckoutPage;
export const CheckoutPage = schemaOrgCheckoutPage;

export default schemaOrgCheckoutPage;
