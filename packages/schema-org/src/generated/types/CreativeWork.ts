import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCreativeWork = {
	id: 'schema:CreativeWork',
	name: 'CreativeWork',
	label: 'CreativeWork',
	comment:
		'The most generic kind of creative work, including books, movies, photographs, software programs, etc.',
	subClassOf: ['Thing'],
	properties: [
		{
			id: 'schema:about',
			name: 'about',
			label: 'about',
			comment: 'The subject matter of an object.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:abstract',
			name: 'abstract',
			label: 'abstract',
			comment: 'An abstract is a short description that summarizes a [[CreativeWork]].',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:accessMode',
			name: 'accessMode',
			label: 'accessMode',
			comment:
				'The human sensory perceptual system or cognitive faculty through which a person may process or perceive the intellectual content of a resource, not including any adaptations of the content (e.g., text alternatives for images). Values should be drawn from the [approved vocabulary](https://www.w3.org/2021/a11y-discov-vocab/latest/#accessMode-vocabulary).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:accessModeSufficient',
			name: 'accessModeSufficient',
			label: 'accessModeSufficient',
			comment:
				'A list of single or combined access modes that are sufficient to understand all the intellectual content of a resource, including any adaptations. Values should be drawn from the [approved vocabulary](https://www.w3.org/2021/a11y-discov-vocab/latest/#accessModeSufficient-vocabulary).',
			rangeIncludes: ['ItemList'],
		},
		{
			id: 'schema:accessibilityAPI',
			name: 'accessibilityAPI',
			label: 'accessibilityAPI',
			comment:
				'Indicates that the resource is compatible with the referenced accessibility API. Values should be drawn from the [approved vocabulary](https://www.w3.org/2021/a11y-discov-vocab/latest/#accessibilityAPI-vocabulary).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:accessibilityControl',
			name: 'accessibilityControl',
			label: 'accessibilityControl',
			comment:
				'Identifies input methods that are sufficient to fully control the described resource. Values should be drawn from the [approved vocabulary](https://www.w3.org/2021/a11y-discov-vocab/latest/#accessibilityControl-vocabulary).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:accessibilityFeature',
			name: 'accessibilityFeature',
			label: 'accessibilityFeature',
			comment:
				'Content features of the resource, such as accessible media, alternatives and supported enhancements for accessibility. Values should be drawn from the [approved vocabulary](https://www.w3.org/2021/a11y-discov-vocab/latest/#accessibilityFeature-vocabulary).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:accessibilityHazard',
			name: 'accessibilityHazard',
			label: 'accessibilityHazard',
			comment:
				'A characteristic of the described resource that is physiologically dangerous to some users. Related to WCAG 2.0 guideline 2.3. Values should be drawn from the [approved vocabulary](https://www.w3.org/2021/a11y-discov-vocab/latest/#accessibilityHazard-vocabulary).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:accessibilitySummary',
			name: 'accessibilitySummary',
			label: 'accessibilitySummary',
			comment:
				'A human-readable summary of specific accessibility features or deficiencies, consistent with the other accessibility metadata but expressing subtleties such as "short descriptions are present but long descriptions will be needed for non-visual users" or "short descriptions are present and no long descriptions are needed".',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:accountablePerson',
			name: 'accountablePerson',
			label: 'accountablePerson',
			comment: 'Specifies the Person that is legally accountable for the CreativeWork.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:acquireLicensePage',
			name: 'acquireLicensePage',
			label: 'acquireLicensePage',
			comment:
				'Indicates a page documenting how licenses can be purchased or otherwise acquired, for the current item.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:aggregateRating',
			name: 'aggregateRating',
			label: 'aggregateRating',
			comment: 'The overall rating, based on a collection of reviews or ratings, of the item.',
			rangeIncludes: ['AggregateRating'],
		},
		{
			id: 'schema:alternativeHeadline',
			name: 'alternativeHeadline',
			label: 'alternativeHeadline',
			comment: 'A secondary title of the CreativeWork.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:archivedAt',
			name: 'archivedAt',
			label: 'archivedAt',
			comment:
				'Indicates a page or other link involved in archival of a [[CreativeWork]]. In the case of [[MediaReview]], the items in a [[MediaReviewItem]] may often become inaccessible, but be archived by archival, journalistic, activist, or law enforcement organizations. In such cases, the referenced page may not directly publish the content.',
			rangeIncludes: ['URL', 'WebPage'],
		},
		{
			id: 'schema:assesses',
			name: 'assesses',
			label: 'assesses',
			comment:
				'The item being described is intended to assess the competency or learning outcome defined by the referenced term.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:associatedMedia',
			name: 'associatedMedia',
			label: 'associatedMedia',
			comment:
				'A media object that encodes this CreativeWork. This property is a synonym for encoding.',
			rangeIncludes: ['MediaObject'],
		},
		{
			id: 'schema:audience',
			name: 'audience',
			label: 'audience',
			comment: 'An intended audience, i.e. a group for whom something was created.',
			rangeIncludes: ['Audience'],
		},
		{
			id: 'schema:audio',
			name: 'audio',
			label: 'audio',
			comment: 'An embedded audio object.',
			rangeIncludes: ['AudioObject', 'Clip', 'MusicRecording'],
		},
		{
			id: 'schema:author',
			name: 'author',
			label: 'author',
			comment:
				'The author of this content or rating. Please note that author is special in that HTML 5 provides a special mechanism for indicating authorship via the rel tag. That is equivalent to this and may be used interchangeably.',
			rangeIncludes: ['Organization', 'Person'],
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
			id: 'schema:character',
			name: 'character',
			label: 'character',
			comment: 'Fictional person connected with a creative work.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:citation',
			name: 'citation',
			label: 'citation',
			comment:
				'A citation or reference to another creative work, such as another publication, web page, scholarly article, etc.',
			rangeIncludes: ['CreativeWork', 'Text'],
		},
		{
			id: 'schema:comment',
			name: 'comment',
			label: 'comment',
			comment: 'Comments, typically from users.',
			rangeIncludes: ['Comment'],
		},
		{
			id: 'schema:commentCount',
			name: 'commentCount',
			label: 'commentCount',
			comment:
				'The number of comments this CreativeWork (e.g. Article, Question or Answer) has received. This is most applicable to works published in Web sites with commenting system; additional comments may exist elsewhere.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:conditionsOfAccess',
			name: 'conditionsOfAccess',
			label: 'conditionsOfAccess',
			comment:
				'Conditions that affect the availability of, or method(s) of access to, an item. Typically used for real world items such as an [[ArchiveComponent]] held by an [[ArchiveOrganization]]. This property is not suitable for use as a general Web access control mechanism. It is expressed only in natural language.\\n\\nFor example "Available by appointment from the Reading Room" or "Accessible only from logged-in accounts ". ',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:contentLocation',
			name: 'contentLocation',
			label: 'contentLocation',
			comment:
				'The location depicted or described in the content. For example, the location in a photograph or painting.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:contentRating',
			name: 'contentRating',
			label: 'contentRating',
			comment: "Official rating of a piece of content&#x2014;for example, 'MPAA PG-13'.",
			rangeIncludes: ['Rating', 'Text'],
		},
		{
			id: 'schema:contentReferenceTime',
			name: 'contentReferenceTime',
			label: 'contentReferenceTime',
			comment:
				'The specific time described by a creative work, for works (e.g. articles, video objects etc.) that emphasise a particular moment within an Event.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:contributor',
			name: 'contributor',
			label: 'contributor',
			comment: 'A secondary contributor to the CreativeWork or Event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:copyrightHolder',
			name: 'copyrightHolder',
			label: 'copyrightHolder',
			comment: 'The party holding the legal copyright to the CreativeWork.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:copyrightNotice',
			name: 'copyrightNotice',
			label: 'copyrightNotice',
			comment:
				'Text of a notice appropriate for describing the copyright aspects of this Creative Work, ideally indicating the owner of the copyright for the Work.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:copyrightYear',
			name: 'copyrightYear',
			label: 'copyrightYear',
			comment:
				'The year during which the claimed copyright for the CreativeWork was first asserted.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:correction',
			name: 'correction',
			label: 'correction',
			comment:
				'Indicates a correction to a [[CreativeWork]], either via a [[CorrectionComment]], textually or in another document.',
			rangeIncludes: ['CorrectionComment', 'Text', 'URL'],
		},
		{
			id: 'schema:countryOfOrigin',
			name: 'countryOfOrigin',
			label: 'countryOfOrigin',
			comment:
				'The country of origin of something, including products as well as creative  works such as movie and TV content.\n\nIn the case of TV and movie, this would be the country of the principle offices of the production company or individual responsible for the movie. For other kinds of [[CreativeWork]] it is difficult to provide fully general guidance, and properties such as [[contentLocation]] and [[locationCreated]] may be more applicable.\n\nIn the case of products, the country of origin of the product. The exact interpretation of this may vary by context and product type, and cannot be fully enumerated here.',
			rangeIncludes: ['Country'],
		},
		{
			id: 'schema:creativeWorkStatus',
			name: 'creativeWorkStatus',
			label: 'creativeWorkStatus',
			comment:
				'The status of a creative work in terms of its stage in a lifecycle. Example terms include Incomplete, Draft, Published, Obsolete. Some organizations define a set of terms for the stages of their publication lifecycle.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:creator',
			name: 'creator',
			label: 'creator',
			comment:
				'The creator/author of this CreativeWork. This is the same as the Author property for CreativeWork.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:creditText',
			name: 'creditText',
			label: 'creditText',
			comment:
				'Text that can be used to credit person(s) and/or organization(s) associated with a published Creative Work.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:dateCreated',
			name: 'dateCreated',
			label: 'dateCreated',
			comment:
				'The date on which the CreativeWork was created or the item was added to a DataFeed.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:dateModified',
			name: 'dateModified',
			label: 'dateModified',
			comment:
				"The date on which the CreativeWork was most recently modified or when the item's entry was modified within a DataFeed.",
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:datePublished',
			name: 'datePublished',
			label: 'datePublished',
			comment:
				'Date of first publication or broadcast. For example the date a [[CreativeWork]] was broadcast or a [[Certification]] was issued.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:digitalSourceType',
			name: 'digitalSourceType',
			label: 'digitalSourceType',
			comment:
				'Indicates an IPTCDigitalSourceEnumeration code indicating the nature of the digital source(s) for some [[CreativeWork]].',
			rangeIncludes: ['IPTCDigitalSourceEnumeration'],
		},
		{
			id: 'schema:discussionUrl',
			name: 'discussionUrl',
			label: 'discussionUrl',
			comment: 'A link to the page containing the comments of the CreativeWork.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:displayLocation',
			name: 'displayLocation',
			label: 'displayLocation',
			comment: 'The location at which an item can be viewed or experienced in-person.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:editEIDR',
			name: 'editEIDR',
			label: 'editEIDR',
			comment:
				'An [EIDR](https://eidr.org/) (Entertainment Identifier Registry) [[identifier]] representing a specific edit / edition for a work of film or television.\n\nFor example, the motion picture known as "Ghostbusters" whose [[titleEIDR]] is "10.5240/7EC7-228A-510A-053E-CBB8-J" has several edits, e.g. "10.5240/1F2A-E1C5-680A-14C6-E76B-I" and "10.5240/8A35-3BEE-6497-5D12-9E4F-3".\n\nSince schema.org types like [[Movie]] and [[TVEpisode]] can be used for both works and their multiple expressions, it is possible to use [[titleEIDR]] alone (for a general description), or alongside [[editEIDR]] for a more edit-specific description.\n',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:editor',
			name: 'editor',
			label: 'editor',
			comment: 'Specifies the Person who edited the CreativeWork.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:educationalAlignment',
			name: 'educationalAlignment',
			label: 'educationalAlignment',
			comment:
				'An alignment to an established educational framework.\n\nThis property should not be used where the nature of the alignment can be described using a simple property, for example to express that a resource [[teaches]] or [[assesses]] a competency.',
			rangeIncludes: ['AlignmentObject'],
		},
		{
			id: 'schema:educationalLevel',
			name: 'educationalLevel',
			label: 'educationalLevel',
			comment:
				"The level in terms of progression through an educational or training context. Examples of educational levels include 'beginner', 'intermediate' or 'advanced', and formal sets of level indicators.",
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:educationalUse',
			name: 'educationalUse',
			label: 'educationalUse',
			comment:
				"The purpose of a work in the context of education; for example, 'assignment', 'group work'.",
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:encoding',
			name: 'encoding',
			label: 'encoding',
			comment:
				'A media object that encodes this CreativeWork. This property is a synonym for associatedMedia.',
			rangeIncludes: ['MediaObject'],
		},
		{
			id: 'schema:encodingFormat',
			name: 'encodingFormat',
			label: 'encodingFormat',
			comment:
				'Media type typically expressed using a MIME format (see [IANA site](http://www.iana.org/assignments/media-types/media-types.xhtml) and [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)), e.g. application/zip for a SoftwareApplication binary, audio/mpeg for .mp3 etc.\n\nIn cases where a [[CreativeWork]] has several media type representations, [[encoding]] can be used to indicate each [[MediaObject]] alongside particular [[encodingFormat]] information.\n\nUnregistered or niche encoding and file formats can be indicated instead via the most appropriate URL, e.g. defining Web page or a Wikipedia/Wikidata entry.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:encodings',
			name: 'encodings',
			label: 'encodings',
			comment: 'A media object that encodes this CreativeWork.',
			rangeIncludes: ['MediaObject'],
		},
		{
			id: 'schema:exampleOfWork',
			name: 'exampleOfWork',
			label: 'exampleOfWork',
			comment: 'A creative work that this work is an example/instance/realization/derivation of.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:expires',
			name: 'expires',
			label: 'expires',
			comment:
				'Date the content expires and is no longer useful or available. For example a [[VideoObject]] or [[NewsArticle]] whose availability or relevance is time-limited, a [[ClaimReview]] fact check whose publisher wants to indicate that it may no longer be relevant (or helpful to highlight) after some date, or a [[Certification]] the validity has expired.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:fileFormat',
			name: 'fileFormat',
			label: 'fileFormat',
			comment:
				"Media type, typically MIME format (see [IANA site](http://www.iana.org/assignments/media-types/media-types.xhtml)) of the content, e.g. application/zip of a SoftwareApplication binary. In cases where a CreativeWork has several media type representations, 'encoding' can be used to indicate each MediaObject alongside particular fileFormat information. Unregistered or niche file formats can be indicated instead via the most appropriate URL, e.g. defining Web page or a Wikipedia entry.",
			rangeIncludes: ['Text', 'URL'],
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
			id: 'schema:genre',
			name: 'genre',
			label: 'genre',
			comment: 'Genre of the creative work, broadcast channel or group.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
		},
		{
			id: 'schema:hasPart',
			name: 'hasPart',
			label: 'hasPart',
			comment:
				'Indicates an item or CreativeWork that is part of this item, or CreativeWork (in some sense).',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:headline',
			name: 'headline',
			label: 'headline',
			comment: 'Headline of the article.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:inLanguage',
			name: 'inLanguage',
			label: 'inLanguage',
			comment:
				'The language of the content or performance or used in an action. Please use one of the language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47). See also [[availableLanguage]].',
			rangeIncludes: ['Language', 'Text'],
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
			id: 'schema:interactivityType',
			name: 'interactivityType',
			label: 'interactivityType',
			comment:
				"The predominant mode of learning supported by the learning resource. Acceptable values are 'active', 'expositive', or 'mixed'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:interpretedAsClaim',
			name: 'interpretedAsClaim',
			label: 'interpretedAsClaim',
			comment:
				'Used to indicate a specific claim contained, implied, translated or refined from the content of a [[MediaObject]] or other [[CreativeWork]]. The interpreting party can be indicated using [[claimInterpreter]].',
			rangeIncludes: ['Claim'],
		},
		{
			id: 'schema:isAccessibleForFree',
			name: 'isAccessibleForFree',
			label: 'isAccessibleForFree',
			comment: 'A flag to signal that the item, event, or place is accessible for free.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:isBasedOn',
			name: 'isBasedOn',
			label: 'isBasedOn',
			comment:
				'A resource from which this work is derived or from which it is a modification or adaptation.',
			rangeIncludes: ['CreativeWork', 'Product', 'URL'],
		},
		{
			id: 'schema:isBasedOnUrl',
			name: 'isBasedOnUrl',
			label: 'isBasedOnUrl',
			comment:
				'A resource that was used in the creation of this resource. This term can be repeated for multiple sources. For example, http://example.com/great-multiplication-intro.html.',
			rangeIncludes: ['CreativeWork', 'Product', 'URL'],
		},
		{
			id: 'schema:isFamilyFriendly',
			name: 'isFamilyFriendly',
			label: 'isFamilyFriendly',
			comment: 'Indicates whether this content is family friendly.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:isPartOf',
			name: 'isPartOf',
			label: 'isPartOf',
			comment:
				'Indicates an item or CreativeWork that this item, or CreativeWork (in some sense), is part of.',
			rangeIncludes: ['CreativeWork', 'URL'],
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
			id: 'schema:learningResourceType',
			name: 'learningResourceType',
			label: 'learningResourceType',
			comment:
				"The predominant type or kind characterizing the learning resource. For example, 'presentation', 'handout'.",
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:license',
			name: 'license',
			label: 'license',
			comment: 'A license document that applies to this content, typically indicated by URL.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:locationCreated',
			name: 'locationCreated',
			label: 'locationCreated',
			comment:
				'The location where the CreativeWork was created, which may not be the same as the location depicted in the CreativeWork.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:mainEntity',
			name: 'mainEntity',
			label: 'mainEntity',
			comment: 'Indicates the primary entity described in some page or other CreativeWork.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:maintainer',
			name: 'maintainer',
			label: 'maintainer',
			comment:
				'A maintainer of a [[Dataset]], software package ([[SoftwareApplication]]), or other [[Project]]. A maintainer is a [[Person]] or [[Organization]] that manages contributions to, and/or publication of, some (typically complex) artifact. It is common for distributions of software and data to be based on "upstream" sources. When [[maintainer]] is applied to a specific version of something e.g. a particular version or packaging of a [[Dataset]], it is always  possible that the upstream source has a different maintainer. The [[isBasedOn]] property can be used to indicate such relationships between datasets to make the different maintenance roles clear. Similarly in the case of software, a package may have dedicated maintainers working on integration into software distributions such as Ubuntu, as well as upstream maintainers of the underlying work.\n      ',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:material',
			name: 'material',
			label: 'material',
			comment: 'A material that something is made from, e.g. leather, wool, cotton, paper.',
			rangeIncludes: ['Product', 'Text', 'URL'],
		},
		{
			id: 'schema:materialExtent',
			name: 'materialExtent',
			label: 'materialExtent',
			comment:
				'The quantity of the materials being described or an expression of the physical space they occupy.',
			rangeIncludes: ['QuantitativeValue', 'Text'],
		},
		{
			id: 'schema:mentions',
			name: 'mentions',
			label: 'mentions',
			comment:
				'Indicates that the CreativeWork contains a reference to, but is not necessarily about a concept.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:offers',
			name: 'offers',
			label: 'offers',
			comment:
				'An offer to provide this item&#x2014;for example, an offer to sell a product, rent the DVD of a movie, perform a service, or give away tickets to an event. Use [[businessFunction]] to indicate the kind of transaction offered, i.e. sell, lease, etc. This property can also be used to describe a [[Demand]]. While this property is listed as expected on a number of common types, it can be used in others. In that case, using a second type, such as Product or a subtype of Product, can clarify the nature of the offer.\n      ',
			rangeIncludes: ['Demand', 'Offer'],
		},
		{
			id: 'schema:pattern',
			name: 'pattern',
			label: 'pattern',
			comment:
				"A pattern that something has, for example 'polka dot', 'striped', 'Canadian flag'. Values are typically expressed as text, although links to controlled value schemes are also supported.",
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:position',
			name: 'position',
			label: 'position',
			comment: 'The position of an item in a series or sequence of items.',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:producer',
			name: 'producer',
			label: 'producer',
			comment:
				'The person or organization who produced the work (e.g. music album, movie, TV/radio series etc.).',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:provider',
			name: 'provider',
			label: 'provider',
			comment:
				'The service provider, service operator, or service performer; the goods producer. Another party (a seller) may offer those services or goods on behalf of the provider. A provider may also serve as the seller.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:publication',
			name: 'publication',
			label: 'publication',
			comment: 'A publication event associated with the item.',
			rangeIncludes: ['PublicationEvent'],
		},
		{
			id: 'schema:publisher',
			name: 'publisher',
			label: 'publisher',
			comment: 'The publisher of the article in question.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:publisherImprint',
			name: 'publisherImprint',
			label: 'publisherImprint',
			comment: 'The publishing division which published the comic.',
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
			id: 'schema:recordedAt',
			name: 'recordedAt',
			label: 'recordedAt',
			comment:
				'The Event where the CreativeWork was recorded. The CreativeWork may capture all or part of the event.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:releasedEvent',
			name: 'releasedEvent',
			label: 'releasedEvent',
			comment: 'The place and time the release was issued, expressed as a PublicationEvent.',
			rangeIncludes: ['PublicationEvent'],
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
			id: 'schema:schemaVersion',
			name: 'schemaVersion',
			label: 'schemaVersion',
			comment:
				'Indicates (by URL or string) a particular version of a schema used in some CreativeWork. This property was created primarily to\n    indicate the use of a specific schema.org release, e.g. ```10.0``` as a simple string, or more explicitly via URL, ```https://schema.org/docs/releases.html#v10.0```. There may be situations in which other schemas might usefully be referenced this way, e.g. ```http://dublincore.org/specifications/dublin-core/dces/1999-07-02/``` but this has not been carefully explored in the community.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:sdDatePublished',
			name: 'sdDatePublished',
			label: 'sdDatePublished',
			comment:
				'Indicates the date on which the current structured data was generated / published. Typically used alongside [[sdPublisher]].',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:sdLicense',
			name: 'sdLicense',
			label: 'sdLicense',
			comment:
				'A license document that applies to this structured data, typically indicated by URL.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:sdPublisher',
			name: 'sdPublisher',
			label: 'sdPublisher',
			comment:
				'Indicates the party responsible for generating and publishing the current structured data markup, typically in cases where the structured data is derived automatically from existing published content but published on a different site. For example, student projects and open data initiatives often re-publish existing content with more explicitly structured metadata. The\n[[sdPublisher]] property helps make such practices more explicit.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:size',
			name: 'size',
			label: 'size',
			comment:
				"A standardized size of a product or creative work, specified either through a simple textual string (for example 'XL', '32Wx34L'), a  QuantitativeValue with a unitCode, or a comprehensive and structured [[SizeSpecification]]; in other cases, the [[width]], [[height]], [[depth]] and [[weight]] properties may be more applicable. ",
			rangeIncludes: ['DefinedTerm', 'QuantitativeValue', 'SizeSpecification', 'Text'],
		},
		{
			id: 'schema:sourceOrganization',
			name: 'sourceOrganization',
			label: 'sourceOrganization',
			comment: 'The Organization on whose behalf the creator was working.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:spatial',
			name: 'spatial',
			label: 'spatial',
			comment:
				'The "spatial" property can be used in cases when more specific properties\n(e.g. [[locationCreated]], [[spatialCoverage]], [[contentLocation]]) are not known to be appropriate.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:spatialCoverage',
			name: 'spatialCoverage',
			label: 'spatialCoverage',
			comment:
				'The spatialCoverage of a CreativeWork indicates the place(s) which are the focus of the content. It is a subproperty of\n      contentLocation intended primarily for more technical and detailed materials. For example with a Dataset, it indicates\n      areas that the dataset describes: a dataset of New York weather would have spatialCoverage which was the place: the state of New York.',
			rangeIncludes: ['Place'],
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
			id: 'schema:teaches',
			name: 'teaches',
			label: 'teaches',
			comment:
				'The item being described is intended to help a person learn the competency or learning outcome defined by the referenced term.',
			rangeIncludes: ['DefinedTerm', 'Text'],
		},
		{
			id: 'schema:temporal',
			name: 'temporal',
			label: 'temporal',
			comment:
				'The "temporal" property can be used in cases where more specific properties\n(e.g. [[temporalCoverage]], [[dateCreated]], [[dateModified]], [[datePublished]]) are not known to be appropriate.',
			rangeIncludes: ['DateTime', 'Text'],
		},
		{
			id: 'schema:temporalCoverage',
			name: 'temporalCoverage',
			label: 'temporalCoverage',
			comment:
				'The temporalCoverage of a CreativeWork indicates the period that the content applies to, i.e. that it describes, either as a DateTime or as a textual string indicating a time period in [ISO 8601 time interval format](https://en.wikipedia.org/wiki/ISO_8601#Time_intervals). In\n      the case of a Dataset it will typically indicate the relevant time period in a precise notation (e.g. for a 2011 census dataset, the year 2011 would be written "2011/2012"). Other forms of content, e.g. ScholarlyArticle, Book, TVSeries or TVEpisode, may indicate their temporalCoverage in broader terms - textually or via well-known URL.\n      Written works such as books may sometimes have precise temporal coverage too, e.g. a work set in 1939 - 1945 can be indicated in ISO 8601 interval format format via "1939/1945".\n\nOpen-ended date ranges can be written with ".." in place of the end date. For example, "2015-11/.." indicates a range beginning in November 2015 and with no specified final date. This is tentative and might be updated in future when ISO 8601 is officially updated.',
			rangeIncludes: ['DateTime', 'Text', 'URL'],
		},
		{
			id: 'schema:text',
			name: 'text',
			label: 'text',
			comment: 'The textual content of this CreativeWork.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:thumbnail',
			name: 'thumbnail',
			label: 'thumbnail',
			comment: 'Thumbnail image for an image or video.',
			rangeIncludes: ['ImageObject'],
		},
		{
			id: 'schema:thumbnailUrl',
			name: 'thumbnailUrl',
			label: 'thumbnailUrl',
			comment: 'A thumbnail image relevant to the Thing.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:timeRequired',
			name: 'timeRequired',
			label: 'timeRequired',
			comment:
				'Approximate or typical time it usually takes to work with or through the content of this work for the typical or target audience.',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:translationOfWork',
			name: 'translationOfWork',
			label: 'translationOfWork',
			comment:
				'The work that this work has been translated from. E.g. 物种起源 is a translationOf “On the Origin of Species”.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:translator',
			name: 'translator',
			label: 'translator',
			comment:
				'Organization or person who adapts a creative work to different languages, regional differences and technical requirements of a target market, or that translates during some event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:typicalAgeRange',
			name: 'typicalAgeRange',
			label: 'typicalAgeRange',
			comment: "The typical expected age range, e.g. '7-9', '11-'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:usageInfo',
			name: 'usageInfo',
			label: 'usageInfo',
			comment:
				'The schema.org [[usageInfo]] property indicates further information about a [[CreativeWork]]. This property is applicable both to works that are freely available and to those that require payment or other transactions. It can reference additional information, e.g. community expectations on preferred linking and citation conventions, as well as purchasing details. For something that can be commercially licensed, usageInfo can provide detailed, resource-specific information about licensing options.\n\nThis property can be used alongside the license property which indicates license(s) applicable to some piece of content. The usageInfo property can provide information about other licensing options, e.g. acquiring commercial usage rights for an image that is also available under non-commercial creative commons licenses.',
			rangeIncludes: ['CreativeWork', 'URL'],
		},
		{
			id: 'schema:version',
			name: 'version',
			label: 'version',
			comment: 'The version of the CreativeWork embodied by a specified resource.',
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:video',
			name: 'video',
			label: 'video',
			comment: 'An embedded video object.',
			rangeIncludes: ['Clip', 'VideoObject'],
		},
		{
			id: 'schema:wordCount',
			name: 'wordCount',
			label: 'wordCount',
			comment: 'The number of words in the text of the CreativeWork such as an Article, Book, etc.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:workExample',
			name: 'workExample',
			label: 'workExample',
			comment:
				'Example/instance/realization/derivation of the concept of this creative work. E.g. the paperback edition, first edition, or e-book.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:workTranslation',
			name: 'workTranslation',
			label: 'workTranslation',
			comment:
				'A work that is a translation of the content of this work. E.g. 西遊記 has an English workTranslation “Journey to the West”, a German workTranslation “Monkeys Pilgerfahrt” and a Vietnamese  translation Tây du ký bình khảo.',
			rangeIncludes: ['CreativeWork'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCreativeWork;
export const CreativeWork = schemaOrgCreativeWork;

export default schemaOrgCreativeWork;
