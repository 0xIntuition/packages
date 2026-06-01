import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOnDemandEvent = {
	id: 'schema:OnDemandEvent',
	name: 'OnDemandEvent',
	label: 'OnDemandEvent',
	comment:
		'A publication event, e.g. catch-up TV or radio podcast, during which a program is available on-demand.',
	subClassOf: ['PublicationEvent', 'Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOnDemandEvent;
export const OnDemandEvent = schemaOrgOnDemandEvent;

export default schemaOrgOnDemandEvent;
