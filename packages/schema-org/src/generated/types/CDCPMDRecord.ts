import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCDCPMDRecord = {
	id: 'schema:CDCPMDRecord',
	name: 'CDCPMDRecord',
	label: 'CDCPMDRecord',
	comment:
		'A CDCPMDRecord is a data structure representing a record in a CDC tabular data format\n      used for hospital data reporting. See [documentation](/docs/cdc-covid.html) for details, and the linked CDC materials for authoritative\n      definitions used as the source here.\n      ',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:cvdCollectionDate',
			name: 'cvdCollectionDate',
			label: 'cvdCollectionDate',
			comment: 'collectiondate - Date for which patient counts are reported.',
			rangeIncludes: ['DateTime', 'Text'],
		},
		{
			id: 'schema:cvdFacilityCounty',
			name: 'cvdFacilityCounty',
			label: 'cvdFacilityCounty',
			comment:
				'Name of the County of the NHSN facility that this data record applies to. Use [[cvdFacilityId]] to identify the facility. To provide other details, [[healthcareReportingData]] can be used on a [[Hospital]] entry.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:cvdFacilityId',
			name: 'cvdFacilityId',
			label: 'cvdFacilityId',
			comment:
				'Identifier of the NHSN facility that this data record applies to. Use [[cvdFacilityCounty]] to indicate the county. To provide other details, [[healthcareReportingData]] can be used on a [[Hospital]] entry.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:cvdNumBeds',
			name: 'cvdNumBeds',
			label: 'cvdNumBeds',
			comment:
				'numbeds - HOSPITAL INPATIENT BEDS: Inpatient beds, including all staffed, licensed, and overflow (surge) beds used for inpatients.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumBedsOcc',
			name: 'cvdNumBedsOcc',
			label: 'cvdNumBedsOcc',
			comment:
				'numbedsocc - HOSPITAL INPATIENT BED OCCUPANCY: Total number of staffed inpatient beds that are occupied.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumC19Died',
			name: 'cvdNumC19Died',
			label: 'cvdNumC19Died',
			comment:
				'numc19died - DEATHS: Patients with suspected or confirmed COVID-19 who died in the hospital, ED, or any overflow location.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumC19HOPats',
			name: 'cvdNumC19HOPats',
			label: 'cvdNumC19HOPats',
			comment:
				'numc19hopats - HOSPITAL ONSET: Patients hospitalized in an NHSN inpatient care location with onset of suspected or confirmed COVID-19 14 or more days after hospitalization.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumC19HospPats',
			name: 'cvdNumC19HospPats',
			label: 'cvdNumC19HospPats',
			comment:
				'numc19hosppats - HOSPITALIZED: Patients currently hospitalized in an inpatient care location who have suspected or confirmed COVID-19.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumC19MechVentPats',
			name: 'cvdNumC19MechVentPats',
			label: 'cvdNumC19MechVentPats',
			comment:
				'numc19mechventpats - HOSPITALIZED and VENTILATED: Patients hospitalized in an NHSN inpatient care location who have suspected or confirmed COVID-19 and are on a mechanical ventilator.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumC19OFMechVentPats',
			name: 'cvdNumC19OFMechVentPats',
			label: 'cvdNumC19OFMechVentPats',
			comment:
				'numc19ofmechventpats - ED/OVERFLOW and VENTILATED: Patients with suspected or confirmed COVID-19 who are in the ED or any overflow location awaiting an inpatient bed and on a mechanical ventilator.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumC19OverflowPats',
			name: 'cvdNumC19OverflowPats',
			label: 'cvdNumC19OverflowPats',
			comment:
				'numc19overflowpats - ED/OVERFLOW: Patients with suspected or confirmed COVID-19 who are in the ED or any overflow location awaiting an inpatient bed.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumICUBeds',
			name: 'cvdNumICUBeds',
			label: 'cvdNumICUBeds',
			comment:
				'numicubeds - ICU BEDS: Total number of staffed inpatient intensive care unit (ICU) beds.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumICUBedsOcc',
			name: 'cvdNumICUBedsOcc',
			label: 'cvdNumICUBedsOcc',
			comment:
				'numicubedsocc - ICU BED OCCUPANCY: Total number of staffed inpatient ICU beds that are occupied.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumTotBeds',
			name: 'cvdNumTotBeds',
			label: 'cvdNumTotBeds',
			comment:
				'numtotbeds - ALL HOSPITAL BEDS: Total number of all inpatient and outpatient beds, including all staffed, ICU, licensed, and overflow (surge) beds used for inpatients or outpatients.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumVent',
			name: 'cvdNumVent',
			label: 'cvdNumVent',
			comment: 'numvent - MECHANICAL VENTILATORS: Total number of ventilators available.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:cvdNumVentUse',
			name: 'cvdNumVentUse',
			label: 'cvdNumVentUse',
			comment: 'numventuse - MECHANICAL VENTILATORS IN USE: Total number of ventilators in use.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:datePosted',
			name: 'datePosted',
			label: 'datePosted',
			comment: 'Publication date of an online listing.',
			rangeIncludes: ['Date', 'DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCDCPMDRecord;
export const CDCPMDRecord = schemaOrgCDCPMDRecord;

export default schemaOrgCDCPMDRecord;
