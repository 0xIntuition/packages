import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgProfessionalService = {
	id: 'schema:ProfessionalService',
	name: 'ProfessionalService',
	label: 'ProfessionalService',
	comment:
		'Original definition: "provider of professional services."\\n\\nThe general [[ProfessionalService]] type for local businesses was deprecated due to confusion with [[Service]]. For reference, the types that it included were: [[Dentist]],\n        [[AccountingService]], [[Attorney]], [[Notary]], as well as types for several kinds of [[HomeAndConstructionBusiness]]: [[Electrician]], [[GeneralContractor]],\n        [[HousePainter]], [[Locksmith]], [[Plumber]], [[RoofingContractor]]. [[LegalService]] was introduced as a more inclusive supertype of [[Attorney]].',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgProfessionalService;
export const ProfessionalService = schemaOrgProfessionalService;

export default schemaOrgProfessionalService;
