import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVacationRental = {
	id: 'schema:VacationRental',
	name: 'VacationRental',
	label: 'VacationRental',
	comment: 'A kind of lodging business that focuses on renting single properties for limited time.',
	subClassOf: ['LodgingBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVacationRental;
export const VacationRental = schemaOrgVacationRental;

export default schemaOrgVacationRental;
