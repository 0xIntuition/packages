import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFMRadioChannel = {
	id: 'schema:FMRadioChannel',
	name: 'FMRadioChannel',
	label: 'FMRadioChannel',
	comment: 'A radio channel that uses FM.',
	subClassOf: ['RadioChannel', 'BroadcastChannel', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFMRadioChannel;
export const FMRadioChannel = schemaOrgFMRadioChannel;

export default schemaOrgFMRadioChannel;
