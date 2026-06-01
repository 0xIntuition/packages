import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHowToTool = {
	id: 'schema:HowToTool',
	name: 'HowToTool',
	label: 'HowToTool',
	comment:
		'A tool used (but not consumed) when performing instructions for how to achieve a result.',
	subClassOf: ['HowToItem', 'ListItem', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHowToTool;
export const HowToTool = schemaOrgHowToTool;

export default schemaOrgHowToTool;
