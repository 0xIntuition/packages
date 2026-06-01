import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTrackAction = {
	id: 'schema:TrackAction',
	name: 'TrackAction',
	label: 'TrackAction',
	comment:
		'An agent tracks an object for updates.\\n\\nRelated actions:\\n\\n* [[FollowAction]]: Unlike FollowAction, TrackAction refers to the interest on the location of innanimates objects.\\n* [[SubscribeAction]]: Unlike SubscribeAction, TrackAction refers to  the interest on the location of innanimate objects.',
	subClassOf: ['FindAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:deliveryMethod',
			name: 'deliveryMethod',
			label: 'deliveryMethod',
			comment: 'A sub property of instrument. The method of delivery.',
			rangeIncludes: ['DeliveryMethod'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTrackAction;
export const TrackAction = schemaOrgTrackAction;

export default schemaOrgTrackAction;
