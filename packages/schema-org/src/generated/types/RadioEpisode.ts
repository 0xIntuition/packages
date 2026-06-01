import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRadioEpisode = {
	id: 'schema:RadioEpisode',
	name: 'RadioEpisode',
	label: 'RadioEpisode',
	comment: 'A radio episode which can be part of a series or season.',
	subClassOf: ['Episode', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRadioEpisode;
export const RadioEpisode = schemaOrgRadioEpisode;

export default schemaOrgRadioEpisode;
