import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgExhibitionEvent = {
	id: 'schema:ExhibitionEvent',
	name: 'ExhibitionEvent',
	label: 'ExhibitionEvent',
	comment: 'Event type: Exhibition event, e.g. at a museum, library, archive, tradeshow, ...',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgExhibitionEvent;
export const ExhibitionEvent = schemaOrgExhibitionEvent;

export default schemaOrgExhibitionEvent;
