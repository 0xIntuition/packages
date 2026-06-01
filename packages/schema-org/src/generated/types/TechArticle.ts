import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTechArticle = {
	id: 'schema:TechArticle',
	name: 'TechArticle',
	label: 'TechArticle',
	comment:
		'A technical article - Example: How-to (task) topics, step-by-step, procedural troubleshooting, specifications, etc.',
	subClassOf: ['Article', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:dependencies',
			name: 'dependencies',
			label: 'dependencies',
			comment: 'Prerequisites needed to fulfill steps in article.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:proficiencyLevel',
			name: 'proficiencyLevel',
			label: 'proficiencyLevel',
			comment: "Proficiency needed for this content; expected values: 'Beginner', 'Expert'.",
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTechArticle;
export const TechArticle = schemaOrgTechArticle;

export default schemaOrgTechArticle;
