import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComicStory = {
	id: 'schema:ComicStory',
	name: 'ComicStory',
	label: 'ComicStory',
	comment:
		'The term "story" is any indivisible, re-printable\n    \tunit of a comic, including the interior stories, covers, and backmatter. Most\n    \tcomics have at least two stories: a cover (ComicCoverArt) and an interior story.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:artist',
			name: 'artist',
			label: 'artist',
			comment:
				'The primary artist for a work\n    \tin a medium other than pencils or digital line art--for example, if the\n    \tprimary artwork is done in watercolors or digital paints.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:colorist',
			name: 'colorist',
			label: 'colorist',
			comment: 'The individual who adds color to inked drawings.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:inker',
			name: 'inker',
			label: 'inker',
			comment:
				'The individual who traces over the pencil drawings in ink after pencils are complete.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:letterer',
			name: 'letterer',
			label: 'letterer',
			comment:
				'The individual who adds lettering, including speech balloons and sound effects, to artwork.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:penciler',
			name: 'penciler',
			label: 'penciler',
			comment: 'The individual who draws the primary narrative artwork.',
			rangeIncludes: ['Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComicStory;
export const ComicStory = schemaOrgComicStory;

export default schemaOrgComicStory;
