import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgArchiveOrganization = {
	id: 'schema:ArchiveOrganization',
	name: 'ArchiveOrganization',
	label: 'ArchiveOrganization',
	comment:
		'An organization with archival holdings. An organization which keeps and preserves archival material and typically makes it accessible to the public.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [
		{
			id: 'schema:archiveHeld',
			name: 'archiveHeld',
			label: 'archiveHeld',
			comment:
				'Collection, [fonds](https://en.wikipedia.org/wiki/Fonds), or item held, kept or maintained by an [[ArchiveOrganization]].',
			rangeIncludes: ['ArchiveComponent'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgArchiveOrganization;
export const ArchiveOrganization = schemaOrgArchiveOrganization;

export default schemaOrgArchiveOrganization;
