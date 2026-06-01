import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVehicle = {
	id: 'schema:Vehicle',
	name: 'Vehicle',
	label: 'Vehicle',
	comment:
		'A vehicle is a device that is designed or used to transport people or cargo over land, water, air, or through space.',
	subClassOf: ['Product', 'Thing'],
	properties: [
		{
			id: 'schema:accelerationTime',
			name: 'accelerationTime',
			label: 'accelerationTime',
			comment:
				'The time needed to accelerate the vehicle from a given start velocity to a given target velocity.\\n\\nTypical unit code(s): SEC for seconds\\n\\n* Note: There are unfortunately no standard unit codes for seconds/0..100 km/h or seconds/0..60 mph. Simply use "SEC" for seconds and indicate the velocities in the [[name]] of the [[QuantitativeValue]], or use [[valueReference]] with a [[QuantitativeValue]] of 0..60 mph or 0..100 km/h to specify the reference speeds.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:bodyType',
			name: 'bodyType',
			label: 'bodyType',
			comment:
				'Indicates the design and body style of the vehicle (e.g. station wagon, hatchback, etc.).',
			rangeIncludes: ['QualitativeValue', 'Text', 'URL'],
		},
		{
			id: 'schema:callSign',
			name: 'callSign',
			label: 'callSign',
			comment:
				'A [callsign](https://en.wikipedia.org/wiki/Call_sign), as used in broadcasting and radio communications to identify people, radio and TV stations, or vehicles.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:cargoVolume',
			name: 'cargoVolume',
			label: 'cargoVolume',
			comment:
				'The available volume for cargo or luggage. For automobiles, this is usually the trunk volume.\\n\\nTypical unit code(s): LTR for liters, FTQ for cubic foot/feet\\n\\nNote: You can use [[minValue]] and [[maxValue]] to indicate ranges.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:dateVehicleFirstRegistered',
			name: 'dateVehicleFirstRegistered',
			label: 'dateVehicleFirstRegistered',
			comment:
				'The date of the first registration of the vehicle with the respective public authorities.',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:driveWheelConfiguration',
			name: 'driveWheelConfiguration',
			label: 'driveWheelConfiguration',
			comment:
				"The drive wheel configuration, i.e. which roadwheels will receive torque from the vehicle's engine via the drivetrain.",
			rangeIncludes: ['DriveWheelConfigurationValue', 'Text'],
		},
		{
			id: 'schema:emissionsCO2',
			name: 'emissionsCO2',
			label: 'emissionsCO2',
			comment:
				'The CO2 emissions in g/km. When used in combination with a QuantitativeValue, put "g/km" into the unitText property of that value, since there is no UN/CEFACT Common Code for "g/km".',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:fuelCapacity',
			name: 'fuelCapacity',
			label: 'fuelCapacity',
			comment:
				'The capacity of the fuel tank or in the case of electric cars, the battery. If there are multiple components for storage, this should indicate the total of all storage of the same type.\\n\\nTypical unit code(s): LTR for liters, GLL of US gallons, GLI for UK / imperial gallons, AMH for ampere-hours (for electrical vehicles).',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:fuelConsumption',
			name: 'fuelConsumption',
			label: 'fuelConsumption',
			comment:
				'The amount of fuel consumed for traveling a particular distance or temporal duration with the given vehicle (e.g. liters per 100 km).\\n\\n* Note 1: There are unfortunately no standard unit codes for liters per 100 km.  Use [[unitText]] to indicate the unit of measurement, e.g. L/100 km.\\n* Note 2: There are two ways of indicating the fuel consumption, [[fuelConsumption]] (e.g. 8 liters per 100 km) and [[fuelEfficiency]] (e.g. 30 miles per gallon). They are reciprocal.\\n* Note 3: Often, the absolute value is useful only when related to driving speed ("at 80 km/h") or usage pattern ("city traffic"). You can use [[valueReference]] to link the value for the fuel consumption to another value.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:fuelEfficiency',
			name: 'fuelEfficiency',
			label: 'fuelEfficiency',
			comment:
				'The distance traveled per unit of fuel used; most commonly miles per gallon (mpg) or kilometers per liter (km/L).\\n\\n* Note 1: There are unfortunately no standard unit codes for miles per gallon or kilometers per liter. Use [[unitText]] to indicate the unit of measurement, e.g. mpg or km/L.\\n* Note 2: There are two ways of indicating the fuel consumption, [[fuelConsumption]] (e.g. 8 liters per 100 km) and [[fuelEfficiency]] (e.g. 30 miles per gallon). They are reciprocal.\\n* Note 3: Often, the absolute value is useful only when related to driving speed ("at 80 km/h") or usage pattern ("city traffic"). You can use [[valueReference]] to link the value for the fuel economy to another value.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:fuelType',
			name: 'fuelType',
			label: 'fuelType',
			comment:
				'The type of fuel suitable for the engine or engines of the vehicle. If the vehicle has only one engine, this property can be attached directly to the vehicle.',
			rangeIncludes: ['QualitativeValue', 'Text', 'URL'],
		},
		{
			id: 'schema:knownVehicleDamages',
			name: 'knownVehicleDamages',
			label: 'knownVehicleDamages',
			comment: 'A textual description of known damages, both repaired and unrepaired.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:meetsEmissionStandard',
			name: 'meetsEmissionStandard',
			label: 'meetsEmissionStandard',
			comment: 'Indicates that the vehicle meets the respective emission standard.',
			rangeIncludes: ['QualitativeValue', 'Text', 'URL'],
		},
		{
			id: 'schema:mileageFromOdometer',
			name: 'mileageFromOdometer',
			label: 'mileageFromOdometer',
			comment:
				'The total distance travelled by the particular vehicle since its initial production, as read from its odometer.\\n\\nTypical unit code(s): KMT for kilometers, SMI for statute miles.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:modelDate',
			name: 'modelDate',
			label: 'modelDate',
			comment:
				'The release date of a vehicle model (often used to differentiate versions of the same make and model).',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:numberOfAirbags',
			name: 'numberOfAirbags',
			label: 'numberOfAirbags',
			comment: 'The number or type of airbags in the vehicle.',
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:numberOfAxles',
			name: 'numberOfAxles',
			label: 'numberOfAxles',
			comment: 'The number of axles.\\n\\nTypical unit code(s): C62.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:numberOfDoors',
			name: 'numberOfDoors',
			label: 'numberOfDoors',
			comment: 'The number of doors.\\n\\nTypical unit code(s): C62.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:numberOfForwardGears',
			name: 'numberOfForwardGears',
			label: 'numberOfForwardGears',
			comment:
				'The total number of forward gears available for the transmission system of the vehicle.\\n\\nTypical unit code(s): C62.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:numberOfPreviousOwners',
			name: 'numberOfPreviousOwners',
			label: 'numberOfPreviousOwners',
			comment:
				'The number of owners of the vehicle, including the current one.\\n\\nTypical unit code(s): C62.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:payload',
			name: 'payload',
			label: 'payload',
			comment:
				'The permitted weight of passengers and cargo, EXCLUDING the weight of the empty vehicle.\\n\\nTypical unit code(s): KGM for kilogram, LBR for pound\\n\\n* Note 1: Many databases specify the permitted TOTAL weight instead, which is the sum of [[weight]] and [[payload]]\\n* Note 2: You can indicate additional information in the [[name]] of the [[QuantitativeValue]] node.\\n* Note 3: You may also link to a [[QualitativeValue]] node that provides additional information using [[valueReference]].\\n* Note 4: Note that you can use [[minValue]] and [[maxValue]] to indicate ranges.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:productionDate',
			name: 'productionDate',
			label: 'productionDate',
			comment: 'The date of production of the item, e.g. vehicle.',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:purchaseDate',
			name: 'purchaseDate',
			label: 'purchaseDate',
			comment: 'The date the item, e.g. vehicle, was purchased by the current owner.',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:seatingCapacity',
			name: 'seatingCapacity',
			label: 'seatingCapacity',
			comment:
				'The number of persons that can be seated (e.g. in a vehicle), both in terms of the physical space available, and in terms of limitations set by law.\\n\\nTypical unit code(s): C62 for persons.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:speed',
			name: 'speed',
			label: 'speed',
			comment:
				'The speed range of the vehicle. If the vehicle is powered by an engine, the upper limit of the speed range (indicated by [[maxValue]]) should be the maximum speed achievable under regular conditions.\\n\\nTypical unit code(s): KMH for km/h, HM for mile per hour (0.447 04 m/s), KNT for knot\\n\\n*Note 1: Use [[minValue]] and [[maxValue]] to indicate the range. Typically, the minimal value is zero.\\n* Note 2: There are many different ways of measuring the speed range. You can link to information about how the given value has been determined using the [[valueReference]] property.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:steeringPosition',
			name: 'steeringPosition',
			label: 'steeringPosition',
			comment: 'The position of the steering wheel or similar device (mostly for cars).',
			rangeIncludes: ['SteeringPositionValue'],
		},
		{
			id: 'schema:tongueWeight',
			name: 'tongueWeight',
			label: 'tongueWeight',
			comment:
				'The permitted vertical load (TWR) of a trailer attached to the vehicle. Also referred to as Tongue Load Rating (TLR) or Vertical Load Rating (VLR).\\n\\nTypical unit code(s): KGM for kilogram, LBR for pound\\n\\n* Note 1: You can indicate additional information in the [[name]] of the [[QuantitativeValue]] node.\\n* Note 2: You may also link to a [[QualitativeValue]] node that provides additional information using [[valueReference]].\\n* Note 3: Note that you can use [[minValue]] and [[maxValue]] to indicate ranges.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:trailerWeight',
			name: 'trailerWeight',
			label: 'trailerWeight',
			comment:
				'The permitted weight of a trailer attached to the vehicle.\\n\\nTypical unit code(s): KGM for kilogram, LBR for pound\\n* Note 1: You can indicate additional information in the [[name]] of the [[QuantitativeValue]] node.\\n* Note 2: You may also link to a [[QualitativeValue]] node that provides additional information using [[valueReference]].\\n* Note 3: Note that you can use [[minValue]] and [[maxValue]] to indicate ranges.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:vehicleConfiguration',
			name: 'vehicleConfiguration',
			label: 'vehicleConfiguration',
			comment:
				"A short text indicating the configuration of the vehicle, e.g. '5dr hatchback ST 2.5 MT 225 hp' or 'limited edition'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:vehicleEngine',
			name: 'vehicleEngine',
			label: 'vehicleEngine',
			comment: 'Information about the engine or engines of the vehicle.',
			rangeIncludes: ['EngineSpecification'],
		},
		{
			id: 'schema:vehicleIdentificationNumber',
			name: 'vehicleIdentificationNumber',
			label: 'vehicleIdentificationNumber',
			comment:
				'The Vehicle Identification Number (VIN) is a unique serial number used by the automotive industry to identify individual motor vehicles.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:vehicleInteriorColor',
			name: 'vehicleInteriorColor',
			label: 'vehicleInteriorColor',
			comment: 'The color or color combination of the interior of the vehicle.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:vehicleInteriorType',
			name: 'vehicleInteriorType',
			label: 'vehicleInteriorType',
			comment:
				'The type or material of the interior of the vehicle (e.g. synthetic fabric, leather, wood, etc.). While most interior types are characterized by the material used, an interior type can also be based on vehicle usage or target audience.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:vehicleModelDate',
			name: 'vehicleModelDate',
			label: 'vehicleModelDate',
			comment:
				'The release date of a vehicle model (often used to differentiate versions of the same make and model).',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:vehicleSeatingCapacity',
			name: 'vehicleSeatingCapacity',
			label: 'vehicleSeatingCapacity',
			comment:
				'The number of passengers that can be seated in the vehicle, both in terms of the physical space available, and in terms of limitations set by law.\\n\\nTypical unit code(s): C62 for persons.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:vehicleSpecialUsage',
			name: 'vehicleSpecialUsage',
			label: 'vehicleSpecialUsage',
			comment:
				'Indicates whether the vehicle has been used for special purposes, like commercial rental, driving school, or as a taxi. The legislation in many countries requires this information to be revealed when offering a car for sale.',
			rangeIncludes: ['CarUsageType', 'Text'],
		},
		{
			id: 'schema:vehicleTransmission',
			name: 'vehicleTransmission',
			label: 'vehicleTransmission',
			comment:
				'The type of component used for transmitting the power from a rotating power source to the wheels or other relevant component(s) ("gearbox" for cars).',
			rangeIncludes: ['QualitativeValue', 'Text', 'URL'],
		},
		{
			id: 'schema:weightTotal',
			name: 'weightTotal',
			label: 'weightTotal',
			comment:
				'The permitted total weight of the loaded vehicle, including passengers and cargo and the weight of the empty vehicle.\\n\\nTypical unit code(s): KGM for kilogram, LBR for pound\\n\\n* Note 1: You can indicate additional information in the [[name]] of the [[QuantitativeValue]] node.\\n* Note 2: You may also link to a [[QualitativeValue]] node that provides additional information using [[valueReference]].\\n* Note 3: Note that you can use [[minValue]] and [[maxValue]] to indicate ranges.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:wheelbase',
			name: 'wheelbase',
			label: 'wheelbase',
			comment:
				'The distance between the centers of the front and rear wheels.\\n\\nTypical unit code(s): CMT for centimeters, MTR for meters, INH for inches, FOT for foot/feet.',
			rangeIncludes: ['QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVehicle;
export const Vehicle = schemaOrgVehicle;

export default schemaOrgVehicle;
