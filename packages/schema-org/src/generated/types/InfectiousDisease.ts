import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInfectiousDisease = {
	id: 'schema:InfectiousDisease',
	name: 'InfectiousDisease',
	label: 'InfectiousDisease',
	comment:
		'An infectious disease is a clinically evident human disease resulting from the presence of pathogenic microbial agents, like pathogenic viruses, pathogenic bacteria, fungi, protozoa, multicellular parasites, and prions. To be considered an infectious disease, such pathogens are known to be able to cause this disease.',
	subClassOf: ['MedicalCondition', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:infectiousAgent',
			name: 'infectiousAgent',
			label: 'infectiousAgent',
			comment: 'The actual infectious agent, such as a specific bacterium.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:infectiousAgentClass',
			name: 'infectiousAgentClass',
			label: 'infectiousAgentClass',
			comment: 'The class of infectious agent (bacteria, prion, etc.) that causes the disease.',
			rangeIncludes: ['InfectiousAgentClass'],
		},
		{
			id: 'schema:transmissionMethod',
			name: 'transmissionMethod',
			label: 'transmissionMethod',
			comment:
				"How the disease spreads, either as a route or vector, for example 'direct contact', 'Aedes aegypti', etc.",
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInfectiousDisease;
export const InfectiousDisease = schemaOrgInfectiousDisease;

export default schemaOrgInfectiousDisease;
