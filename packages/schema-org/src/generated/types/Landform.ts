import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLandform = {
	id: 'schema:Landform',
	name: 'Landform',
	label: 'Landform',
	comment:
		'A landform or physical feature.  Landform elements include mountains, plains, lakes, rivers, seascape and oceanic waterbody interface features such as bays, peninsulas, seas and so forth, including sub-aqueous terrain features such as submersed mountain ranges, volcanoes, and the great ocean basins.',
	subClassOf: ['Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLandform;
export const Landform = schemaOrgLandform;

export default schemaOrgLandform;
