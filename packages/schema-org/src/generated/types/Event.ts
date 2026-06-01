import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEvent = {
	id: 'schema:Event',
	name: 'Event',
	label: 'Event',
	comment:
		'An event happening at a certain time and location, such as a concert, lecture, or festival. Ticketing information may be added via the [[offers]] property. Repeated events may be structured as separate Event objects.',
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
			id: 'schema:actor',
			name: 'actor',
			label: 'actor',
			comment:
				'An actor (individual or a group), e.g. in TV, radio, movie, video games etc., or in an event. Actors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['PerformingGroup', 'Person'],
		},
		{
			id: 'schema:aggregateRating',
			name: 'aggregateRating',
			label: 'aggregateRating',
			comment: 'The overall rating, based on a collection of reviews or ratings, of the item.',
			rangeIncludes: ['AggregateRating'],
		},
		{
			id: 'schema:attendee',
			name: 'attendee',
			label: 'attendee',
			comment: 'A person or organization attending the event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:attendees',
			name: 'attendees',
			label: 'attendees',
			comment: 'A person attending the event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:audience',
			name: 'audience',
			label: 'audience',
			comment: 'An intended audience, i.e. a group for whom something was created.',
			rangeIncludes: ['Audience'],
		},
		{
			id: 'schema:composer',
			name: 'composer',
			label: 'composer',
			comment:
				'The person or organization who wrote a composition, or who is the composer of a work performed at some event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:contributor',
			name: 'contributor',
			label: 'contributor',
			comment: 'A secondary contributor to the CreativeWork or Event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:director',
			name: 'director',
			label: 'director',
			comment:
				'A director of e.g. TV, radio, movie, video gaming etc. content, or of an event. Directors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:doorTime',
			name: 'doorTime',
			label: 'doorTime',
			comment: 'The time admission will commence.',
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:duration',
			name: 'duration',
			label: 'duration',
			comment:
				'The duration of the item (movie, audio recording, event, etc.) in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
		{
			id: 'schema:endDate',
			name: 'endDate',
			label: 'endDate',
			comment:
				'The end date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:eventAttendanceMode',
			name: 'eventAttendanceMode',
			label: 'eventAttendanceMode',
			comment:
				'The eventAttendanceMode of an event indicates whether it occurs online, offline, or a mix.',
			rangeIncludes: ['EventAttendanceModeEnumeration'],
		},
		{
			id: 'schema:eventSchedule',
			name: 'eventSchedule',
			label: 'eventSchedule',
			comment:
				'Associates an [[Event]] with a [[Schedule]]. There are circumstances where it is preferable to share a schedule for a series of\n      repeating events rather than data on the individual events themselves. For example, a website or application might prefer to publish a schedule for a weekly\n      gym class rather than provide data on every event. A schedule could be processed by applications to add forthcoming events to a calendar. An [[Event]] that\n      is associated with a [[Schedule]] using this property should not have [[startDate]] or [[endDate]] properties. These are instead defined within the associated\n      [[Schedule]], this avoids any ambiguity for clients using the data. The property might have repeated values to specify different schedules, e.g. for different months\n      or seasons.',
			rangeIncludes: ['Schedule'],
		},
		{
			id: 'schema:eventStatus',
			name: 'eventStatus',
			label: 'eventStatus',
			comment:
				'An eventStatus of an event represents its status; particularly useful when an event is cancelled or rescheduled.',
			rangeIncludes: ['EventStatusType'],
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
			id: 'schema:hasParticipationOffer',
			name: 'hasParticipationOffer',
			label: 'hasParticipationOffer',
			comment:
				'An offer to participate in the event, for example, Call for Proposals, Call for Speakers, or Call for Performers.',
			rangeIncludes: ['Offer'],
		},
		{
			id: 'schema:hasSponsorshipOffer',
			name: 'hasSponsorshipOffer',
			label: 'hasSponsorshipOffer',
			comment:
				'An offer to sponsor the event, for example, Sponsorship Prospectus, Sponsorship Opportunities, or Sponsor Packages.',
			rangeIncludes: ['Offer'],
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
			id: 'schema:isAccessibleForFree',
			name: 'isAccessibleForFree',
			label: 'isAccessibleForFree',
			comment: 'A flag to signal that the item, event, or place is accessible for free.',
			rangeIncludes: ['Boolean'],
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
			id: 'schema:location',
			name: 'location',
			label: 'location',
			comment:
				'The location of, for example, where an event is happening, where an organization is located, or where an action takes place.',
			rangeIncludes: ['Place', 'PostalAddress', 'Text', 'VirtualLocation'],
		},
		{
			id: 'schema:maximumAttendeeCapacity',
			name: 'maximumAttendeeCapacity',
			label: 'maximumAttendeeCapacity',
			comment: 'The total number of individuals that may attend an event or venue.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:maximumPhysicalAttendeeCapacity',
			name: 'maximumPhysicalAttendeeCapacity',
			label: 'maximumPhysicalAttendeeCapacity',
			comment:
				'The maximum physical attendee capacity of an [[Event]] whose [[eventAttendanceMode]] is [[OfflineEventAttendanceMode]] (or the offline aspects, in the case of a [[MixedEventAttendanceMode]]). ',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:maximumVirtualAttendeeCapacity',
			name: 'maximumVirtualAttendeeCapacity',
			label: 'maximumVirtualAttendeeCapacity',
			comment:
				'The maximum virtual attendee capacity of an [[Event]] whose [[eventAttendanceMode]] is [[OnlineEventAttendanceMode]] (or the online aspects, in the case of a [[MixedEventAttendanceMode]]). ',
			rangeIncludes: ['Integer'],
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
			id: 'schema:organizer',
			name: 'organizer',
			label: 'organizer',
			comment: 'An organizer of an Event.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:performer',
			name: 'performer',
			label: 'performer',
			comment:
				'A performer at the event&#x2014;for example, a presenter, musician, musical group or actor.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:performers',
			name: 'performers',
			label: 'performers',
			comment:
				'The main performer or performers of the event&#x2014;for example, a presenter, musician, or actor.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:previousStartDate',
			name: 'previousStartDate',
			label: 'previousStartDate',
			comment:
				'Used in conjunction with eventStatus for rescheduled or cancelled events. This property contains the previously scheduled start date. For rescheduled events, the startDate property should be used for the newly scheduled start date. In the (rare) case of an event that has been postponed and rescheduled multiple times, this field may be repeated.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:recordedIn',
			name: 'recordedIn',
			label: 'recordedIn',
			comment: 'The CreativeWork that captured all or part of this Event.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:remainingAttendeeCapacity',
			name: 'remainingAttendeeCapacity',
			label: 'remainingAttendeeCapacity',
			comment: 'The number of attendee places for an event that remain unallocated.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:review',
			name: 'review',
			label: 'review',
			comment: 'A review of the item.',
			rangeIncludes: ['Review'],
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
			id: 'schema:startDate',
			name: 'startDate',
			label: 'startDate',
			comment:
				'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:subEvent',
			name: 'subEvent',
			label: 'subEvent',
			comment:
				'An Event that is part of this event. For example, a conference event includes many presentations, each of which is a subEvent of the conference.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:subEvents',
			name: 'subEvents',
			label: 'subEvents',
			comment:
				'Events that are a part of this event. For example, a conference event includes many presentations, each subEvents of the conference.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:superEvent',
			name: 'superEvent',
			label: 'superEvent',
			comment:
				'An event that this event is a part of. For example, a collection of individual music performances might each have a music festival as their superEvent.',
			rangeIncludes: ['Event'],
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
			id: 'schema:workFeatured',
			name: 'workFeatured',
			label: 'workFeatured',
			comment:
				'A work featured in some event, e.g. exhibited in an ExhibitionEvent.\n       Specific subproperties are available for workPerformed (e.g. a play), or a workPresented (a Movie at a ScreeningEvent).',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:workPerformed',
			name: 'workPerformed',
			label: 'workPerformed',
			comment: 'A work performed in some event, for example a play performed in a TheaterEvent.',
			rangeIncludes: ['CreativeWork'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEvent;
export const Event = schemaOrgEvent;

export default schemaOrgEvent;
