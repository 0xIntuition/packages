export interface SchemaOrgPropertySpec {
	id: string;
	name: string;
	label: string;
	comment: string;
	rangeIncludes: readonly string[];
}

export interface SchemaOrgTypeSpec {
	id: string;
	name: string;
	label: string;
	comment: string;
	subClassOf: readonly string[];
	properties: readonly SchemaOrgPropertySpec[];
}

export interface ResolvedSchemaOrgPropertySpec extends SchemaOrgPropertySpec {
	originType: string;
	originTypeId: string;
}
