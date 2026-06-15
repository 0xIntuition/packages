import { buildAtomData, buildAtomDataObject } from '@0xintuition/classifications';
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';
import { calculateAtomId, calculateTripleId } from '@0xintuition/ids';
import { sampleValues } from './package-lifecycle.js';

type HexString = `0x${string}`;

export const identityCandidates = [
	{
		label: 'Spotify track URL',
		url: 'https://open.spotify.com/track/one-more-time',
		confidence: 10,
		source: 'spotify',
		verdict: 'canonical provider URL',
	},
	{
		label: 'Apple Music song URL',
		url: 'https://music.apple.com/us/song/one-more-time',
		confidence: 9,
		source: 'apple-music',
		verdict: 'strict identity candidate',
	},
	{
		label: 'MusicBrainz recording',
		url: 'https://musicbrainz.org/recording/one-more-time',
		confidence: 8,
		source: 'musicbrainz',
		verdict: 'global identifier evidence',
	},
	{
		label: 'Review article',
		url: 'https://example.com/reviews/daft-punk-discovery',
		confidence: 4,
		source: 'web',
		verdict: 'related content, not sameAs',
	},
] as const;

const acceptedPayloadUrls = identityCandidates
	.filter((candidate) => candidate.confidence >= 8)
	.map((candidate) => candidate.url);

export const preActivationIdentity = {
	plainAtomData: buildAtomDataObject('music-recording', sampleValues),
	plainAtomDataString: buildAtomData('music-recording', sampleValues),
	enrichedAtomData: buildAtomDataObject('music-recording', {
		...sampleValues,
		sameAs: acceptedPayloadUrls,
	}),
	enrichedAtomDataString: buildAtomData('music-recording', {
		...sampleValues,
		sameAs: acceptedPayloadUrls,
	}),
};

export const preActivationIds = {
	plainAtomId: calculateAtomId(preActivationIdentity.plainAtomDataString),
	enrichedAtomId: calculateAtomId(preActivationIdentity.enrichedAtomDataString),
};

const spotifyAtomData = buildAtomData('music-recording', {
	...sampleValues,
	sameAs: ['https://open.spotify.com/track/one-more-time'],
});
const appleMusicAtomData = buildAtomData('music-recording', {
	...sampleValues,
	sameAs: ['https://music.apple.com/us/song/one-more-time'],
});
const spotifyAtomId = calculateAtomId(spotifyAtomData);
const appleMusicAtomId = calculateAtomId(appleMusicAtomData);
const sameAsPredicateId = getRequiredPredicateId('sameAs');

export const postActivationIdentity = {
	spotifyAtom: {
		label: 'One More Time on Spotify',
		id: spotifyAtomId,
		data: JSON.parse(spotifyAtomData) as Record<string, unknown>,
	},
	appleMusicAtom: {
		label: 'One More Time on Apple Music',
		id: appleMusicAtomId,
		data: JSON.parse(appleMusicAtomData) as Record<string, unknown>,
	},
	sameAsTriple: {
		subject: spotifyAtomId,
		predicate: sameAsPredicateId,
		object: appleMusicAtomId,
		id: calculateTripleId(spotifyAtomId, sameAsPredicateId, appleMusicAtomId),
	},
};

export const identityCodeExamples = {
	preActivation: `import { buildAtomData } from '@0xintuition/classifications';
import { calculateAtomId } from '@0xintuition/ids';

const atomData = buildAtomData('music-recording', {
  name: 'One More Time',
  byArtist: 'Daft Punk',
  inAlbum: 'Discovery',
  sameAs: [
    'https://open.spotify.com/track/one-more-time',
    'https://music.apple.com/us/song/one-more-time',
  ],
});

const atomId = calculateAtomId(atomData);`,
	postActivation: `import { calculateTripleId } from '@0xintuition/ids';
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';

const sameAsPredicate = musicRecordingCreationProfile.relationships.find(
  (relationship) => relationship.predicate.key === 'sameAs'
);

if (!sameAsPredicate) {
  throw new Error('Missing sameAs relationship.');
}

const sameAsTriple = {
  subject: spotifyAtomId,
  predicate: sameAsPredicate.predicate.id,
  object: appleMusicAtomId,
  id: calculateTripleId(
    spotifyAtomId,
    sameAsPredicate.predicate.id,
    appleMusicAtomId
  ),
};`,
};

function getRequiredPredicateId(predicateKey: string): HexString {
	const relationship = musicRecordingCreationProfile.relationships.find(
		(candidate) => candidate.predicate.key === predicateKey
	);

	if (!relationship) {
		throw new Error(`Missing relationship "${predicateKey}" on music-recording Creation Profile.`);
	}

	return relationship.predicate.id as HexString;
}
