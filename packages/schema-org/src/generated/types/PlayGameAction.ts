import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPlayGameAction = {
	id: 'schema:PlayGameAction',
	name: 'PlayGameAction',
	label: 'PlayGameAction',
	comment: 'The act of playing a video game.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:gameAvailabilityType',
			name: 'gameAvailabilityType',
			label: 'gameAvailabilityType',
			comment:
				'Indicates the availability type of the game content associated with this action, such as whether it is a full version or a demo.',
			rangeIncludes: ['GameAvailabilityEnumeration', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPlayGameAction;
export const PlayGameAction = schemaOrgPlayGameAction;

export default schemaOrgPlayGameAction;
