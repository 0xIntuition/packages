import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPublicToilet = {
	id: 'schema:PublicToilet',
	name: 'PublicToilet',
	label: 'PublicToilet',
	comment:
		'A public toilet is a room or small building containing one or more toilets (and possibly also urinals) which is available for use by the general public, or by customers or employees of certain businesses.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPublicToilet;
export const PublicToilet = schemaOrgPublicToilet;

export default schemaOrgPublicToilet;
