import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOrderItem = {
	id: 'schema:OrderItem',
	name: 'OrderItem',
	label: 'OrderItem',
	comment:
		'An order item is a line of an order. It includes the quantity and shipping details of a bought offer.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:orderDelivery',
			name: 'orderDelivery',
			label: 'orderDelivery',
			comment: 'The delivery of the parcel related to this order or order item.',
			rangeIncludes: ['ParcelDelivery'],
		},
		{
			id: 'schema:orderItemNumber',
			name: 'orderItemNumber',
			label: 'orderItemNumber',
			comment: 'The identifier of the order item.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:orderItemStatus',
			name: 'orderItemStatus',
			label: 'orderItemStatus',
			comment: 'The current status of the order item.',
			rangeIncludes: ['OrderStatus'],
		},
		{
			id: 'schema:orderQuantity',
			name: 'orderQuantity',
			label: 'orderQuantity',
			comment:
				'The number of the item ordered. If the property is not set, assume the quantity is one.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:orderedItem',
			name: 'orderedItem',
			label: 'orderedItem',
			comment: 'The item ordered.',
			rangeIncludes: ['OrderItem', 'Product', 'Service'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOrderItem;
export const OrderItem = schemaOrgOrderItem;

export default schemaOrgOrderItem;
