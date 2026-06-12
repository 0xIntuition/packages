import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVisualArtwork = {
	id: 'schema:VisualArtwork',
	name: 'VisualArtwork',
	label: 'VisualArtwork',
	comment: 'A work of art that is primarily visual in character.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:artEdition',
			name: 'artEdition',
			label: 'artEdition',
			comment:
				'The number of copies when multiple copies of a piece of artwork are produced - e.g. for a limited edition of 20 prints, \'artEdition\' refers to the total number of copies (in this example "20").',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:artMedium',
			name: 'artMedium',
			label: 'artMedium',
			comment:
				'The material used. (E.g. Oil, Watercolour, Acrylic, Linoprint, Marble, Cyanotype, Digital, Lithograph, DryPoint, Intaglio, Pastel, Woodcut, Pencil, Mixed Media, etc.)',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:artform',
			name: 'artform',
			label: 'artform',
			comment: 'e.g. Painting, Drawing, Sculpture, Print, Photograph, Assemblage, Collage, etc.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:artist',
			name: 'artist',
			label: 'artist',
			comment:
				'The primary artist for a work\n    \tin a medium other than pencils or digital line art--for example, if the\n    \tprimary artwork is done in watercolors or digital paints.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:artworkSurface',
			name: 'artworkSurface',
			label: 'artworkSurface',
			comment: 'The supporting materials for the artwork, e.g. Canvas, Paper, Wood, Board, etc.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:colorist',
			name: 'colorist',
			label: 'colorist',
			comment: 'The individual who adds color to inked drawings.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:depth',
			name: 'depth',
			label: 'depth',
			comment: 'The depth of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
		},
		{
			id: 'schema:height',
			name: 'height',
			label: 'height',
			comment: 'The height of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
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
			id: 'schema:surface',
			name: 'surface',
			label: 'surface',
			comment:
				'A material used as a surface in some artwork, e.g. Canvas, Paper, Wood, Board, etc.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:weight',
			name: 'weight',
			label: 'weight',
			comment: 'The weight of the product or person.',
			rangeIncludes: ['Mass', 'QuantitativeValue'],
		},
		{
			id: 'schema:width',
			name: 'width',
			label: 'width',
			comment: 'The width of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVisualArtwork;
export const VisualArtwork = schemaOrgVisualArtwork;

export default schemaOrgVisualArtwork;
