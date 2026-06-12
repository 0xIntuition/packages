import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDeliveryMethod = {
	id: 'schema:DeliveryMethod',
	name: 'DeliveryMethod',
	label: 'DeliveryMethod',
	comment:
		'A delivery method is a standardized procedure for transferring the product or service to the destination of fulfillment chosen by the customer. Delivery methods are characterized by the means of transportation used, and by the organization or group that is the contracting party for the sending organization or person.\\n\\nCommonly used values:\\n\\n* http://purl.org/goodrelations/v1#DeliveryModeDirectDownload\\n* http://purl.org/goodrelations/v1#DeliveryModeFreight\\n* http://purl.org/goodrelations/v1#DeliveryModeMail\\n* http://purl.org/goodrelations/v1#DeliveryModeOwnFleet\\n* http://purl.org/goodrelations/v1#DeliveryModePickUp\\n* http://purl.org/goodrelations/v1#DHL\\n* http://purl.org/goodrelations/v1#FederalExpress\\n* http://purl.org/goodrelations/v1#UPS\n        ',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDeliveryMethod;
export const DeliveryMethod = schemaOrgDeliveryMethod;

export default schemaOrgDeliveryMethod;
