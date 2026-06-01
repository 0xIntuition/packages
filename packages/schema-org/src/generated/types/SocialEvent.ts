import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSocialEvent = {
	id: 'schema:SocialEvent',
	name: 'SocialEvent',
	label: 'SocialEvent',
	comment: 'Event type: Social event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSocialEvent;
export const SocialEvent = schemaOrgSocialEvent;

export default schemaOrgSocialEvent;
