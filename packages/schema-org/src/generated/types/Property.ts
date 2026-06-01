import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgProperty = {
	id: 'schema:Property',
	name: 'Property',
	label: 'Property',
	comment:
		'A property, used to indicate attributes and relationships of some Thing; equivalent to rdf:Property.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:domainIncludes',
			name: 'domainIncludes',
			label: 'domainIncludes',
			comment:
				'Relates a property to a class that is (one of) the type(s) the property is expected to be used on.',
			rangeIncludes: ['Class'],
		},
		{
			id: 'schema:inverseOf',
			name: 'inverseOf',
			label: 'inverseOf',
			comment:
				"Relates a property to a property that is its inverse. Inverse properties relate the same pairs of items to each other, but in reversed direction. For example, the 'alumni' and 'alumniOf' properties are inverseOf each other. Some properties don't have explicit inverses; in these situations RDFa and JSON-LD syntax for reverse properties can be used.",
			rangeIncludes: ['Property'],
		},
		{
			id: 'schema:rangeIncludes',
			name: 'rangeIncludes',
			label: 'rangeIncludes',
			comment:
				'Relates a property to a class that constitutes (one of) the expected type(s) for values of the property.',
			rangeIncludes: ['Class'],
		},
		{
			id: 'schema:supersededBy',
			name: 'supersededBy',
			label: 'supersededBy',
			comment: 'Relates a term (i.e. a property, class or enumeration) to one that supersedes it.',
			rangeIncludes: ['Class', 'Enumeration', 'Property'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgProperty;
export const Property = schemaOrgProperty;

export default schemaOrgProperty;
