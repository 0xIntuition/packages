import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLendAction = {
	id: 'schema:LendAction',
	name: 'LendAction',
	label: 'LendAction',
	comment:
		'The act of providing an object under an agreement that it will be returned at a later date. Reciprocal of BorrowAction.\\n\\nRelated actions:\\n\\n* [[BorrowAction]]: Reciprocal of LendAction.',
	subClassOf: ['TransferAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:borrower',
			name: 'borrower',
			label: 'borrower',
			comment: 'A sub property of participant. The person that borrows the object being lent.',
			rangeIncludes: ['Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLendAction;
export const LendAction = schemaOrgLendAction;

export default schemaOrgLendAction;
