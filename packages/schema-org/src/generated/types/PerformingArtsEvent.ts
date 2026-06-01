import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPerformingArtsEvent = {
	id: 'schema:PerformingArtsEvent',
	name: 'PerformingArtsEvent',
	label: 'PerformingArtsEvent',
	comment:
		'Live performance <a class="localLink" href="http://schema.org/Event">Event of the performing arts (music, theatre, dance, acrobatics, spoken word), including performance art and performative sports (e.g. choreographed forms of martial arts, figure skating, competitive ballroom dancing).<br/><br/>Note: Use <a class="localLink" href="http://schema.org/additionalType">additionalType</a> to differentiate between productions / shows (PerformanceWork, EventSeries), tours (EventSeries), and individual performances.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPerformingArtsEvent;
export const PerformingArtsEvent = schemaOrgPerformingArtsEvent;

export default schemaOrgPerformingArtsEvent;
