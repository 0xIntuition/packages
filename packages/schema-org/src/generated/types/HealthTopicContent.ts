import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHealthTopicContent = {
	id: 'schema:HealthTopicContent',
	name: 'HealthTopicContent',
	label: 'HealthTopicContent',
	comment:
		'[[HealthTopicContent]] is [[WebContent]] that is about some aspect of a health topic, e.g. a condition, its symptoms or treatments. Such content may be comprised of several parts or sections and use different types of media. Multiple instances of [[WebContent]] (and hence [[HealthTopicContent]]) can be related using [[hasPart]] / [[isPartOf]] where there is some kind of content hierarchy, and their content described with [[about]] and [[mentions]] e.g. building upon the existing [[MedicalCondition]] vocabulary.\n  ',
	subClassOf: ['WebContent', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:hasHealthAspect',
			name: 'hasHealthAspect',
			label: 'hasHealthAspect',
			comment:
				'Indicates the aspect or aspects specifically addressed in some [[HealthTopicContent]]. For example, that the content is an overview, or that it talks about treatment, self-care, treatments or their side-effects.',
			rangeIncludes: ['HealthAspectEnumeration'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHealthTopicContent;
export const HealthTopicContent = schemaOrgHealthTopicContent;

export default schemaOrgHealthTopicContent;
