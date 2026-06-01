import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAMRadioChannel = {
	id: 'schema:AMRadioChannel',
	name: 'AMRadioChannel',
	label: 'AMRadioChannel',
	comment: 'A radio channel that uses AM.',
	subClassOf: ['RadioChannel', 'BroadcastChannel', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAMRadioChannel;
export const AMRadioChannel = schemaOrgAMRadioChannel;

export default schemaOrgAMRadioChannel;
