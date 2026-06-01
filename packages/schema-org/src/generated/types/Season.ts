import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSeason = {
	id: 'schema:Season',
	name: 'Season',
	label: 'Season',
	comment: 'A media season, e.g. TV, radio, video game etc.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSeason;
export const Season = schemaOrgSeason;

export default schemaOrgSeason;
