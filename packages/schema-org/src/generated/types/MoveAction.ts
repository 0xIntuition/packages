import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMoveAction = {
	id: 'schema:MoveAction',
	name: 'MoveAction',
	label: 'MoveAction',
	comment:
		'The act of an agent relocating to a place.\\n\\nRelated actions:\\n\\n* [[TransferAction]]: Unlike TransferAction, the subject of the move is a living Person or Organization rather than an inanimate object.',
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

export const spec = schemaOrgMoveAction;
export const MoveAction = schemaOrgMoveAction;

export default schemaOrgMoveAction;
