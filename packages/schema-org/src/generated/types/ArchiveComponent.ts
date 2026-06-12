import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgArchiveComponent = {
	id: 'schema:ArchiveComponent',
	name: 'ArchiveComponent',
	label: 'ArchiveComponent',
	comment:
		'An intangible type to be applied to any archive content, carrying with it a set of properties required to describe archival items and collections.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:holdingArchive',
			name: 'holdingArchive',
			label: 'holdingArchive',
			comment: '[[ArchiveOrganization]] that holds, keeps or maintains the [[ArchiveComponent]].',
			rangeIncludes: ['ArchiveOrganization'],
		},
		{
			id: 'schema:itemLocation',
			name: 'itemLocation',
			label: 'itemLocation',
			comment: 'Current location of the item.',
			rangeIncludes: ['Place', 'PostalAddress', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgArchiveComponent;
export const ArchiveComponent = schemaOrgArchiveComponent;

export default schemaOrgArchiveComponent;
