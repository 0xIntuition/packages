import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOrganization = {
	id: 'schema:Organization',
	name: 'Organization',
	label: 'Organization',
	comment: 'An organization such as a school, NGO, corporation, club, etc.',
	subClassOf: ['Thing'],
	properties: [
		{
			id: 'schema:acceptedPaymentMethod',
			name: 'acceptedPaymentMethod',
			label: 'acceptedPaymentMethod',
			comment:
				'The payment method(s) that are accepted in general by an organization, or for some specific demand or offer.',
			rangeIncludes: ['LoanOrCredit', 'PaymentMethod', 'Text'],
		},
		{
			id: 'schema:actionableFeedbackPolicy',
			name: 'actionableFeedbackPolicy',
			label: 'actionableFeedbackPolicy',
			comment:
				'For a [[NewsMediaOrganization]] or other news-related [[Organization]], a statement about public engagement activities (for news media, the newsroom’s), including involving the public - digitally or otherwise -- in coverage decisions, reporting and activities after publication.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:address',
			name: 'address',
			label: 'address',
			comment: 'Physical address of the item.',
			rangeIncludes: ['PostalAddress', 'Text'],
		},
		{
			id: 'schema:agentInteractionStatistic',
			name: 'agentInteractionStatistic',
			label: 'agentInteractionStatistic',
			comment:
				"The number of completed interactions for this entity, in a particular role (the 'agent'), in a particular action (indicated in the statistic), and in a particular context (i.e. interactionService).",
			rangeIncludes: ['InteractionCounter'],
		},
		{
			id: 'schema:aggregateRating',
			name: 'aggregateRating',
			label: 'aggregateRating',
			comment: 'The overall rating, based on a collection of reviews or ratings, of the item.',
			rangeIncludes: ['AggregateRating'],
		},
		{
			id: 'schema:alumni',
			name: 'alumni',
			label: 'alumni',
			comment: 'Alumni of an organization.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:areaServed',
			name: 'areaServed',
			label: 'areaServed',
			comment: 'The geographic area where a service or offered item is provided.',
			rangeIncludes: ['AdministrativeArea', 'GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:award',
			name: 'award',
			label: 'award',
			comment: 'An award won by or for this item.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:awards',
			name: 'awards',
			label: 'awards',
			comment: 'Awards won by or for this item.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:brand',
			name: 'brand',
			label: 'brand',
			comment:
				'The brand(s) associated with a product or service, or the brand(s) maintained by an organization or business person.',
			rangeIncludes: ['Brand', 'Organization'],
		},
		{
			id: 'schema:companyRegistration',
			name: 'companyRegistration',
			label: 'companyRegistration',
			comment:
				'The official registration information of a business including the organization that issued it such as Company House or Chamber of Commerce in form of a Certification.',
			rangeIncludes: ['Certification'],
		},
		{
			id: 'schema:contactPoint',
			name: 'contactPoint',
			label: 'contactPoint',
			comment: 'A contact point for a person or organization.',
			rangeIncludes: ['ContactPoint'],
		},
		{
			id: 'schema:contactPoints',
			name: 'contactPoints',
			label: 'contactPoints',
			comment: 'A contact point for a person or organization.',
			rangeIncludes: ['ContactPoint'],
		},
		{
			id: 'schema:correctionsPolicy',
			name: 'correctionsPolicy',
			label: 'correctionsPolicy',
			comment:
				'For an [[Organization]] (e.g. [[NewsMediaOrganization]]), a statement describing (in news media, the newsroom’s) disclosure and correction policy for errors.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:department',
			name: 'department',
			label: 'department',
			comment:
				'A relationship between an organization and a department of that organization, also described as an organization (allowing different urls, logos, opening hours). For example: a store with a pharmacy, or a bakery with a cafe.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:dissolutionDate',
			name: 'dissolutionDate',
			label: 'dissolutionDate',
			comment: 'The date that this organization was dissolved.',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:diversityPolicy',
			name: 'diversityPolicy',
			label: 'diversityPolicy',
			comment:
				'Statement on diversity policy by an [[Organization]] e.g. a [[NewsMediaOrganization]]. For a [[NewsMediaOrganization]], a statement describing the newsroom’s diversity policy on both staffing and sources, typically providing staffing data.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:diversityStaffingReport',
			name: 'diversityStaffingReport',
			label: 'diversityStaffingReport',
			comment:
				'For an [[Organization]] (often but not necessarily a [[NewsMediaOrganization]]), a report on staffing diversity issues. In a news context this might be for example ASNE or RTDNA (US) reports, or self-reported.',
			rangeIncludes: ['Article', 'URL'],
		},
		{
			id: 'schema:duns',
			name: 'duns',
			label: 'duns',
			comment:
				'The Dun & Bradstreet DUNS number for identifying an organization or business person.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:email',
			name: 'email',
			label: 'email',
			comment: 'Email address.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:employee',
			name: 'employee',
			label: 'employee',
			comment: 'Someone working for this organization.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:employees',
			name: 'employees',
			label: 'employees',
			comment: 'People working for this organization.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:ethicsPolicy',
			name: 'ethicsPolicy',
			label: 'ethicsPolicy',
			comment:
				'Statement about ethics policy, e.g. of a [[NewsMediaOrganization]] regarding journalistic and publishing practices, or of a [[Restaurant]], a page describing food source policies. In the case of a [[NewsMediaOrganization]], an ethicsPolicy is typically a statement describing the personal, organizational, and corporate standards of behavior expected by the organization.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:event',
			name: 'event',
			label: 'event',
			comment: 'Upcoming or past event associated with this place, organization, or action.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:events',
			name: 'events',
			label: 'events',
			comment: 'Upcoming or past events associated with this place or organization.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:faxNumber',
			name: 'faxNumber',
			label: 'faxNumber',
			comment: 'The fax number.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:founder',
			name: 'founder',
			label: 'founder',
			comment: 'A person or organization who founded this organization.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:founders',
			name: 'founders',
			label: 'founders',
			comment: 'A person who founded this organization.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:foundingDate',
			name: 'foundingDate',
			label: 'foundingDate',
			comment: 'The date that this organization was founded.',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:foundingLocation',
			name: 'foundingLocation',
			label: 'foundingLocation',
			comment: 'The place where the Organization was founded.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:funder',
			name: 'funder',
			label: 'funder',
			comment:
				'A person or organization that supports (sponsors) something through some kind of financial contribution.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:funding',
			name: 'funding',
			label: 'funding',
			comment:
				'A [[Grant]] that directly or indirectly provide funding or sponsorship for this item. See also [[ownershipFundingInfo]].',
			rangeIncludes: ['Grant'],
		},
		{
			id: 'schema:globalLocationNumber',
			name: 'globalLocationNumber',
			label: 'globalLocationNumber',
			comment:
				'The [Global Location Number](http://www.gs1.org/gln) (GLN, sometimes also referred to as International Location Number or ILN) of the respective organization, person, or place. The GLN is a 13-digit number used to identify parties and physical locations.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:hasCertification',
			name: 'hasCertification',
			label: 'hasCertification',
			comment:
				'Certification information about a product, organization, service, place, or person.',
			rangeIncludes: ['Certification'],
		},
		{
			id: 'schema:hasCredential',
			name: 'hasCredential',
			label: 'hasCredential',
			comment: 'A credential awarded to the Person or Organization.',
			rangeIncludes: ['Credential'],
		},
		{
			id: 'schema:hasGS1DigitalLink',
			name: 'hasGS1DigitalLink',
			label: 'hasGS1DigitalLink',
			comment:
				'The <a href="https://www.gs1.org/standards/gs1-digital-link">GS1 digital link</a> associated with the object. This URL should conform to the particular requirements of digital links. The link should only contain the Application Identifiers (AIs) that are relevant for the entity being annotated, for instance a [[Product]] or an [[Organization]], and for the correct granularity. In particular, for products:<ul><li>A Digital Link that contains a serial number (AI <code>21</code>) should only be present on instances of [[IndividualProduct]]</li><li>A Digital Link that contains a lot number (AI <code>10</code>) should be annotated as [[SomeProducts]] if only products from that lot are sold, or [[IndividualProduct]] if there is only a specific product.</li><li>A Digital Link that contains a global model number (AI <code>8013</code>) should be attached to a [[Product]] or a [[ProductModel]].</li></ul> Other item types should be adapted similarly.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:hasMemberProgram',
			name: 'hasMemberProgram',
			label: 'hasMemberProgram',
			comment:
				'MemberProgram offered by an Organization, for example an eCommerce merchant or an airline.',
			rangeIncludes: ['MemberProgram'],
		},
		{
			id: 'schema:hasMerchantReturnPolicy',
			name: 'hasMerchantReturnPolicy',
			label: 'hasMerchantReturnPolicy',
			comment: 'Specifies a MerchantReturnPolicy that may be applicable.',
			rangeIncludes: ['MerchantReturnPolicy'],
		},
		{
			id: 'schema:hasOfferCatalog',
			name: 'hasOfferCatalog',
			label: 'hasOfferCatalog',
			comment: 'Indicates an OfferCatalog listing for this Organization, Person, or Service.',
			rangeIncludes: ['OfferCatalog'],
		},
		{
			id: 'schema:hasPOS',
			name: 'hasPOS',
			label: 'hasPOS',
			comment: 'Points-of-Sales operated by the organization or person.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:hasShippingService',
			name: 'hasShippingService',
			label: 'hasShippingService',
			comment: 'Specification of a shipping service offered by the organization.',
			rangeIncludes: ['ShippingService'],
		},
		{
			id: 'schema:interactionStatistic',
			name: 'interactionStatistic',
			label: 'interactionStatistic',
			comment:
				'The number of interactions for the CreativeWork using the WebSite or SoftwareApplication. The most specific child type of InteractionCounter should be used.',
			rangeIncludes: ['InteractionCounter'],
		},
		{
			id: 'schema:isicV4',
			name: 'isicV4',
			label: 'isicV4',
			comment:
				'The International Standard of Industrial Classification of All Economic Activities (ISIC), Revision 4 code for a particular organization, business person, or place.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:iso6523Code',
			name: 'iso6523Code',
			label: 'iso6523Code',
			comment:
				'An organization identifier as defined in [ISO 6523(-1)](https://en.wikipedia.org/wiki/ISO/IEC_6523). The identifier should be in the `XXXX:YYYYYY:ZZZ` or `XXXX:YYYYYY`format. Where `XXXX` is a 4 digit _ICD_ (International Code Designator), `YYYYYY` is an _OID_ (Organization Identifier) with all formatting characters (dots, dashes, spaces) removed with a maximal length of 35 characters, and `ZZZ` is an optional OPI (Organization Part Identifier) with a maximum length of 35 characters. The various components (ICD, OID, OPI) are joined with a colon character (ASCII `0x3a`). Note that many existing organization identifiers defined as attributes like [leiCode](https://schema.org/leiCode) (`0199`), [duns](https://schema.org/duns) (`0060`) or [GLN](https://schema.org/globalLocationNumber) (`0088`) can be expressed using ISO-6523. If possible, ISO-6523 codes should be preferred to populating [vatID](https://schema.org/vatID) or [taxID](https://schema.org/taxID), as ISO identifiers are less ambiguous.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:keywords',
			name: 'keywords',
			label: 'keywords',
			comment:
				'Keywords or tags used to describe some item. Multiple textual entries in a keywords list are typically delimited by commas, or by repeating the property.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:knowsAbout',
			name: 'knowsAbout',
			label: 'knowsAbout',
			comment:
				'Of a [[Person]], and less typically of an [[Organization]], to indicate a topic that is known about - suggesting possible expertise but not implying it. We do not distinguish skill levels here, or relate this to educational content, events, objectives or [[JobPosting]] descriptions.',
			rangeIncludes: ['Text', 'Thing', 'URL'],
		},
		{
			id: 'schema:knowsLanguage',
			name: 'knowsLanguage',
			label: 'knowsLanguage',
			comment:
				'Of a [[Person]], and less typically of an [[Organization]], to indicate a known language. We do not distinguish skill levels or reading/writing/speaking/signing here. Use language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47).',
			rangeIncludes: ['Language', 'Text'],
		},
		{
			id: 'schema:legalAddress',
			name: 'legalAddress',
			label: 'legalAddress',
			comment:
				'The legal address of an organization which acts as the officially registered address used for legal and tax purposes. The legal address can be different from the place of operations of a business and other addresses can be part of an organization.',
			rangeIncludes: ['PostalAddress'],
		},
		{
			id: 'schema:legalName',
			name: 'legalName',
			label: 'legalName',
			comment: 'The official name of the organization, e.g. the registered company name.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:legalRepresentative',
			name: 'legalRepresentative',
			label: 'legalRepresentative',
			comment:
				'One or multiple persons who represent this organization legally such as CEO or sole administrator.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:leiCode',
			name: 'leiCode',
			label: 'leiCode',
			comment:
				'An organization identifier that uniquely identifies a legal entity as defined in ISO 17442.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:location',
			name: 'location',
			label: 'location',
			comment:
				'The location of, for example, where an event is happening, where an organization is located, or where an action takes place.',
			rangeIncludes: ['Place', 'PostalAddress', 'Text', 'VirtualLocation'],
		},
		{
			id: 'schema:logo',
			name: 'logo',
			label: 'logo',
			comment: 'An associated logo.',
			rangeIncludes: ['ImageObject', 'URL'],
		},
		{
			id: 'schema:makesOffer',
			name: 'makesOffer',
			label: 'makesOffer',
			comment: 'A pointer to products or services offered by the organization or person.',
			rangeIncludes: ['Offer'],
		},
		{
			id: 'schema:member',
			name: 'member',
			label: 'member',
			comment:
				'A member of an Organization or a ProgramMembership. Organizations can be members of organizations; ProgramMembership is typically for individuals.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:memberOf',
			name: 'memberOf',
			label: 'memberOf',
			comment:
				'An Organization (or ProgramMembership) to which this Person or Organization belongs.',
			rangeIncludes: ['MemberProgramTier', 'Organization', 'ProgramMembership'],
		},
		{
			id: 'schema:members',
			name: 'members',
			label: 'members',
			comment: 'A member of this organization.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:naics',
			name: 'naics',
			label: 'naics',
			comment:
				'The North American Industry Classification System (NAICS) code for a particular organization or business person.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:nonprofitStatus',
			name: 'nonprofitStatus',
			label: 'nonprofitStatus',
			comment:
				'nonprofitStatus indicates the legal status of a non-profit organization in its primary place of business.',
			rangeIncludes: ['NonprofitType'],
		},
		{
			id: 'schema:numberOfEmployees',
			name: 'numberOfEmployees',
			label: 'numberOfEmployees',
			comment: 'The number of employees in an organization, e.g. business.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:ownershipFundingInfo',
			name: 'ownershipFundingInfo',
			label: 'ownershipFundingInfo',
			comment:
				'For an [[Organization]] (often but not necessarily a [[NewsMediaOrganization]]), a description of organizational ownership structure; funding and grants. In a news/media setting, this is with particular reference to editorial independence.   Note that the [[funder]] is also available and can be used to make basic funder information machine-readable.',
			rangeIncludes: ['AboutPage', 'CreativeWork', 'Text', 'URL'],
		},
		{
			id: 'schema:owns',
			name: 'owns',
			label: 'owns',
			comment: 'Things owned by the organization or person.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:parentOrganization',
			name: 'parentOrganization',
			label: 'parentOrganization',
			comment:
				'The larger organization that this organization is a [[subOrganization]] of, if any.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:publishingPrinciples',
			name: 'publishingPrinciples',
			label: 'publishingPrinciples',
			comment:
				'The publishingPrinciples property indicates (typically via [[URL]]) a document describing the editorial principles of an [[Organization]] (or individual, e.g. a [[Person]] writing a blog) that relate to their activities as a publisher, e.g. ethics or diversity policies. When applied to a [[CreativeWork]] (e.g. [[NewsArticle]]) the principles are those of the party primarily responsible for the creation of the [[CreativeWork]].\n\nWhile such policies are most typically expressed in natural language, sometimes related information (e.g. indicating a [[funder]]) can be expressed using schema.org terminology.\n',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:review',
			name: 'review',
			label: 'review',
			comment: 'A review of the item.',
			rangeIncludes: ['Review'],
		},
		{
			id: 'schema:reviews',
			name: 'reviews',
			label: 'reviews',
			comment: 'Review of the item.',
			rangeIncludes: ['Review'],
		},
		{
			id: 'schema:seeks',
			name: 'seeks',
			label: 'seeks',
			comment: 'A pointer to products or services sought by the organization or person (demand).',
			rangeIncludes: ['Demand'],
		},
		{
			id: 'schema:serviceArea',
			name: 'serviceArea',
			label: 'serviceArea',
			comment: 'The geographic area where the service is provided.',
			rangeIncludes: ['AdministrativeArea', 'GeoShape', 'Place'],
		},
		{
			id: 'schema:skills',
			name: 'skills',
			label: 'skills',
			comment:
				'A statement of knowledge, skill, ability, task or any other assertion expressing a competency that is either claimed by a person, an organization or desired or required to fulfill a role or to work in an occupation.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:slogan',
			name: 'slogan',
			label: 'slogan',
			comment: 'A slogan or motto associated with the item.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:sponsor',
			name: 'sponsor',
			label: 'sponsor',
			comment:
				'A person or organization that supports a thing through a pledge, promise, or financial contribution. E.g. a sponsor of a Medical Study or a corporate sponsor of an event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:subOrganization',
			name: 'subOrganization',
			label: 'subOrganization',
			comment:
				"A relationship between two organizations where the first includes the second, e.g., as a subsidiary. See also: the more specific 'department' property.",
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:taxID',
			name: 'taxID',
			label: 'taxID',
			comment:
				'The Tax / Fiscal ID of the organization or person, e.g. the TIN in the US or the CIF/NIF in Spain.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:telephone',
			name: 'telephone',
			label: 'telephone',
			comment: 'The telephone number.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:unnamedSourcesPolicy',
			name: 'unnamedSourcesPolicy',
			label: 'unnamedSourcesPolicy',
			comment:
				'For an [[Organization]] (typically a [[NewsMediaOrganization]]), a statement about policy on use of unnamed sources and the decision process required.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:vatID',
			name: 'vatID',
			label: 'vatID',
			comment:
				'The value-added Tax ID of the organization or person with national prefix (for example IT123456789). Can also be described as [[iso6523Code]] with proper prefix.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOrganization;
export const Organization = schemaOrgOrganization;

export default schemaOrgOrganization;
