import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDownloadAction = {
	id: 'schema:DownloadAction',
	name: 'DownloadAction',
	label: 'DownloadAction',
	comment: 'The act of downloading an object.',
	subClassOf: ['TransferAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDownloadAction;
export const DownloadAction = schemaOrgDownloadAction;

export default schemaOrgDownloadAction;
