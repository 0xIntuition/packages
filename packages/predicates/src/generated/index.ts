import type { PredicateSpec } from '../types.js';
import { actor } from './specs/actor.js';
import { affiliatedWith } from './specs/affiliatedWith.js';
import { agreeWith } from './specs/agreeWith.js';
import { alternativeTo } from './specs/alternativeTo.js';
import { alumniOf } from './specs/alumniOf.js';
import { areaServed } from './specs/areaServed.js';
import { attestedBy } from './specs/attestedBy.js';
import { auditedBy } from './specs/auditedBy.js';
import { authoredBy } from './specs/authoredBy.js';
import { availableOn } from './specs/availableOn.js';
import { backedBy } from './specs/backedBy.js';
import { bearishOn } from './specs/bearishOn.js';
import { betterThan } from './specs/betterThan.js';
import { blocked } from './specs/blocked.js';
import { branchOf } from './specs/branchOf.js';
import { brand } from './specs/brand.js';
import { bullishOn } from './specs/bullishOn.js';
import { byArtist } from './specs/byArtist.js';
import { certifiedBy } from './specs/certifiedBy.js';
import { citedBy } from './specs/citedBy.js';
import { compatibleWith } from './specs/compatibleWith.js';
import { competeWith } from './specs/competeWith.js';
import { compliantWith } from './specs/compliantWith.js';
import { confirmedBy } from './specs/confirmedBy.js';
import { contain } from './specs/contain.js';
import { containedInPlace } from './specs/containedInPlace.js';
import { containsPlace } from './specs/containsPlace.js';
import { contributedTo } from './specs/contributedTo.js';
import { createdBy } from './specs/createdBy.js';
import { curatedBy } from './specs/curatedBy.js';
import { delegatedTo } from './specs/delegatedTo.js';
import { dependOn } from './specs/dependOn.js';
import { deprecatedBy } from './specs/deprecatedBy.js';
import { derivedFrom } from './specs/derivedFrom.js';
import { director } from './specs/director.js';
import { disagreeWith } from './specs/disagreeWith.js';
import { disputedBy } from './specs/disputedBy.js';
import { distrust } from './specs/distrust.js';
import { employedBy } from './specs/employedBy.js';
import { enabledBy } from './specs/enabledBy.js';
import { endorse } from './specs/endorse.js';
import { equivalentTo } from './specs/equivalentTo.js';
import { evidencedBy } from './specs/evidencedBy.js';
import { expertIn } from './specs/expertIn.js';
import { featuredIn } from './specs/featuredIn.js';
import { follow } from './specs/follow.js';
import { followedBy } from './specs/followedBy.js';
import { forkedFrom } from './specs/forkedFrom.js';
import { founded } from './specs/founded.js';
import { founder } from './specs/founder.js';
import { governedBy } from './specs/governedBy.js';
import { hasCategory } from './specs/hasCategory.js';
import { hasDescription } from './specs/hasDescription.js';
import { hasSource } from './specs/hasSource.js';
import { hasTag } from './specs/hasTag.js';
import { hasType } from './specs/hasType.js';
import { hiringOrganization } from './specs/hiringOrganization.js';
import { imgUrl } from './specs/imgUrl.js';
import { implement } from './specs/implement.js';
import { inAlbum } from './specs/inAlbum.js';
import { inPlaylist } from './specs/inPlaylist.js';
import { inspiredBy } from './specs/inspiredBy.js';
import { investedIn } from './specs/investedIn.js';
import { itemReviewed } from './specs/itemReviewed.js';
import { jobLocation } from './specs/jobLocation.js';
import { learnedFrom } from './specs/learnedFrom.js';
import { like } from './specs/like.js';
import { linkedAccount } from './specs/linkedAccount.js';
import { listedIn } from './specs/listedIn.js';
import { listedOn } from './specs/listedOn.js';
import { locatedIn } from './specs/locatedIn.js';
import { manufacturer } from './specs/manufacturer.js';
import { memberOf } from './specs/memberOf.js';
import { mentorOf } from './specs/mentorOf.js';
import { musicBy } from './specs/musicBy.js';
import { musicGroupMember } from './specs/musicGroupMember.js';
import { neutralOn } from './specs/neutralOn.js';
import { oppose } from './specs/oppose.js';
import { organizer } from './specs/organizer.js';
import { outperform } from './specs/outperform.js';
import { parentItem } from './specs/parentItem.js';
import { parentOrganization } from './specs/parentOrganization.js';
import { partnerOf } from './specs/partnerOf.js';
import { partOfSeries } from './specs/partOfSeries.js';
import { peggedTo } from './specs/peggedTo.js';
import { performer } from './specs/performer.js';
import { photo } from './specs/photo.js';
import { pinnedIn } from './specs/pinnedIn.js';
import { precededBy } from './specs/precededBy.js';
import { predecessorOf } from './specs/predecessorOf.js';
import { pricedIn } from './specs/pricedIn.js';
import { primaryImageOfPage } from './specs/primaryImageOfPage.js';
import { productionCompany } from './specs/productionCompany.js';
import { proposed } from './specs/proposed.js';
import { provider } from './specs/provider.js';
import { publishedAt } from './specs/publishedAt.js';
import { publisher } from './specs/publisher.js';
import { rankedAbove } from './specs/rankedAbove.js';
import { recommend } from './specs/recommend.js';
import { reference } from './specs/reference.js';
import { regulatedBy } from './specs/regulatedBy.js';
import { replacedBy } from './specs/replacedBy.js';
import { reported } from './specs/reported.js';
import { reviewed } from './specs/reviewed.js';
import { reviewedBy } from './specs/reviewedBy.js';
import { reward } from './specs/reward.js';
import { sameAs } from './specs/sameAs.js';
import { skepticalOf } from './specs/skepticalOf.js';
import { softwareAddOn } from './specs/softwareAddOn.js';
import { speak } from './specs/speak.js';
import { sponsoredBy } from './specs/sponsoredBy.js';
import { stakedIn } from './specs/stakedIn.js';
import { studentOf } from './specs/studentOf.js';
import { studied } from './specs/studied.js';
import { subEvent } from './specs/subEvent.js';
import { subOrganization } from './specs/subOrganization.js';
import { successorOf } from './specs/successorOf.js';
import { superEvent } from './specs/superEvent.js';
import { supersede } from './specs/supersede.js';
import { support } from './specs/support.js';
import { targetProduct } from './specs/targetProduct.js';
import { teach } from './specs/teach.js';
import { track } from './specs/track.js';
import { trailer } from './specs/trailer.js';
import { triggered } from './specs/triggered.js';
import { trust } from './specs/trust.js';
import { url } from './specs/url.js';
import { use } from './specs/use.js';
import { verifiedBy } from './specs/verifiedBy.js';
import { votedAgainst } from './specs/votedAgainst.js';
import { votedFor } from './specs/votedFor.js';
import { vouchFor } from './specs/vouchFor.js';
import { worseThan } from './specs/worseThan.js';

