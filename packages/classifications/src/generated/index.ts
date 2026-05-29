import type { ClassificationSpec } from '../types.js';
import { aggregateRating } from './specs/aggregate-rating.js';
import { article } from './specs/article.js';
import { book } from './specs/book.js';
import { brand } from './specs/brand.js';
import { comment } from './specs/comment.js';
import { company } from './specs/company.js';
import { dataset } from './specs/dataset.js';
import { definedTerm } from './specs/defined-term.js';
import { ethereumAccount } from './specs/ethereum-account.js';
import { ethereumErc20 } from './specs/ethereum-erc20.js';
import { ethereumSmartContract } from './specs/ethereum-smart-contract.js';
import { event } from './specs/event.js';
import { image } from './specs/image.js';
import { jobPosting } from './specs/job-posting.js';
import { localBusiness } from './specs/local-business.js';
import { location } from './specs/location.js';
import { mobileApplication } from './specs/mobile-application.js';
import { movie } from './specs/movie.js';
import { musicAlbum } from './specs/music-album.js';
import { musicGroup } from './specs/music-group.js';
import { musicRecording } from './specs/music-recording.js';
import { newsArticle } from './specs/news-article.js';
import { person } from './specs/person.js';
import { podcastEpisode } from './specs/podcast-episode.js';
import { podcastSeries } from './specs/podcast-series.js';
import { product } from './specs/product.js';
import { review } from './specs/review.js';
import { service } from './specs/service.js';
import { socialMediaAccount } from './specs/social-media-account.js';
import { socialMediaPosting } from './specs/social-media-posting.js';
import { software } from './specs/software.js';
import { softwareApplication } from './specs/software-application.js';
import { thing } from './specs/thing.js';
import { tvSeries } from './specs/tv-series.js';
import { videoObject } from './specs/video-object.js';
import { webPage } from './specs/web-page.js';
import { webSite } from './specs/web-site.js';

export const CLASSIFICATION_SPECS = [
	aggregateRating,
	article,
	book,
	brand,
	comment,
	company,
	dataset,
	definedTerm,
	ethereumAccount,
	ethereumErc20,
	ethereumSmartContract,
	event,
	image,
	jobPosting,
	localBusiness,
	location,
	mobileApplication,
	movie,
	musicAlbum,
	musicGroup,
	musicRecording,
	newsArticle,
	person,
	podcastEpisode,
	podcastSeries,
	product,
	review,
	service,
	socialMediaAccount,
	socialMediaPosting,
	software,
	softwareApplication,
	thing,
	tvSeries,
	videoObject,
	webPage,
	webSite,
] as const satisfies readonly ClassificationSpec[];
