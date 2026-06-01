import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSequentialArt = {
	id: 'schema:SequentialArt',
	name: 'SequentialArt',
	label: 'SequentialArt',
	comment:
		'An art forms that use images deployed in a specific order for the purpose of graphic storytelling (i.e., narration of graphic stories) or conveying information. Examples of SequentialArt are Franco-Belgian Bande Dessinée, Comics in the USA and 漫画 (Manga) in Japan.',
	subClassOf: ['Book', 'CreativeWork', 'Thing', 'VisualArtwork'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSequentialArt;
export const SequentialArt = schemaOrgSequentialArt;

export default schemaOrgSequentialArt;
