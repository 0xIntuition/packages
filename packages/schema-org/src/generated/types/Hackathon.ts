import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHackathon = {
	id: 'schema:Hackathon',
	name: 'Hackathon',
	label: 'Hackathon',
	comment: 'A [hackathon](https://en.wikipedia.org/wiki/Hackathon) event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHackathon;
export const Hackathon = schemaOrgHackathon;

export default schemaOrgHackathon;
