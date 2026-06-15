import type { CreationProfile } from '../../creation-profile.js';
import { aggregateRatingCreationProfile } from './aggregate-rating.js';
import { articleCreationProfile } from './article.js';
import { bookCreationProfile } from './book.js';
import { brandCreationProfile } from './brand.js';
import { commentCreationProfile } from './comment.js';
import { companyCreationProfile } from './company.js';
import { datasetCreationProfile } from './dataset.js';
import { definedTermCreationProfile } from './defined-term.js';
import { ethereumAccountCreationProfile } from './ethereum-account.js';
import { ethereumErc20CreationProfile } from './ethereum-erc20.js';
import { ethereumSmartContractCreationProfile } from './ethereum-smart-contract.js';
import { eventCreationProfile } from './event.js';
import { imageCreationProfile } from './image.js';
import { jobPostingCreationProfile } from './job-posting.js';
import { localBusinessCreationProfile } from './local-business.js';
import { locationCreationProfile } from './location.js';
import { mobileApplicationCreationProfile } from './mobile-application.js';
import { movieCreationProfile } from './movie.js';
import { musicAlbumCreationProfile } from './music-album.js';
import { musicGroupCreationProfile } from './music-group.js';
import { musicRecordingCreationProfile } from './music-recording.js';
import { newsArticleCreationProfile } from './news-article.js';
import { personCreationProfile } from './person.js';
import { podcastEpisodeCreationProfile } from './podcast-episode.js';
import { podcastSeriesCreationProfile } from './podcast-series.js';
import { productCreationProfile } from './product.js';
import { reviewCreationProfile } from './review.js';
import { serviceCreationProfile } from './service.js';
import { socialMediaAccountCreationProfile } from './social-media-account.js';
import { socialMediaPostingCreationProfile } from './social-media-posting.js';
import { softwareCreationProfile } from './software.js';
import { softwareApplicationCreationProfile } from './software-application.js';
import { thingCreationProfile } from './thing.js';
import { tvSeriesCreationProfile } from './tv-series.js';
import { videoObjectCreationProfile } from './video-object.js';
import { webPageCreationProfile } from './web-page.js';
import { webSiteCreationProfile } from './web-site.js';

export { aggregateRatingCreationProfile } from './aggregate-rating.js';
export { articleCreationProfile } from './article.js';
export { bookCreationProfile } from './book.js';
export { brandCreationProfile } from './brand.js';
export { commentCreationProfile } from './comment.js';
export { companyCreationProfile } from './company.js';
export { datasetCreationProfile } from './dataset.js';
export { definedTermCreationProfile } from './defined-term.js';
export { ethereumAccountCreationProfile } from './ethereum-account.js';
export { ethereumErc20CreationProfile } from './ethereum-erc20.js';
export { ethereumSmartContractCreationProfile } from './ethereum-smart-contract.js';
export { eventCreationProfile } from './event.js';
export { imageCreationProfile } from './image.js';
export { jobPostingCreationProfile } from './job-posting.js';
export { localBusinessCreationProfile } from './local-business.js';
export { locationCreationProfile } from './location.js';
export { mobileApplicationCreationProfile } from './mobile-application.js';
export { movieCreationProfile } from './movie.js';
export { musicAlbumCreationProfile } from './music-album.js';
export { musicGroupCreationProfile } from './music-group.js';
export { musicRecordingCreationProfile } from './music-recording.js';
export { newsArticleCreationProfile } from './news-article.js';
export { personCreationProfile } from './person.js';
export { podcastEpisodeCreationProfile } from './podcast-episode.js';
export { podcastSeriesCreationProfile } from './podcast-series.js';
export { productCreationProfile } from './product.js';
export { reviewCreationProfile } from './review.js';
export { serviceCreationProfile } from './service.js';
export { socialMediaAccountCreationProfile } from './social-media-account.js';
export { socialMediaPostingCreationProfile } from './social-media-posting.js';
export { softwareCreationProfile } from './software.js';
export { softwareApplicationCreationProfile } from './software-application.js';
export { thingCreationProfile } from './thing.js';
export { tvSeriesCreationProfile } from './tv-series.js';
export { videoObjectCreationProfile } from './video-object.js';
export { webPageCreationProfile } from './web-page.js';
export { webSiteCreationProfile } from './web-site.js';

export const CREATION_PROFILES = [
	aggregateRatingCreationProfile,
	articleCreationProfile,
	bookCreationProfile,
	brandCreationProfile,
	commentCreationProfile,
	companyCreationProfile,
	datasetCreationProfile,
	definedTermCreationProfile,
	ethereumAccountCreationProfile,
	ethereumErc20CreationProfile,
	ethereumSmartContractCreationProfile,
	eventCreationProfile,
	imageCreationProfile,
	jobPostingCreationProfile,
	localBusinessCreationProfile,
	locationCreationProfile,
	mobileApplicationCreationProfile,
	movieCreationProfile,
	musicAlbumCreationProfile,
	musicGroupCreationProfile,
	musicRecordingCreationProfile,
	newsArticleCreationProfile,
	personCreationProfile,
	podcastEpisodeCreationProfile,
	podcastSeriesCreationProfile,
	productCreationProfile,
	reviewCreationProfile,
	serviceCreationProfile,
	socialMediaAccountCreationProfile,
	socialMediaPostingCreationProfile,
	softwareCreationProfile,
	softwareApplicationCreationProfile,
	thingCreationProfile,
	tvSeriesCreationProfile,
	videoObjectCreationProfile,
	webPageCreationProfile,
	webSiteCreationProfile,
] as const satisfies readonly CreationProfile[];

export const CREATION_PROFILE_SLUGS = [
	'aggregate-rating',
	'article',
	'book',
	'brand',
	'comment',
	'company',
	'dataset',
	'defined-term',
	'ethereum-account',
	'ethereum-erc20',
	'ethereum-smart-contract',
	'event',
	'image',
	'job-posting',
	'local-business',
	'location',
	'mobile-application',
	'movie',
	'music-album',
	'music-group',
	'music-recording',
	'news-article',
	'person',
	'podcast-episode',
	'podcast-series',
	'product',
	'review',
	'service',
	'social-media-account',
	'social-media-posting',
	'software',
	'software-application',
	'thing',
	'tv-series',
	'video-object',
	'web-page',
	'web-site',
] as const;
