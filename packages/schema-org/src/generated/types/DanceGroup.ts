import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDanceGroup = {
	id: 'schema:DanceGroup',
	name: 'DanceGroup',
	label: 'DanceGroup',
	comment: 'A dance group&#x2014;for example, the Alvin Ailey Dance Theater or Riverdance.',
	subClassOf: ['PerformingGroup', 'Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDanceGroup;
export const DanceGroup = schemaOrgDanceGroup;

export default schemaOrgDanceGroup;
