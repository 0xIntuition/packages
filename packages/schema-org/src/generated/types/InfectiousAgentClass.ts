import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInfectiousAgentClass = {
	id: 'schema:InfectiousAgentClass',
	name: 'InfectiousAgentClass',
	label: 'InfectiousAgentClass',
	comment: 'Classes of agents or pathogens that transmit infectious diseases. Enumerated type.',
	subClassOf: ['MedicalEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInfectiousAgentClass;
export const InfectiousAgentClass = schemaOrgInfectiousAgentClass;

export default schemaOrgInfectiousAgentClass;
