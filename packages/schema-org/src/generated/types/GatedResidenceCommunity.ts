import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGatedResidenceCommunity = {
	id: 'schema:GatedResidenceCommunity',
	name: 'GatedResidenceCommunity',
	label: 'GatedResidenceCommunity',
	comment: 'Residence type: Gated community.',
	subClassOf: ['Residence', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGatedResidenceCommunity;
export const GatedResidenceCommunity = schemaOrgGatedResidenceCommunity;

export default schemaOrgGatedResidenceCommunity;
