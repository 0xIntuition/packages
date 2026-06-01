import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBorrowAction = {
	id: 'schema:BorrowAction',
	name: 'BorrowAction',
	label: 'BorrowAction',
	comment:
		'The act of obtaining an object under an agreement to return it at a later date. Reciprocal of LendAction.\\n\\nRelated actions:\\n\\n* [[LendAction]]: Reciprocal of BorrowAction.',
	subClassOf: ['TransferAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:lender',
			name: 'lender',
			label: 'lender',
			comment: 'A sub property of participant. The person that lends the object being borrowed.',
			rangeIncludes: ['Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBorrowAction;
export const BorrowAction = schemaOrgBorrowAction;

export default schemaOrgBorrowAction;
