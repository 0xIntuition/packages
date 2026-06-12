import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDigitalDocumentPermission = {
	id: 'schema:DigitalDocumentPermission',
	name: 'DigitalDocumentPermission',
	label: 'DigitalDocumentPermission',
	comment: 'A permission for a particular person or group to access a particular file.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:grantee',
			name: 'grantee',
			label: 'grantee',
			comment:
				'The person, organization, contact point, or audience that has been granted this permission.',
			rangeIncludes: ['Audience', 'ContactPoint', 'Organization', 'Person'],
		},
		{
			id: 'schema:permissionType',
			name: 'permissionType',
			label: 'permissionType',
			comment: 'The type of permission granted the person, organization, or audience.',
			rangeIncludes: ['DigitalDocumentPermissionType'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDigitalDocumentPermission;
export const DigitalDocumentPermission = schemaOrgDigitalDocumentPermission;

export default schemaOrgDigitalDocumentPermission;
