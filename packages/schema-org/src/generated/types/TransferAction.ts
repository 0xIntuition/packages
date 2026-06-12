import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTransferAction = {
	id: 'schema:TransferAction',
	name: 'TransferAction',
	label: 'TransferAction',
	comment:
		'The act of transferring/moving (abstract or concrete) animate or inanimate objects from one place to another.',
	subClassOf: ['Action', 'Thing'],
	properties: [
		{
			id: 'schema:fromLocation',
			name: 'fromLocation',
			label: 'fromLocation',
			comment:
				'A sub property of location. The original location of the object or the agent before the action.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:toLocation',
			name: 'toLocation',
			label: 'toLocation',
			comment:
				'A sub property of location. The final location of the object or the agent after the action.',
			rangeIncludes: ['Place'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTransferAction;
export const TransferAction = schemaOrgTransferAction;

export default schemaOrgTransferAction;