export { actor } from './specs/actor.js';
export { affiliatedWith } from './specs/affiliatedWith.js';
export { agreeWith } from './specs/agreeWith.js';
export { alternativeTo } from './specs/alternativeTo.js';
export { alumniOf } from './specs/alumniOf.js';
export { areaServed } from './specs/areaServed.js';
export { attestedBy } from './specs/attestedBy.js';
export { auditedBy } from './specs/auditedBy.js';
export { authoredBy } from './specs/authoredBy.js';
export { availableOn } from './specs/availableOn.js';
export { backedBy } from './specs/backedBy.js';
export { bearishOn } from './specs/bearishOn.js';
export { betterThan } from './specs/betterThan.js';
export { blocked } from './specs/blocked.js';
export { branchOf } from './specs/branchOf.js';
export { brand } from './specs/brand.js';
export { bullishOn } from './specs/bullishOn.js';
export { byArtist } from './specs/byArtist.js';
export { certifiedBy } from './specs/certifiedBy.js';
export { citedBy } from './specs/citedBy.js';
export { compatibleWith } from './specs/compatibleWith.js';
export { competeWith } from './specs/competeWith.js';
export { compliantWith } from './specs/compliantWith.js';
export { confirmedBy } from './specs/confirmedBy.js';
export { contain } from './specs/contain.js';
export { containedInPlace } from './specs/containedInPlace.js';
export { containsPlace } from './specs/containsPlace.js';
export { contributedTo } from './specs/contributedTo.js';
export { createdBy } from './specs/createdBy.js';
export { curatedBy } from './specs/curatedBy.js';
export { delegatedTo } from './specs/delegatedTo.js';
export { dependOn } from './specs/dependOn.js';
export { deprecatedBy } from './specs/deprecatedBy.js';
export { derivedFrom } from './specs/derivedFrom.js';
export { director } from './specs/director.js';
export { disagreeWith } from './specs/disagreeWith.js';
export { disputedBy } from './specs/disputedBy.js';
export { distrust } from './specs/distrust.js';
export { employedBy } from './specs/employedBy.js';
export { enabledBy } from './specs/enabledBy.js';
export { endorse } from './specs/endorse.js';
export { equivalentTo } from './specs/equivalentTo.js';
export { evidencedBy } from './specs/evidencedBy.js';
export { expertIn } from './specs/expertIn.js';
export { featuredIn } from './specs/featuredIn.js';
export { follow } from './specs/follow.js';
export { followedBy } from './specs/followedBy.js';
export { forkedFrom } from './specs/forkedFrom.js';
export { founded } from './specs/founded.js';
export { founder } from './specs/founder.js';
export { governedBy } from './specs/governedBy.js';
export { hasCategory } from './specs/hasCategory.js';
export { hasDescription } from './specs/hasDescription.js';
export { hasSource } from './specs/hasSource.js';
export { hasTag } from './specs/hasTag.js';
export { hasType } from './specs/hasType.js';
export { hiringOrganization } from './specs/hiringOrganization.js';
export { imgUrl } from './specs/imgUrl.js';
export { implement } from './specs/implement.js';
export { inAlbum } from './specs/inAlbum.js';
export { inPlaylist } from './specs/inPlaylist.js';
export { inspiredBy } from './specs/inspiredBy.js';
export { investedIn } from './specs/investedIn.js';
export { itemReviewed } from './specs/itemReviewed.js';
export { jobLocation } from './specs/jobLocation.js';
export { learnedFrom } from './specs/learnedFrom.js';
export { like } from './specs/like.js';
export { linkedAccount } from './specs/linkedAccount.js';
export { listedIn } from './specs/listedIn.js';
export { listedOn } from './specs/listedOn.js';
export { locatedIn } from './specs/locatedIn.js';
export { manufacturer } from './specs/manufacturer.js';
export { memberOf } from './specs/memberOf.js';
export { mentorOf } from './specs/mentorOf.js';
export { musicBy } from './specs/musicBy.js';
export { musicGroupMember } from './specs/musicGroupMember.js';
export { neutralOn } from './specs/neutralOn.js';
export { oppose } from './specs/oppose.js';
export { organizer } from './specs/organizer.js';
export { outperform } from './specs/outperform.js';
export { parentItem } from './specs/parentItem.js';
export { parentOrganization } from './specs/parentOrganization.js';
export { partnerOf } from './specs/partnerOf.js';
export { partOfSeries } from './specs/partOfSeries.js';
export { peggedTo } from './specs/peggedTo.js';
export { performer } from './specs/performer.js';
export { photo } from './specs/photo.js';
export { pinnedIn } from './specs/pinnedIn.js';
export { precededBy } from './specs/precededBy.js';
export { predecessorOf } from './specs/predecessorOf.js';
export { pricedIn } from './specs/pricedIn.js';
export { primaryImageOfPage } from './specs/primaryImageOfPage.js';
export { productionCompany } from './specs/productionCompany.js';
export { proposed } from './specs/proposed.js';
export { provider } from './specs/provider.js';
export { publishedAt } from './specs/publishedAt.js';
export { publisher } from './specs/publisher.js';
export { rankedAbove } from './specs/rankedAbove.js';
export { recommend } from './specs/recommend.js';
export { reference } from './specs/reference.js';
export { regulatedBy } from './specs/regulatedBy.js';
export { replacedBy } from './specs/replacedBy.js';
export { reported } from './specs/reported.js';
export { reviewed } from './specs/reviewed.js';
export { reviewedBy } from './specs/reviewedBy.js';
export { reward } from './specs/reward.js';
export { sameAs } from './specs/sameAs.js';
export { skepticalOf } from './specs/skepticalOf.js';
export { softwareAddOn } from './specs/softwareAddOn.js';
export { speak } from './specs/speak.js';
export { sponsoredBy } from './specs/sponsoredBy.js';
export { stakedIn } from './specs/stakedIn.js';
export { studentOf } from './specs/studentOf.js';
export { studied } from './specs/studied.js';
export { subEvent } from './specs/subEvent.js';
export { subOrganization } from './specs/subOrganization.js';
export { successorOf } from './specs/successorOf.js';
export { superEvent } from './specs/superEvent.js';
export { supersede } from './specs/supersede.js';
export { support } from './specs/support.js';
export { targetProduct } from './specs/targetProduct.js';
export { teach } from './specs/teach.js';
export { track } from './specs/track.js';
export { trailer } from './specs/trailer.js';
export { triggered } from './specs/triggered.js';
export { trust } from './specs/trust.js';
export { url } from './specs/url.js';
export { use } from './specs/use.js';
export { verifiedBy } from './specs/verifiedBy.js';
export { votedAgainst } from './specs/votedAgainst.js';
export { votedFor } from './specs/votedFor.js';
export { vouchFor } from './specs/vouchFor.js';
export { worseThan } from './specs/worseThan.js';

