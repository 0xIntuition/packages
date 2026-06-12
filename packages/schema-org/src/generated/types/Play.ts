import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPlay = {
	id: 'schema:Play',
	name: 'Play',
	label: 'Play',
	comment:
		'A play is a form of literature, usually consisting of dialogue between characters, intended for theatrical performance rather than just reading. Note: A performance of a Play would be a [[TheaterEvent]] or [[BroadcastEvent]] - the *Play* being the [[workPerformed]].',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPlay;
export const Play = schemaOrgPlay;

export default schemaOrgPlay;
