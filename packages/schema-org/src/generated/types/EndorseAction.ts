import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEndorseAction = {
	id: 'schema:EndorseAction',
	name: 'EndorseAction',
	label: 'EndorseAction',
	comment: 'An agent approves/certifies/likes/supports/sanctions an object.',
	subClassOf: ['ReactAction', 'AssessAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:endorsee',
			name: 'endorsee',
			label: 'endorsee',
			comment: 'A sub property of participant. The person/organization being supported.',
			rangeIncludes: ['Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEndorseAction;
export const EndorseAction = schemaOrgEndorseAction;

export default schemaOrgEndorseAction;
