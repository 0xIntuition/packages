import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPublicationEvent = {
	id: 'schema:PublicationEvent',
	name: 'PublicationEvent',
	label: 'PublicationEvent',
	comment:
		'A PublicationEvent corresponds indifferently to the event of publication for a CreativeWork of any type, e.g. a broadcast event, an on-demand event, a book/journal publication via a variety of delivery media.',
	subClassOf: ['Event', 'Thing'],
	properties: [
		{
			id: 'schema:free',
			name: 'free',
			label: 'free',
			comment: 'A flag to signal that the item, event, or place is accessible for free.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:publishedBy',
			name: 'publishedBy',
			label: 'publishedBy',
			comment: 'An agent associated with the publication event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:publishedOn',
			name: 'publishedOn',
			label: 'publishedOn',
			comment: 'A broadcast service associated with the publication event.',
			rangeIncludes: ['BroadcastService'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPublicationEvent;
export const PublicationEvent = schemaOrgPublicationEvent;

export default schemaOrgPublicationEvent;
