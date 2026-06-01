import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDriveWheelConfigurationValue = {
	id: 'schema:DriveWheelConfigurationValue',
	name: 'DriveWheelConfigurationValue',
	label: 'DriveWheelConfigurationValue',
	comment: 'A value indicating which roadwheels will receive torque.',
	subClassOf: ['QualitativeValue', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDriveWheelConfigurationValue;
export const DriveWheelConfigurationValue = schemaOrgDriveWheelConfigurationValue;

export default schemaOrgDriveWheelConfigurationValue;
