import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGrant = {
	id: 'schema:Grant',
	name: 'Grant',
	label: 'Grant',
	comment:
		'A grant, typically financial or otherwise quantifiable, of resources. Typically a [[funder]] sponsors some [[MonetaryAmount]] to an [[Organization]] or [[Person]],\n    sometimes not necessarily via a dedicated or long-lived [[Project]], resulting in one or more outputs, or [[fundedItem]]s. For financial sponsorship, indicate the [[funder]] of a [[MonetaryGrant]]. For non-financial support, indicate [[sponsor]] of [[Grant]]s of resources (e.g. office space).\n\nGrants support  activities directed towards some agreed collective goals, often but not always organized as [[Project]]s. Long-lived projects are sometimes sponsored by a variety of grants over time, but it is also common for a project to be associated with a single grant.\n\nThe amount of a [[Grant]] is represented using [[amount]] as a [[MonetaryAmount]].\n    ',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:fundedItem',
			name: 'fundedItem',
			label: 'fundedItem',
			comment:
				'Indicates something directly or indirectly funded or sponsored through a [[Grant]]. See also [[ownershipFundingInfo]].',
			rangeIncludes: [
				'BioChemEntity',
				'CreativeWork',
				'Event',
				'MedicalEntity',
				'Organization',
				'Person',
				'Product',
			],
		},
		{
			id: 'schema:funder',
			name: 'funder',
			label: 'funder',
			comment:
				'A person or organization that supports (sponsors) something through some kind of financial contribution.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:sponsor',
			name: 'sponsor',
			label: 'sponsor',
			comment:
				'A person or organization that supports a thing through a pledge, promise, or financial contribution. E.g. a sponsor of a Medical Study or a corporate sponsor of an event.',
			rangeIncludes: ['Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGrant;
export const Grant = schemaOrgGrant;

export default schemaOrgGrant;
