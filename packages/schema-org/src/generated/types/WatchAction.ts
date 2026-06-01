import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWatchAction = {
	id: 'schema:WatchAction',
	name: 'WatchAction',
	label: 'WatchAction',
	comment: 'The act of consuming dynamic/moving visual content.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWatchAction;
export const WatchAction = schemaOrgWatchAction;

export default schemaOrgWatchAction;
