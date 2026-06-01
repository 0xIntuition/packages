import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMusicComposition = {
	id: 'schema:MusicComposition',
	name: 'MusicComposition',
	label: 'MusicComposition',
	comment: 'A musical composition.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:composer',
			name: 'composer',
			label: 'composer',
			comment:
				'The person or organization who wrote a composition, or who is the composer of a work performed at some event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:firstPerformance',
			name: 'firstPerformance',
			label: 'firstPerformance',
			comment: 'The date and place the work was first performed.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:includedComposition',
			name: 'includedComposition',
			label: 'includedComposition',
			comment: 'Smaller compositions included in this work (e.g. a movement in a symphony).',
			rangeIncludes: ['MusicComposition'],
		},
		{
			id: 'schema:iswcCode',
			name: 'iswcCode',
			label: 'iswcCode',
			comment: 'The International Standard Musical Work Code for the composition.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:lyricist',
			name: 'lyricist',
			label: 'lyricist',
			comment: 'The person who wrote the words.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:lyrics',
			name: 'lyrics',
			label: 'lyrics',
			comment: 'The words in the song.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:musicArrangement',
			name: 'musicArrangement',
			label: 'musicArrangement',
			comment: 'An arrangement derived from the composition.',
			rangeIncludes: ['MusicComposition'],
		},
		{
			id: 'schema:musicCompositionForm',
			name: 'musicCompositionForm',
			label: 'musicCompositionForm',
			comment: 'The type of composition (e.g. overture, sonata, symphony, etc.).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:musicalKey',
			name: 'musicalKey',
			label: 'musicalKey',
			comment: 'The key, mode, or scale this composition uses.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:recordedAs',
			name: 'recordedAs',
			label: 'recordedAs',
			comment: 'An audio recording of the work.',
			rangeIncludes: ['MusicRecording'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMusicComposition;
export const MusicComposition = schemaOrgMusicComposition;

export default schemaOrgMusicComposition;
