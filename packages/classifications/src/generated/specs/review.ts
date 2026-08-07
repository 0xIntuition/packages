import type { ClassificationSpec } from '../../types.js';

export const review: ClassificationSpec = {
	slug: 'review',
	type: 'Review',
	displayName: 'Review',
	description: 'A review identity linked to a durable target reference.',
	category: 'Creative Work',
	schema: { context: 'https://schema.org/', type: 'Review' },
	metadataPredicates: ['itemReviewed', 'authoredBy', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Review Title',
			description: 'The review title when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Great wallet UX',
		},
		{
			key: 'reviewBody',
			schemaProperty: 'reviewBody',
			label: 'Review Text',
			description: 'The main review text.',
			fieldType: 'string',
			required: true,
			placeholder: 'Very smooth onboarding and transaction flow.',
		},
		{
			key: 'itemReviewed',
			schemaProperty: 'itemReviewed',
			label: 'Reviewed Item',
			description: 'The identifier or URL of the item being reviewed.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://example.com/products/wallet',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same review.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/reviews/wallet-123',
		},
	],
	defaults: { pluginId: 'review', provider: 'opengraph' },
	identity: {
		identifies: 'one review of one subject (relational entity)',
		ladder: [
			// gen1 recipe needs the subject's IID; awaits IID-typed reference fields
			{ kind: 'scheme', scheme: 'url', source: { kind: 'same-as' } },
		],
	},
};
