import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAction = {
	id: 'schema:Action',
	name: 'Action',
	label: 'Action',
	comment:
		'An action performed by a direct agent and indirect participants upon a direct object. Optionally happens at a location with the help of an inanimate instrument. The execution of the action may produce a result. Specific action sub-type documentation specifies the exact expectation of each argument/role.\\n\\nSee also [blog post](https://blog.schema.org/2014/04/16/announcing-schema-org-actions/) and [Actions overview document](https://schema.org/docs/actions.html).',
	subClassOf: ['Thing'],
	properties: [
		{
			id: 'schema:actionProcess',
			name: 'actionProcess',
			label: 'actionProcess',
			comment: 'Description of the process by which the action was performed.',
			rangeIncludes: ['HowTo'],
		},
		{
			id: 'schema:actionStatus',
			name: 'actionStatus',
			label: 'actionStatus',
			comment: 'Indicates the current disposition of the Action.',
			rangeIncludes: ['ActionStatusType'],
		},
		{
			id: 'schema:agent',
			name: 'agent',
			label: 'agent',
			comment:
				'The direct performer or driver of the action (animate or inanimate). E.g. *John* wrote a book.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:endTime',
			name: 'endTime',
			label: 'endTime',
			comment:
				"The endTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to end. For actions that span a period of time, when the action was performed. E.g. John wrote a book from January to *December*. For media, including audio and video, it's the time offset of the end of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:error',
			name: 'error',
			label: 'error',
			comment:
				'For failed actions, more information on the cause of the failure. Consider using the Error type.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:instrument',
			name: 'instrument',
			label: 'instrument',
			comment:
				'The object that helped the agent perform the action. E.g. John wrote a book with *a pen*.',
			rangeIncludes: ['Thing'],
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
			id: 'schema:object',
			name: 'object',
			label: 'object',
			comment:
				"The object upon which the action is carried out, whose state is kept intact or changed. Also known as the semantic roles patient, affected or undergoer (which change their state) or theme (which doesn't). E.g. John read *a book*.",
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:participant',
			name: 'participant',
			label: 'participant',
			comment:
				'Other co-agents that participated in the action indirectly. E.g. John wrote a book with *Steve*.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:provider',
			name: 'provider',
			label: 'provider',
			comment:
				'The service provider, service operator, or service performer; the goods producer. Another party (a seller) may offer those services or goods on behalf of the provider. A provider may also serve as the seller.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:result',
			name: 'result',
			label: 'result',
			comment: 'The result produced in the action. E.g. John wrote *a book*.',
			rangeIncludes: ['Thing'],
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
			id: 'schema:target',
			name: 'target',
			label: 'target',
			comment: 'Indicates a target EntryPoint, or url, for an Action.',
			rangeIncludes: ['EntryPoint', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAction;
export const Action = schemaOrgAction;

export default schemaOrgAction;
