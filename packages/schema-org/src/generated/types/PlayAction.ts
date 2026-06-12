import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPlayAction = {
	id: 'schema:PlayAction',
	name: 'PlayAction',
	label: 'PlayAction',
	comment:
		'The act of playing/exercising/training/performing for enjoyment, leisure, recreation, competition or exercise.\\n\\nRelated actions:\\n\\n* [[ListenAction]]: Unlike ListenAction (which is under ConsumeAction), PlayAction refers to performing for an audience or at an event, rather than consuming music.\\n* [[WatchAction]]: Unlike WatchAction (which is under ConsumeAction), PlayAction refers to showing/displaying for an audience or at an event, rather than consuming visual content.',
	subClassOf: ['Action', 'Thing'],
	properties: [
		{
			id: 'schema:audience',
			name: 'audience',
			label: 'audience',
			comment: 'An intended audience, i.e. a group for whom something was created.',
			rangeIncludes: ['Audience'],
		},
		{
			id: 'schema:event',
			name: 'event',
			label: 'event',
			comment: 'Upcoming or past event associated with this place, organization, or action.',
			rangeIncludes: ['Event'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPlayAction;
export const PlayAction = schemaOrgPlayAction;

export default schemaOrgPlayAction;
