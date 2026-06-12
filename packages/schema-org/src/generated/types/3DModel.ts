import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrg3DModel = {
	id: 'schema:3DModel',
	name: '3DModel',
	label: '3DModel',
	comment:
		"A 3D model represents some kind of 3D content, which may have [[encoding]]s in one or more [[MediaObject]]s. Many 3D formats are available (e.g. see [Wikipedia](https://en.wikipedia.org/wiki/Category:3D_graphics_file_formats)); specific encoding formats can be represented using the [[encodingFormat]] property applied to the relevant [[MediaObject]]. For the\ncase of a single file published after Zip compression, the convention of appending '+zip' to the [[encodingFormat]] can be used. Geospatial, AR/VR, artistic/animation, gaming, engineering and scientific content can all be represented using [[3DModel]].",
	subClassOf: ['MediaObject', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:isResizable',
			name: 'isResizable',
			label: 'isResizable',
			comment:
				'Whether the 3DModel allows resizing. For example, room layout applications often do not allow 3DModel elements to be resized to reflect reality.',
			rangeIncludes: ['Boolean'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrg3DModel;

export default schemaOrg3DModel;
