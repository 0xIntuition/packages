import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMathSolver = {
	id: 'schema:MathSolver',
	name: 'MathSolver',
	label: 'MathSolver',
	comment: 'A math solver which is capable of solving a subset of mathematical problems.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:mathExpression',
			name: 'mathExpression',
			label: 'mathExpression',
			comment:
				"A mathematical expression (e.g. 'x^2-3x=0') that may be solved for a specific variable, simplified, or transformed. This can take many formats, e.g. LaTeX, Ascii-Math, or math as you would write with a keyboard.",
			rangeIncludes: ['SolveMathAction', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMathSolver;
export const MathSolver = schemaOrgMathSolver;

export default schemaOrgMathSolver;