export const PREDICATE_SPECS = [
	hasType,
	sameAs,
	hasTag,
	hasCategory,
	follow,
	like,
	endorse,
	trust,
	distrust,
	reviewed,
	recommend,
	reported,
	blocked,
	vouchFor,
	contain,
	listedIn,
	curatedBy,
	pinnedIn,
	featuredIn,
	rankedAbove,
	dependOn,
	alternativeTo,
	createdBy,
	authoredBy,
	contributedTo,
	forkedFrom,
	derivedFrom,
	inspiredBy,
	linkedAccount,
	url,
	imgUrl,
	hasDescription,
	hasSource,
	publishedAt,
	locatedIn,
	availableOn,
	memberOf,
	employedBy,
	founded,
	affiliatedWith,
	partnerOf,
	investedIn,
	use,
	compatibleWith,
	governedBy,
	pricedIn,
	implement,
	agreeWith,
	disagreeWith,
	support,
	oppose,
	skepticalOf,
	bullishOn,
	bearishOn,
	neutralOn,
	betterThan,
	worseThan,
	equivalentTo,
	competeWith,
	outperform,
	supersede,
	predecessorOf,
	successorOf,
	expertIn,
	learnedFrom,
	teach,
	studied,
	certifiedBy,
	mentorOf,
	studentOf,
	speak,
	verifiedBy,
	auditedBy,
	attestedBy,
	citedBy,
	reference,
	evidencedBy,
	disputedBy,
	confirmedBy,
	precededBy,
	followedBy,
	enabledBy,
	triggered,
	deprecatedBy,
	replacedBy,
	votedFor,
	votedAgainst,
	delegatedTo,
	proposed,
	regulatedBy,
	compliantWith,
	backedBy,
	peggedTo,
	listedOn,
	sponsoredBy,
	reward,
	stakedIn,
	actor,
	areaServed,
	brand,
	byArtist,
	containedInPlace,
	containsPlace,
	director,
	founder,
	hiringOrganization,
	inAlbum,
	inPlaylist,
	itemReviewed,
	jobLocation,
	manufacturer,
	organizer,
	parentOrganization,
	partOfSeries,
	performer,
	productionCompany,
	provider,
	publisher,
	subOrganization,
	alumniOf,
	branchOf,
	musicBy,
	musicGroupMember,
	parentItem,
	photo,
	primaryImageOfPage,
	reviewedBy,
	softwareAddOn,
	subEvent,
	superEvent,
	targetProduct,
	track,
	trailer,
] as const satisfies readonly PredicateSpec[];
