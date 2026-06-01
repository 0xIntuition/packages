import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHyperToc = {
	id: 'schema:HyperToc',
	name: 'HyperToc',
	label: 'HyperToc',
	comment:
		'A HyperToc represents a hypertext table of contents for complex media objects, such as [[VideoObject]], [[AudioObject]]. Items in the table of contents are indicated using the [[tocEntry]] property, and typed [[HyperTocEntry]]. For cases where the same larger work is split into multiple files, [[associatedMedia]] can be used on individual [[HyperTocEntry]] items.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:associatedMedia',
			name: 'associatedMedia',
			label: 'associatedMedia',
			comment:
				'A media object that encodes this CreativeWork. This property is a synonym for encoding.',
			rangeIncludes: ['MediaObject'],
		},
		{
			id: 'schema:tocEntry',
			name: 'tocEntry',
			label: 'tocEntry',
			comment: 'Indicates a [[HyperTocEntry]] in a [[HyperToc]].',
			rangeIncludes: ['HyperTocEntry'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHyperToc;
export const HyperToc = schemaOrgHyperToc;

export default schemaOrgHyperToc;
