import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRadioSeason = {
	id: 'schema:RadioSeason',
	name: 'RadioSeason',
	label: 'RadioSeason',
	comment: 'Season dedicated to radio broadcast and associated online delivery.',
	subClassOf: ['CreativeWorkSeason', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRadioSeason;
export const RadioSeason = schemaOrgRadioSeason;

export default schemaOrgRadioSeason;
