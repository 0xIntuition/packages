import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInteractionCounter = {
	id: 'schema:InteractionCounter',
	name: 'InteractionCounter',
	label: 'InteractionCounter',
	comment:
		'A summary of how users have interacted with this CreativeWork. In most cases, authors will use a subtype to specify the specific type of interaction.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:endTime',
			name: 'endTime',
			label: 'endTime',
			comment:
				"The endTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to end. For actions that span a period of time, when the action was performed. E.g. John wrote a book from January to *December*. For media, including audio and video, it's the time offset of the end of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:interactionService',
			name: 'interactionService',
			label: 'interactionService',
			comment: 'The WebSite or SoftwareApplication where the interactions took place.',
			rangeIncludes: ['SoftwareApplication', 'WebSite'],
		},
		{
			id: 'schema:interactionType',
			name: 'interactionType',
			label: 'interactionType',
			comment:
				'The Action representing the type of interaction. For up votes, +1s, etc. use [[LikeAction]]. For down votes use [[DislikeAction]]. Otherwise, use the most specific Action.',
			rangeIncludes: ['Action'],
		},
		{
			id: 'schema:location',
			name: 'location',
			label: 'location',
			comment:
				'The location of, for example, where an event is happening, where an organization is located, or where an action takes place.',
			rangeIncludes: ['Place', 'PostalAddress', 'Text', 'VirtualLocation'],
		},
		{
			id: 'schema:startTime',
			name: 'startTime',
			label: 'startTime',
			comment:
				"The startTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to start. For actions that span a period of time, when the action was performed. E.g. John wrote a book from *January* to December. For media, including audio and video, it's the time offset of the start of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:userInteractionCount',
			name: 'userInteractionCount',
			label: 'userInteractionCount',
			comment:
				'The number of interactions for the CreativeWork using the WebSite or SoftwareApplication.',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInteractionCounter;
export const InteractionCounter = schemaOrgInteractionCounter;

export default schemaOrgInteractionCounter;
