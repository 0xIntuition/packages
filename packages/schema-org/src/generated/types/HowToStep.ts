import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHowToStep = {
	id: 'schema:HowToStep',
	name: 'HowToStep',
	label: 'HowToStep',
	comment:
		'A step in the instructions for how to achieve a result. It is an ordered list with HowToDirection and/or HowToTip items.',
	subClassOf: ['CreativeWork', 'Thing', 'ItemList', 'Intangible', 'ListItem'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHowToStep;
export const HowToStep = schemaOrgHowToStep;

export default schemaOrgHowToStep;
