import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSpreadsheetDigitalDocument = {
	id: 'schema:SpreadsheetDigitalDocument',
	name: 'SpreadsheetDigitalDocument',
	label: 'SpreadsheetDigitalDocument',
	comment: 'A spreadsheet file.',
	subClassOf: ['DigitalDocument', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSpreadsheetDigitalDocument;
export const SpreadsheetDigitalDocument = schemaOrgSpreadsheetDigitalDocument;

export default schemaOrgSpreadsheetDigitalDocument;
