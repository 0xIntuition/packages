import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLegislationObject = {
	id: 'schema:LegislationObject',
	name: 'LegislationObject',
	label: 'LegislationObject',
	comment:
		'A specific object or file containing a Legislation. Note that the same Legislation can be published in multiple files. For example, a digitally signed PDF, a plain PDF and an HTML version.',
	subClassOf: ['Legislation', 'CreativeWork', 'Thing', 'MediaObject'],
	properties: [
		{
			id: 'schema:legislationLegalValue',
			name: 'legislationLegalValue',
			label: 'legislationLegalValue',
			comment:
				'The legal value of this legislation file. The same legislation can be written in multiple files with different legal values. Typically a digitally signed PDF have a "stronger" legal value than the HTML file of the same act.',
			rangeIncludes: ['LegalValueLevel'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLegislationObject;
export const LegislationObject = schemaOrgLegislationObject;

export default schemaOrgLegislationObject;
