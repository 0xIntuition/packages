import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReceiveAction = {
	id: 'schema:ReceiveAction',
	name: 'ReceiveAction',
	label: 'ReceiveAction',
	comment:
		'The act of physically/electronically taking delivery of an object that has been transferred from an origin to a destination. Reciprocal of SendAction.\\n\\nRelated actions:\\n\\n* [[SendAction]]: The reciprocal of ReceiveAction.\\n* [[TakeAction]]: Unlike TakeAction, ReceiveAction does not imply that the ownership has been transferred (e.g. I can receive a package, but it does not mean the package is now mine).',
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
			id: 'schema:sender',
			name: 'sender',
			label: 'sender',
			comment:
				'A sub property of participant. The participant who is at the sending end of the action.',
			rangeIncludes: ['Audience', 'Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReceiveAction;
export const ReceiveAction = schemaOrgReceiveAction;

export default schemaOrgReceiveAction;
