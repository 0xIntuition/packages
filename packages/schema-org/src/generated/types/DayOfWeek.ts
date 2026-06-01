import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDayOfWeek = {
	id: 'schema:DayOfWeek',
	name: 'DayOfWeek',
	label: 'DayOfWeek',
	comment:
		'The day of the week, e.g. used to specify to which day the opening hours of an OpeningHoursSpecification refer.\n\nOriginally, URLs from [GoodRelations](http://purl.org/goodrelations/v1) were used (for [[Monday]], [[Tuesday]], [[Wednesday]], [[Thursday]], [[Friday]], [[Saturday]], [[Sunday]] plus a special entry for [[PublicHolidays]]); these have now been integrated directly into schema.org.\n      ',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDayOfWeek;
export const DayOfWeek = schemaOrgDayOfWeek;

export default schemaOrgDayOfWeek;
