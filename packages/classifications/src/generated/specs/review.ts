import type { ClassificationSpec } from '../../types.js';

export const review: ClassificationSpec = {
	slug: 'review',
	type: 'Review',
	displayName: 'Review',
	description: 'A review identity linked to a durable target reference.',
	category: 'Creative Work',
	schemaOrg: { context: 'https://schema.org/', type: 'Review' },
	fields: [
		{
			key: 'name',
			label: 'Review Title',
			description: 'The review title when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Great wallet UX',
		},
		{
			key: 'reviewBody',
			label: 'Review Text',
			description: 'The main review text.',
			fieldType: 'string',
			required: true,
			placeholder: 'Very smooth onboarding and transaction flow.',
		},
		{
			key: 'itemReviewed',
			label: 'Reviewed Item',
			description: 'The identifier or URL of the item being reviewed.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://example.com/products/wallet',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same review.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/reviews/wallet-123',
		},
	],
	defaults: { pluginId: 'review', provider: 'opengraph' },
};
