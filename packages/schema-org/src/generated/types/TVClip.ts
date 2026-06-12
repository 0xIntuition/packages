import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTVClip = {
	id: 'schema:TVClip',
	name: 'TVClip',
	label: 'TVClip',
	comment: 'A short TV program or a segment/part of a TV program.',
	subClassOf: ['Clip', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:partOfTVSeries',
			name: 'partOfTVSeries',
			label: 'partOfTVSeries',
			comment: 'The TV series to which this episode or season belongs.',
			rangeIncludes: ['TVSeries'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTVClip;
export const TVClip = schemaOrgTVClip;

export default schemaOrgTVClip;
