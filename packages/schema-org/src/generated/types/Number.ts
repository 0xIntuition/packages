import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNumber = {
	id: 'schema:Number',
	name: 'Number',
	label: 'Number',
	comment:
		"Data type: Number.\\n\\nUsage guidelines:\\n\\n* Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similar Unicode symbols.\\n* Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.",
	subClassOf: [],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNumber;

export default schemaOrgNumber;
