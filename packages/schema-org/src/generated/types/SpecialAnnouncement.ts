import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSpecialAnnouncement = {
	id: 'schema:SpecialAnnouncement',
	name: 'SpecialAnnouncement',
	label: 'SpecialAnnouncement',
	comment:
		'A SpecialAnnouncement combines a simple date-stamped textual information update\n      with contextualized Web links and other structured data.  It represents an information update made by a\n      locally-oriented organization, for example schools, pharmacies, healthcare providers,  community groups, police,\n      local government.\n\nFor work in progress guidelines on Coronavirus-related markup see [this doc](https://docs.google.com/document/d/14ikaGCKxo50rRM7nvKSlbUpjyIk2WMQd3IkB1lItlrM/edit#).\n\nThe motivating scenario for SpecialAnnouncement is the [Coronavirus pandemic](https://en.wikipedia.org/wiki/2019%E2%80%9320_coronavirus_pandemic), and the initial vocabulary is oriented to this urgent situation. Schema.org\nexpect to improve the markup iteratively as it is deployed and as feedback emerges from use. In addition to our\nusual [Github entry](https://github.com/schemaorg/schemaorg/issues/2490), feedback comments can also be provided in [this document](https://docs.google.com/document/d/1fpdFFxk8s87CWwACs53SGkYv3aafSxz_DTtOQxMrBJQ/edit#).\n\n\nWhile this schema is designed to communicate urgent crisis-related information, it is not the same as an emergency warning technology like [CAP](https://en.wikipedia.org/wiki/Common_Alerting_Protocol), although there may be overlaps. The intent is to cover\nthe kinds of everyday practical information being posted to existing websites during an emergency situation.\n\nSeveral kinds of information can be provided:\n\nWe encourage the provision of "name", "text", "datePosted", "expires" (if appropriate), "category" and\n"url" as a simple baseline. It is important to provide a value for "category" where possible, most ideally as a well known\nURL from Wikipedia or Wikidata. In the case of the 2019-2020 Coronavirus pandemic, this should be "https://en.wikipedia.org/w/index.php?title=2019-20\\_coronavirus\\_pandemic" or "https://www.wikidata.org/wiki/Q81068910".\n\nFor many of the possible properties, values can either be simple links or an inline description, depending on whether a summary is available. For a link, provide just the URL of the appropriate page as the property\'s value. For an inline description, use a [[WebContent]] type, and provide the url as a property of that, alongside at least a simple "[[text]]" summary of the page. It is\nunlikely that a single SpecialAnnouncement will need all of the possible properties simultaneously.\n\nWe expect that in many cases the page referenced might contain more specialized structured data, e.g. contact info, [[openingHours]], [[Event]], [[FAQPage]] etc. By linking to those pages from a [[SpecialAnnouncement]] you can help make it clearer that the events are related to the situation (e.g. Coronavirus) indicated by the [[category]] property of the [[SpecialAnnouncement]].\n\nMany [[SpecialAnnouncement]]s will relate to particular regions and to identifiable local organizations. Use [[spatialCoverage]] for the region, and [[announcementLocation]] to indicate specific [[LocalBusiness]]es and [[CivicStructure]]s. If the announcement affects both a particular region and a specific location (for example, a library closure that serves an entire region), use both [[spatialCoverage]] and [[announcementLocation]].\n\nThe [[about]] property can be used to indicate entities that are the focus of the announcement. We now recommend using [[about]] only\nfor representing non-location entities (e.g. a [[Course]] or a [[RadioStation]]). For places, use [[announcementLocation]] and [[spatialCoverage]]. Consumers of this markup should be aware that the initial design encouraged the use of [[about]] for locations too.\n\nThe basic content of [[SpecialAnnouncement]] is similar to that of an [RSS](https://en.wikipedia.org/wiki/RSS) or [Atom](https://en.wikipedia.org/wiki/Atom_(Web_standard)) feed. For publishers without such feeds, basic feed-like information can be shared by posting\n[[SpecialAnnouncement]] updates in a page, e.g. using JSON-LD. For sites with Atom/RSS functionality, you can point to a feed\nwith the [[webFeed]] property. This can be a simple URL, or an inline [[DataFeed]] object, with [[encodingFormat]] providing\nmedia type information, e.g. "application/rss+xml" or "application/atom+xml".\n',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:announcementLocation',
			name: 'announcementLocation',
			label: 'announcementLocation',
			comment:
				'Indicates a specific [[CivicStructure]] or [[LocalBusiness]] associated with the SpecialAnnouncement. For example, a specific testing facility or business with special opening hours. For a larger geographic region like a quarantine of an entire region, use [[spatialCoverage]].',
			rangeIncludes: ['CivicStructure', 'LocalBusiness'],
		},
		{
			id: 'schema:category',
			name: 'category',
			label: 'category',
			comment:
				'A category for the item. Greater signs or slashes can be used to informally indicate a category hierarchy.',
			rangeIncludes: ['CategoryCode', 'PhysicalActivityCategory', 'Text', 'Thing', 'URL'],
		},
		{
			id: 'schema:datePosted',
			name: 'datePosted',
			label: 'datePosted',
			comment: 'Publication date of an online listing.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:diseasePreventionInfo',
			name: 'diseasePreventionInfo',
			label: 'diseasePreventionInfo',
			comment: 'Information about disease prevention.',
			rangeIncludes: ['URL', 'WebContent'],
		},
		{
			id: 'schema:diseaseSpreadStatistics',
			name: 'diseaseSpreadStatistics',
			label: 'diseaseSpreadStatistics',
			comment:
				'Statistical information about the spread of a disease, either as [[WebContent]], or\n  described directly as a [[Dataset]], or the specific [[Observation]]s in the dataset. When a [[WebContent]] URL is\n  provided, the page indicated might also contain more such markup.',
			rangeIncludes: ['Dataset', 'Observation', 'URL', 'WebContent'],
		},
		{
			id: 'schema:gettingTestedInfo',
			name: 'gettingTestedInfo',
			label: 'gettingTestedInfo',
			comment:
				'Information about getting tested (for a [[MedicalCondition]]), e.g. in the context of a pandemic.',
			rangeIncludes: ['URL', 'WebContent'],
		},
		{
			id: 'schema:governmentBenefitsInfo',
			name: 'governmentBenefitsInfo',
			label: 'governmentBenefitsInfo',
			comment:
				'governmentBenefitsInfo provides information about government benefits associated with a SpecialAnnouncement.',
			rangeIncludes: ['GovernmentService'],
		},
		{
			id: 'schema:newsUpdatesAndGuidelines',
			name: 'newsUpdatesAndGuidelines',
			label: 'newsUpdatesAndGuidelines',
			comment:
				'Indicates a page with news updates and guidelines. This could often be (but is not required to be) the main page containing [[SpecialAnnouncement]] markup on a site.',
			rangeIncludes: ['URL', 'WebContent'],
		},
		{
			id: 'schema:publicTransportClosuresInfo',
			name: 'publicTransportClosuresInfo',
			label: 'publicTransportClosuresInfo',
			comment: 'Information about public transport closures.',
			rangeIncludes: ['URL', 'WebContent'],
		},
		{
			id: 'schema:quarantineGuidelines',
			name: 'quarantineGuidelines',
			label: 'quarantineGuidelines',
			comment: 'Guidelines about quarantine rules, e.g. in the context of a pandemic.',
			rangeIncludes: ['URL', 'WebContent'],
		},
		{
			id: 'schema:schoolClosuresInfo',
			name: 'schoolClosuresInfo',
			label: 'schoolClosuresInfo',
			comment: 'Information about school closures.',
			rangeIncludes: ['URL', 'WebContent'],
		},
		{
			id: 'schema:travelBans',
			name: 'travelBans',
			label: 'travelBans',
			comment: 'Information about travel bans, e.g. in the context of a pandemic.',
			rangeIncludes: ['URL', 'WebContent'],
		},
		{
			id: 'schema:webFeed',
			name: 'webFeed',
			label: 'webFeed',
			comment:
				'The URL for a feed, e.g. associated with a podcast series, blog, or series of date-stamped updates. This is usually RSS or Atom.',
			rangeIncludes: ['DataFeed', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSpecialAnnouncement;
export const SpecialAnnouncement = schemaOrgSpecialAnnouncement;

export default schemaOrgSpecialAnnouncement;
