export type FieldType =
	| 'string'
	| 'url'
	| 'number'
	| 'integer'
	| 'address'
	| 'string[]'
	| 'iso-date'
	| 'iso-datetime';

export interface ClassificationFieldSpec {
	key: string;
	label: string;
	description: string;
	fieldType: FieldType;
	required: boolean;
	placeholder?: string;
	schemaOrgProperty?: string;
}

export type ClassificationCategory =
	| 'Entity'
	| 'Creative Work'
	| 'Media'
	| 'Product'
	| 'Web'
	| 'Blockchain'
	| 'Other';

export interface ClassificationSpec {
	slug: string;
	type: string;
	displayName: string;
	description: string;
	category: ClassificationCategory;
	schemaOrg: {
		context: string;
		type: string;
	} | null;
	fields: readonly ClassificationFieldSpec[];
	defaults: {
		pluginId: string;
		provider?: string;
	};
}

export type ClassificationValueMap = Record<string, unknown>;

export interface ClassificationValidationIssue {
	field?: string;
	message: string;
}
