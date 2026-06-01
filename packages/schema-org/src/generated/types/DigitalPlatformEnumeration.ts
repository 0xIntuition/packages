import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDigitalPlatformEnumeration = {
	id: 'schema:DigitalPlatformEnumeration',
	name: 'DigitalPlatformEnumeration',
	label: 'DigitalPlatformEnumeration',
	comment:
		'Enumerates some common technology platforms, for use with properties such as [[actionPlatform]]. It is not supposed to be comprehensive - when a suitable code is not enumerated here, textual or URL values can be used instead. These codes are at a fairly high level and do not deal with versioning and other nuance. Additional codes can be suggested [in github](https://github.com/schemaorg/schemaorg/issues/3057). ',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDigitalPlatformEnumeration;
export const DigitalPlatformEnumeration = schemaOrgDigitalPlatformEnumeration;

export default schemaOrgDigitalPlatformEnumeration;
