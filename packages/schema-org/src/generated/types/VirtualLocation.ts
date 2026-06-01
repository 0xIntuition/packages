import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVirtualLocation = {
	id: 'schema:VirtualLocation',
	name: 'VirtualLocation',
	label: 'VirtualLocation',
	comment:
		'An online or virtual location for attending events. For example, one may attend an online seminar or educational event. While a virtual location may be used as the location of an event, virtual locations should not be confused with physical locations in the real world.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVirtualLocation;
export const VirtualLocation = schemaOrgVirtualLocation;

export default schemaOrgVirtualLocation;
