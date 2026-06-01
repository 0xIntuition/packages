import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMediaSubscription = {
	id: 'schema:MediaSubscription',
	name: 'MediaSubscription',
	label: 'MediaSubscription',
	comment: 'A subscription which allows a user to access media including audio, video, books, etc.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:authenticator',
			name: 'authenticator',
			label: 'authenticator',
			comment:
				"The Organization responsible for authenticating the user's subscription. For example, many media apps require a cable/satellite provider to authenticate your subscription before playing media.",
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:expectsAcceptanceOf',
			name: 'expectsAcceptanceOf',
			label: 'expectsAcceptanceOf',
			comment:
				'An Offer which must be accepted before the user can perform the Action. For example, the user may need to buy a movie before being able to watch it.',
			rangeIncludes: ['Offer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMediaSubscription;
export const MediaSubscription = schemaOrgMediaSubscription;

export default schemaOrgMediaSubscription;
