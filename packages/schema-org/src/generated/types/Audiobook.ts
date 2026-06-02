import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAudiobook = {
	id: 'schema:Audiobook',
	name: 'Audiobook',
	label: 'Audiobook',
	comment: 'An audiobook.',
	subClassOf: ['AudioObject', 'Book', 'MediaObject', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:duration',
			name: 'duration',
			label: 'duration',
			comment:
				'The duration of the item (movie, audio recording, event, etc.) in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
		{
			id: 'schema:readBy',
			name: 'readBy',
			label: 'readBy',
			comment: 'A person who reads (performs) the audiobook.',
			rangeIncludes: ['Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAudiobook;
export const Audiobook = schemaOrgAudiobook;

export default schemaOrgAudiobook;
