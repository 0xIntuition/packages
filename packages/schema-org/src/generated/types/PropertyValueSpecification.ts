import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPropertyValueSpecification = {
	id: 'schema:PropertyValueSpecification',
	name: 'PropertyValueSpecification',
	label: 'PropertyValueSpecification',
	comment: 'A Property value specification.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:defaultValue',
			name: 'defaultValue',
			label: 'defaultValue',
			comment:
				"The default value of the input.  For properties that expect a literal, the default is a literal value, for properties that expect an object, it's an ID reference to one of the current values.",
			rangeIncludes: ['Text', 'Thing'],
		},
		{
			id: 'schema:maxValue',
			name: 'maxValue',
			label: 'maxValue',
			comment: 'The upper value of some characteristic or property.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:minValue',
			name: 'minValue',
			label: 'minValue',
			comment: 'The lower value of some characteristic or property.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:multipleValues',
			name: 'multipleValues',
			label: 'multipleValues',
			comment: 'Whether multiple values are allowed for the property.  Default is false.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:readonlyValue',
			name: 'readonlyValue',
			label: 'readonlyValue',
			comment:
				'Whether or not a property is mutable.  Default is false. Specifying this for a property that also has a value makes it act similar to a "hidden" input in an HTML form.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:stepValue',
			name: 'stepValue',
			label: 'stepValue',
			comment:
				'The stepValue attribute indicates the granularity that is expected (and required) of the value in a PropertyValueSpecification.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:valueMaxLength',
			name: 'valueMaxLength',
			label: 'valueMaxLength',
			comment: 'Specifies the allowed range for number of characters in a literal value.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:valueMinLength',
			name: 'valueMinLength',
			label: 'valueMinLength',
			comment: 'Specifies the minimum allowed range for number of characters in a literal value.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:valueName',
			name: 'valueName',
			label: 'valueName',
			comment:
				"Indicates the name of the PropertyValueSpecification to be used in URL templates and form encoding in a manner analogous to HTML's input@name.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:valuePattern',
			name: 'valuePattern',
			label: 'valuePattern',
			comment:
				'Specifies a regular expression for testing literal values according to the HTML spec.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:valueRequired',
			name: 'valueRequired',
			label: 'valueRequired',
			comment: 'Whether the property must be filled in to complete the action.  Default is false.',
			rangeIncludes: ['Boolean'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPropertyValueSpecification;
export const PropertyValueSpecification = schemaOrgPropertyValueSpecification;

export default schemaOrgPropertyValueSpecification;
