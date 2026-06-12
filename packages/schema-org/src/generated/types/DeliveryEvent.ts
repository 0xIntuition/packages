import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDeliveryEvent = {
	id: 'schema:DeliveryEvent',
	name: 'DeliveryEvent',
	label: 'DeliveryEvent',
	comment: 'An event involving the delivery of an item.',
	subClassOf: ['Event', 'Thing'],
	properties: [
		{
			id: 'schema:accessCode',
			name: 'accessCode',
			label: 'accessCode',
			comment: 'Password, PIN, or access code needed for delivery (e.g. from a locker).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:availableFrom',
			name: 'availableFrom',
			label: 'availableFrom',
			comment: 'When the item is available for pickup from the store, locker, etc.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:availableThrough',
			name: 'availableThrough',
			label: 'availableThrough',
			comment: 'After this date, the item will no longer be available for pickup.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:hasDeliveryMethod',
			name: 'hasDeliveryMethod',
			label: 'hasDeliveryMethod',
			comment: 'Method used for delivery or shipping.',
			rangeIncludes: ['DeliveryMethod'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDeliveryEvent;
export const DeliveryEvent = schemaOrgDeliveryEvent;

export default schemaOrgDeliveryEvent;
