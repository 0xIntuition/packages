import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComputerLanguage = {
	id: 'schema:ComputerLanguage',
	name: 'ComputerLanguage',
	label: 'ComputerLanguage',
	comment:
		'This type covers computer programming languages such as Scheme and Lisp, as well as other language-like computer representations. Natural languages are best represented with the [[Language]] type.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComputerLanguage;
export const ComputerLanguage = schemaOrgComputerLanguage;

export default schemaOrgComputerLanguage;
