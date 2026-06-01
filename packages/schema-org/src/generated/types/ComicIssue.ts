import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComicIssue = {
	id: 'schema:ComicIssue',
	name: 'ComicIssue',
	label: 'ComicIssue',
	comment:
		'Individual comic issues are serially published as\n    \tpart of a larger series. For the sake of consistency, even one-shot issues\n    \tbelong to a series comprised of a single issue. All comic issues can be\n    \tuniquely identified by: the combination of the name and volume number of the\n    \tseries to which the issue belongs; the issue number; and the variant\n    \tdescription of the issue (if any).',
	subClassOf: ['PublicationIssue', 'CreativeWork', 'Thing'],
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
		{
			id: 'schema:variantCover',
			name: 'variantCover',
			label: 'variantCover',
			comment:
				'A description of the variant cover\n    \tfor the issue, if the issue is a variant printing. For example, "Bryan Hitch\n    \tVariant Cover" or "2nd Printing Variant".',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComicIssue;
export const ComicIssue = schemaOrgComicIssue;

export default schemaOrgComicIssue;
