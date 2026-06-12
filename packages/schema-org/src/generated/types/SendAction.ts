import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSendAction = {
	id: 'schema:SendAction',
	name: 'SendAction',
	label: 'SendAction',
	comment:
		"The act of physically/electronically dispatching an object for transfer from an origin to a destination. Related actions:\\n\\n* [[ReceiveAction]]: The reciprocal of SendAction.\\n* [[GiveAction]]: Unlike GiveAction, SendAction does not imply the transfer of ownership (e.g. I can send you my laptop, but I'm not necessarily giving it to you).",
	subClassOf: ['TransferAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:deliveryMethod',
			name: 'deliveryMethod',
			label: 'deliveryMethod',
			comment: 'A sub property of instrument. The method of delivery.',
			rangeIncludes: ['DeliveryMethod'],
		},
		{
			id: 'schema:recipient',
			name: 'recipient',
			label: 'recipient',
			comment:
				'A sub property of participant. The participant who is at the receiving end of the action.',
			rangeIncludes: ['Audience', 'ContactPoint', 'Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSendAction;
export const SendAction = schemaOrgSendAction;

export default schemaOrgSendAction;
