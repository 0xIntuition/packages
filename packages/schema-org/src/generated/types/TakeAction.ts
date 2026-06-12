import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTakeAction = {
	id: 'schema:TakeAction',
	name: 'TakeAction',
	label: 'TakeAction',
	comment:
		'The act of gaining ownership of an object from an origin. Reciprocal of GiveAction.\\n\\nRelated actions:\\n\\n* [[GiveAction]]: The reciprocal of TakeAction.\\n* [[ReceiveAction]]: Unlike ReceiveAction, TakeAction implies that ownership has been transferred.',
	subClassOf: ['TransferAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTakeAction;
export const TakeAction = schemaOrgTakeAction;

export default schemaOrgTakeAction;
