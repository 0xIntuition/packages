import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHowToTip = {
	id: 'schema:HowToTip',
	name: 'HowToTip',
	label: 'HowToTip',
	comment:
		"An explanation in the instructions for how to achieve a result. It provides supplementary information about a technique, supply, author's preference, etc. It can explain what could be done, or what should not be done, but doesn't specify what should be done (see HowToDirection).",
	subClassOf: ['CreativeWork', 'Thing', 'ListItem', 'Intangible'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHowToTip;
export const HowToTip = schemaOrgHowToTip;

export default schemaOrgHowToTip;
