import {
	fetchProviderJson,
	getWikimediaRequestSlot,
	isWikimediaMiss,
	type PinAwareFetch,
	ProviderHttpError,
	rejectMediaWikiActionApiError,
	WIKIMEDIA_STATUS_OUTCOMES,
	WIKIMEDIA_USER_AGENT,
	withoutMediaWikiApiError,
} from '@0xintuition/atom-enrichment/provider-fetch';
import { derivePodcastGuid, getScheme, normalizePodcastFeedUrl } from '@0xintuition/iid';
import {
	IDENTITY_CATEGORY_RUNG_POLICY,
	type IdentityCategory,
	iidForIdentityRung,
	pickWikidataLabel,
	projectIdentifierLadder,
	resolveWikidataP31Identity,
} from '@0xintuition/iid-ladder';
import { emitProviderEvent } from '@0xintuition/pipeline-runtime/provider-observer';
import { beginObservedRequest } from '@0xintuition/pipeline-runtime/provider-request-observation';
import {
	type RequestSlot,
	RequestSlotTimeoutError,
	SLOT_REFUSAL_RETRY_MAX_MS,
	slotRefusalOf,
} from '@0xintuition/pipeline-runtime/request-slot';
import { z } from 'zod/v4';
import type { AcquisitionOutcome } from './acquisition-outcome';
import { normalizeClassificationIdentifiers } from './collect-atom-identifiers';
import { TMDB_UNAVAILABLE_COPY } from './plugins/tmdb';
import {
	entityHasExactExternalId,
	extractWikidataP31,
	pickWikidataEntity,
} from './plugins/wikidata/entity-data';
import type { ClassificationResult } from './types';

const WIKIDATA_SEARCH_URL = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_ENTITY_DATA_URL = 'https://www.wikidata.org/wiki/Special:EntityData';
const MAX_SEARCH_BYTES = 256 * 1024;
const MAX_ENTITY_DATA_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 3_000;
const SPOTIFY_BRIDGE_BUDGET_MS = 1_000;
const DEFAULT_CACHE_MAX_ENTRIES = 500;
const DEFAULT_CACHE_TTL_MS = 5 * 60_000;
const DEFAULT_FAILURE_TTL_MS = 30_000;
/**
 * Qualifiers that annotate an external-id claim without changing what it
 * identifies (subject named as, object named as, identifier shared with,
 * retrieved). Anything else (time bounds, deprecation reasons, applies-to-part)
 * still disqualifies the claim.
 */
const BENIGN_CLAIM_QUALIFIERS: ReadonlySet<string> = new Set(['P1810', 'P1932', 'P4070', 'P813']);
const DEFAULT_QUEUE_MAX_ENTRIES = 32;
const QID_PATTERN = /^Q[1-9]\d*$/;
const DISAMBIGUATION_QID = 'Q4167410';

type BridgeTarget = {
	property: 'P345' | 'P4947' | 'P4983' | 'P1902' | 'P2205' | 'P5916';
	value: string;
	wdSlug?: 'film' | 'television-series';
	category?: IdentityCategory;
};

type WikidataPresentation = { description?: string; image?: string; title?: string };

type AuthoritativeOutcome =
	/** `stage` is the hop that found nothing; it picks the operation a cached miss is recorded under. */
	| { kind: 'miss'; stage: 'search' | 'entity' }
	| ({
			kind: 'promotion';
			qid: string;
			identifiers?: Record<string, string>;
	  } & WikidataPresentation);

type LookupOutcome =
	| AuthoritativeOutcome
	| { kind: 'aborted' | 'backpressure' }
	| { kind: 'timeout' | 'transient'; retryAfterMs?: number };

type CacheEntry = { expiresAt: number; value: AuthoritativeOutcome };
type FailureEntry = {
	attempts: number;
	expiresAt: number;
	retryAt: number;
	kind: 'timeout' | 'transient';
};

export type WikidataIdentityBridgeOptions = {
	cacheMaxEntries?: number;
	cacheTtlMs?: number;
	failureTtlMs?: number;
	/**
	 * Transport seam for fixtures: a pin-aware fetch (`createPinAwareFetch`). Any other fetcher, and
	 * the default, goes through the guarded pinned transport of the shared provider fetch (ENG-17014).
	 */
	fetch?: PinAwareFetch;
	/**
	 * Wikimedia `maxlag` in seconds, sent to `api.php` only (EntityData ignores it). Unset by
	 * default: the interactive create path leaves it out (Manual:Maxlag_parameter: "Interactive
	 * tasks may omit the maxlag parameter"), because with it every lookup is refused while the
	 * query service lags and the paste fails open to the provider handle. Non-interactive callers
	 * (the repair script) pass `WIKIMEDIA_MAXLAG_SECONDS`.
	 */
	maxlag?: number;
	/** Clock of the caches and failure backoff (the request deadlines are wall-clock epoch ms). */
	now?: () => number;
	/** Lookups that may wait their turn (the bridge's own cap; the shared slot allows more). */
	queueMaxEntries?: number;
	/**
	 * Test seam: a private slot. Production always spaces its requests on the process-wide Wikimedia
	 * slot, shared with enrichment (`getWikimediaRequestSlot()`).
	 */
	requestSlot?: RequestSlot;
	timeoutMs?: number;
};

export type WikidataIdentityBridge = (
	result: ClassificationResult,
	signal?: AbortSignal
) => Promise<ClassificationResult>;

export function createWikidataIdentityBridge(
	options: WikidataIdentityBridgeOptions = {}
): WikidataIdentityBridge {
	// Undefined: the shared provider fetch dials through its guarded pinned transport.
	const fetcher = options.fetch;
	const now = options.now ?? Date.now;
	const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
	const maxlag = options.maxlag;
	const requestSlot = options.requestSlot ?? getWikimediaRequestSlot();
	const maxEntries = options.cacheMaxEntries ?? DEFAULT_CACHE_MAX_ENTRIES;
	const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
	const failureTtlMs = options.failureTtlMs ?? DEFAULT_FAILURE_TTL_MS;
	const queueMaxEntries = options.queueMaxEntries ?? DEFAULT_QUEUE_MAX_ENTRIES;
	const cache = new Map<string, CacheEntry>();
	const failures = new Map<string, FailureEntry>();
	const inFlight = new Map<
		string,
		{
			controller: AbortController;
			promise: Promise<LookupOutcome>;
			settled: boolean;
			subscribers: number;
		}
	>();
	const queue: Array<{
		controller: AbortController;
		resolve: (outcome: LookupOutcome) => void;
		run: (signal: AbortSignal) => Promise<LookupOutcome>;
		started: boolean;
	}> = [];
	let queueActive = false;

	function schedule(
		run: (signal: AbortSignal) => Promise<LookupOutcome>,
		controller: AbortController
	): Promise<LookupOutcome> {
		if (controller.signal.aborted) return Promise.resolve({ kind: 'aborted' });
		if (queue.length >= queueMaxEntries) return Promise.resolve({ kind: 'backpressure' });
		return new Promise((resolve) => {
			const entry = { controller, resolve, run, started: false };
			const onAbort = () => {
				if (entry.started) return;
				const index = queue.indexOf(entry);
				if (index >= 0) queue.splice(index, 1);
				resolve({ kind: 'aborted' });
			};
			controller.signal.addEventListener('abort', onAbort, { once: true });
			queue.push(entry);
			pumpQueue();
		});
	}

	function pumpQueue(): void {
		if (queueActive) return;
		const entry = queue.shift();
		if (!entry) return;
		queueActive = true;
		entry.started = true;
		const execution = entry.controller.signal.aborted
			? Promise.resolve<LookupOutcome>({ kind: 'aborted' })
			: entry.run(entry.controller.signal);
		execution
			.catch((): LookupOutcome => ({ kind: 'transient' }))
			.then(entry.resolve)
			.finally(() => {
				queueActive = false;
				pumpQueue();
			});
	}

	/**
	 * One observed Wikidata hop through the shared provider fetch (guarded pinned transport, body cap,
	 * structured status), spaced by the process-wide Wikimedia slot that enrichment shares. The shared
	 * slotted observation records the duration from the dial, not the spacing wait, and what happens
	 * before it, with nothing dialled, is `budget_exhausted` (ENG-17085): a refused request (queue full,
	 * or it cannot start before the deadline), the bridge's own budget running out (its abort is the
	 * request's deadline) or the slot's own deadline timer; a caller that leaves records nothing. A
	 * request dialled and then overrun is a `timeout`, a real 429 / maxlag is `rate_limited`.
	 */
	async function observedHop<T>(
		operation: 'bridge_search' | 'bridge_entity',
		input: {
			classifyResult: (value: T) => 'hit' | 'miss';
			deadlineAtMs: number;
			maxResponseBytes: number;
			redirect: 'follow' | 'error';
			schema: z.ZodType<T>;
			signal: AbortSignal;
			url: URL;
		}
	): Promise<T> {
		// Only `api.php` has `maxlag` (EntityData ignores it) and reports its errors as HTTP 200.
		const actionApi = operation === 'bridge_search';
		if (actionApi && maxlag !== undefined) input.url.searchParams.set('maxlag', String(maxlag));
		return await fetchProviderJson<T, 'wikidata'>({
			url: input.url.toString(),
			fetch: fetcher,
			userAgent: WIKIMEDIA_USER_AGENT,
			redirect: input.redirect,
			signal: input.signal,
			deadlineAtMs: input.deadlineAtMs,
			slot: requestSlot,
			maxResponseBytes: input.maxResponseBytes,
			...(actionApi ? { rejectOk: rejectMediaWikiActionApiError } : {}),
			schema: actionApi ? withoutMediaWikiApiError(input.schema) : input.schema,
			observe: {
				provider: 'wikidata',
				operation,
				statusOutcomes: WIKIMEDIA_STATUS_OUTCOMES,
				classifyResult: input.classifyResult,
			},
		});
	}

	async function executeLookup(
		target: BridgeTarget,
		signal: AbortSignal,
		totalDeadlineAtMs?: number
	): Promise<LookupOutcome> {
		const budgetMs = target.category ? Math.min(timeoutMs, SPOTIFY_BRIDGE_BUDGET_MS) : timeoutMs;
		const deadlineAtMs = Math.min(
			Date.now() + budgetMs,
			totalDeadlineAtMs ?? Number.POSITIVE_INFINITY
		);
		const deadlineController = new AbortController();
		const deadline = setTimeout(() => deadlineController.abort(new BridgeBudgetError()), budgetMs);
		const lookupSignal = combineAbortSignals(signal, deadlineController.signal);
		const redirect = target.category ? 'error' : 'follow';
		try {
			const url = new URL(WIKIDATA_SEARCH_URL);
			url.searchParams.set('action', 'query');
			url.searchParams.set('list', 'search');
			url.searchParams.set('srsearch', `haswbstatement:${target.property}=${target.value}`);
			url.searchParams.set('format', 'json');
			const search = await observedHop('bridge_search', {
				url,
				signal: lookupSignal,
				deadlineAtMs,
				redirect,
				maxResponseBytes: MAX_SEARCH_BYTES,
				schema: searchResponseSchema,
				classifyResult: (value) => (value.qid ? 'hit' : 'miss'),
			});
			if (!search.qid) return { kind: 'miss', stage: 'search' };
			const entityUrl = new URL(`${WIKIDATA_ENTITY_DATA_URL}/${search.qid}.json`);
			const entityData = await observedHop('bridge_entity', {
				url: entityUrl,
				signal: lookupSignal,
				deadlineAtMs,
				redirect,
				maxResponseBytes: MAX_ENTITY_DATA_BYTES,
				schema: entityDataSchema(search.qid),
				classifyResult: (value) => (entityOwnsTarget(value.entity, target) ? 'hit' : 'miss'),
			});
			if (!entityOwnsTarget(entityData.entity, target)) return { kind: 'miss', stage: 'entity' };
			return {
				kind: 'promotion',
				qid: entityData.qid,
				...(target.category
					? { identifiers: bridgeClaimIdentifiers(target, entityData.entity) }
					: {}),
				...wikidataPresentation(entityData.entity),
			};
		} catch (error) {
			if (deadlineController.signal.aborted) return { kind: 'timeout' };
			if (signal.aborted) return { kind: 'aborted' };
			// The shared slot refused the request: it cannot start before the deadline (a timeout), or
			// its queue is full (a fault to retry later). Nothing was dialled either way.
			// Either way the slot says when it has room (`retryAfterMs`); the failure entry honors it
			// like a server's Retry-After, so a refused lookup is not retried while the slot is still full.
			const refusal = slotRefusalOf(error);
			if (refusal) {
				return {
					kind: refusal.reason === 'queue_full' ? 'transient' : 'timeout',
					// The slot's hint is a lower bound for when it has room, not a promise: clamp it with the
					// ceiling the engine uses, so one odd hint cannot park a lookup for minutes. (A server's
					// own Retry-After is not clamped here: it always wins, below.)
					...(refusal.retryAfterMs === undefined
						? {}
						: { retryAfterMs: Math.min(SLOT_REFUSAL_RETRY_MAX_MS, refusal.retryAfterMs) }),
				};
			}
			if (error instanceof RequestSlotTimeoutError) return { kind: 'timeout' };
			if (error instanceof ProviderHttpError) {
				// The EntityData of an item that does not exist: a real miss, not a fault.
				if (isWikimediaMiss(error)) return { kind: 'miss', stage: 'entity' };
				return {
					kind: 'transient',
					...(error.retryAfterMs === undefined ? {} : { retryAfterMs: error.retryAfterMs }),
				};
			}
			return { kind: 'transient' };
		} finally {
			clearTimeout(deadline);
		}
	}

	/** The lookup was answered without a request: its cached or shared answer stands in for the hop. */
	function observeAnswerWithoutRequest(outcome: AuthoritativeOutcome, signal?: AbortSignal): void {
		const operation =
			outcome.kind === 'miss' && outcome.stage === 'search' ? 'bridge_search' : 'bridge_entity';
		beginObservedRequest({
			provider: 'wikidata',
			operation,
			context: { signal },
			source: 'cache',
		})?.settle({ outcome: outcome.kind === 'miss' ? 'miss' : 'hit', reason: 'none' });
	}

	async function resolveTarget(target: BridgeTarget, signal?: AbortSignal): Promise<LookupOutcome> {
		const key = `${target.property}:${target.value}`;
		const cached = cache.get(key);
		if (cached && cached.expiresAt > now()) {
			cache.delete(key);
			cache.set(key, cached);
			observeAnswerWithoutRequest(cached.value, signal);
			return cached.value;
		}
		if (cached) cache.delete(key);
		const failure = failures.get(key);
		if (failure && failure.expiresAt <= now()) failures.delete(key);
		else if (failure && failure.retryAt > now()) return { kind: failure.kind };

		let pending = inFlight.get(key);
		const joined = pending !== undefined;
		if (!pending) {
			const controller = new AbortController();
			// Spotify's total budget includes queueing and request spacing.
			let deadlineExpired = false;
			let started = false;
			const totalDeadlineAtMs = target.category
				? Date.now() + Math.min(timeoutMs, SPOTIFY_BRIDGE_BUDGET_MS)
				: undefined;
			const deadline = target.category
				? setTimeout(
						() => {
							deadlineExpired = true;
							controller.abort(new BridgeBudgetError());
						},
						Math.min(timeoutMs, SPOTIFY_BRIDGE_BUDGET_MS)
					)
				: undefined;
			pending = {
				controller,
				promise: raceWithAbort(
					schedule((taskSignal) => {
						started = true;
						return executeLookup(target, taskSignal, totalDeadlineAtMs);
					}, controller),
					controller.signal
				)
					.catch((): LookupOutcome => {
						// The budget ran out while the lookup still waited its turn: our own queue spent it and
						// nothing was dialled, so it is local backpressure, not a Wikimedia timeout.
						if (deadlineExpired && !started) observeBudgetExhausted('bridge_search');
						return { kind: deadlineExpired ? 'timeout' : 'aborted' };
					})
					.finally(() => clearTimeout(deadline)),
				settled: false,
				subscribers: 0,
			};
			inFlight.set(key, pending);
			pending.promise
				.then((outcome) => {
					if (outcome.kind === 'backpressure') {
						// Our own queue was full: nothing was dialled, which says nothing about Wikimedia.
						observeBudgetExhausted('bridge_search');
					} else if (outcome.kind === 'promotion' || outcome.kind === 'miss') {
						failures.delete(key);
						cache.set(key, {
							expiresAt: now() + (outcome.kind === 'miss' ? failureTtlMs : cacheTtlMs),
							value: outcome,
						});
						trimCache(cache, maxEntries);
					} else if (outcome.kind === 'transient' || outcome.kind === 'timeout') {
						const priorAttempts = failures.get(key)?.attempts ?? 0;
						const attempts = priorAttempts + 1;
						const exponentialMs = Math.min(30_000, 250 * 2 ** (attempts - 1));
						const retryAfterMs = outcome.retryAfterMs ?? 0;
						// A server-sent Retry-After always wins over the local window: the
						// entry neither retries nor expires before the server's own deadline.
						const retryDelayMs = Math.max(
							outcome.kind === 'timeout' || target.category
								? failureTtlMs
								: Math.max(exponentialMs, retryAfterMs),
							retryAfterMs
						);
						failures.set(key, {
							kind: outcome.kind,
							attempts,
							expiresAt: now() + Math.max(failureTtlMs, retryDelayMs),
							retryAt: now() + retryDelayMs,
						});
						trimCache(failures, maxEntries);
					}
				})
				.finally(() => {
					if (pending) pending.settled = true;
					inFlight.delete(key);
				});
		}

		pending.subscribers += 1;
		try {
			const outcome = await raceWithAbort(pending.promise, signal);
			// A caller that joined another's lookup got its answer without a request of its own.
			if (joined && (outcome.kind === 'promotion' || outcome.kind === 'miss')) {
				observeAnswerWithoutRequest(outcome, signal);
			}
			return outcome;
		} catch {
			return { kind: 'aborted' };
		} finally {
			pending.subscribers -= 1;
			if (pending.subscribers === 0 && !pending.settled && signal?.aborted) {
				pending.controller.abort(signal.reason);
			}
		}
	}

	return async (result, signal) => {
		const resolved = result.resolved;
		if (!resolved || resolved.atoms.length === 0) return result;
		const promoted = await Promise.all(
			resolved.atoms.map(async (atom) => {
				const sourceCanonicalId = atom.canonicalId;
				const directTmdb = isDirectTmdbAtom(atom);
				const bridgeEligible = atom.metadata?.identityBridgeEligible !== false;
				const target = bridgeEligible
					? bridgeTargetForCanonicalId(sourceCanonicalId, atom.schemaType)
					: undefined;
				if (!(sourceCanonicalId && target)) {
					return {
						atom,
						directTmdb: false,
						presentation: {},
						sourceCanonicalId: undefined,
						strongIid: undefined,
						terminal: false,
					};
				}
				const outcome = await resolveTarget(target, signal);
				if (outcome.kind !== 'promotion') {
					const skippedReason =
						outcome.kind === 'backpressure'
							? 'bridge_backpressure'
							: outcome.kind === 'timeout'
								? 'bridge_timeout'
								: outcome.kind === 'aborted'
									? 'bridge_aborted'
									: undefined;
					const skippedAtom = {
						...(skippedReason ? withSkippedStage(atom, skippedReason) : atom),
						...(target.category
							? {
									metadata: {
										...(skippedReason
											? withSkippedStage(atom, skippedReason).metadata
											: atom.metadata),
										identityBridge: {
											property: target.property,
											providerCanonicalId: sourceCanonicalId,
											outcome: outcome.kind,
											promotionPending: true,
										},
									},
								}
							: {}),
					};
					return directTmdb
						? {
								atom: withTmdbTerminalOutcome(skippedAtom, outcome.kind),
								directTmdb,
								presentation: {},
								sourceCanonicalId,
								strongIid: undefined,
								terminal: true,
							}
						: {
								atom: skippedAtom,
								directTmdb,
								presentation: {},
								sourceCanonicalId: undefined,
								strongIid: undefined,
								terminal: false,
							};
				}
				const identifiers = {
					wd: outcome.qid,
					...outcome.identifiers,
					...(target.wdSlug ? { wdSlug: target.wdSlug } : {}),
				};
				const strongIid = target.category
					? IDENTITY_CATEGORY_RUNG_POLICY[target.category].flatMap((rung) => {
							const value = identifiers[rung.split(':')[0] as keyof typeof identifiers];
							const iid = value ? iidForIdentityRung(rung, value, atom.schemaType) : undefined;
							return iid ? [iid] : [];
						})[0]
					: projectIdentifierLadder({
							strongIdentifiers: identifiers,
							strongIdentifierOrder: ['wd'],
						}).iid;
				const ladder = { iid: strongIid };
				if (!ladder.iid) {
					return {
						atom,
						directTmdb,
						presentation: {},
						sourceCanonicalId: undefined,
						strongIid: undefined,
						terminal: false,
					};
				}
				const wikidataUrl = `https://www.wikidata.org/wiki/${outcome.qid}`;
				const sameAs = uniqueStrings([
					...(atom.sameAs ?? []),
					providerUrlForCanonicalId(sourceCanonicalId),
					wikidataUrl,
					...(outcome.identifiers?.mbid
						? [`https://musicbrainz.org/${outcome.identifiers.mbid.replace(':', '/')}`]
						: []),
					...(outcome.identifiers?.isni
						? [`https://isni.org/isni/${outcome.identifiers.isni}`]
						: []),
					outcome.identifiers?.feedUrl,
				]);
				const data = directTmdb
					? withoutReplacedPresentationFields(atom.data, outcome)
					: { ...atom.data };
				Object.assign(data, {
					identifier: ladder.iid,
					sameAs,
					...(outcome.title ? { name: outcome.title } : {}),
					...(outcome.description ? { description: outcome.description } : {}),
					...(outcome.image ? { image: outcome.image } : {}),
				});
				return {
					sourceCanonicalId,
					strongIid: ladder.iid,
					directTmdb,
					presentation: {
						...(outcome.title ? { title: outcome.title } : {}),
						...(outcome.description ? { description: outcome.description } : {}),
						...(outcome.image ? { image: outcome.image } : {}),
					},
					terminal: false,
					atom: {
						...atom,
						...(outcome.title ? { title: outcome.title } : {}),
						...(outcome.description ? { description: outcome.description } : {}),
						canonicalId: ladder.iid,
						sameAs,
						hints: {
							...atom.hints,
							providerCanonicalIds: uniqueStrings([
								...stringArray(atom.hints?.providerCanonicalIds),
								sourceCanonicalId,
							]),
							identifiers: {
								...recordValue(atom.hints?.identifiers),
								...identifiers,
								wd: outcome.qid,
								wikidata: outcome.qid,
								wdSlug: target.wdSlug,
							},
						},
						metadata: {
							...atom.metadata,
							identityBridge: {
								property: target.property,
								providerCanonicalId: sourceCanonicalId,
								qid: outcome.qid,
								...(target.category ? { outcome: 'hit', promotionPending: false } : {}),
							},
						},
						data,
					},
				};
			})
		);
		const replacements = new Map(
			promoted.flatMap(({ sourceCanonicalId, strongIid, atom, directTmdb, presentation }) =>
				sourceCanonicalId && strongIid
					? [
							[
								sourceCanonicalId,
								{
									strongIid,
									sameAs: atom.sameAs ?? [],
									presentation,
									replacePresentation: directTmdb,
								},
							] as const,
						]
					: []
			)
		);
		const terminalProviderIds = new Set(
			promoted.flatMap(({ sourceCanonicalId, terminal }) =>
				terminal && sourceCanonicalId ? [sourceCanonicalId] : []
			)
		);
		return {
			...result,
			resolved: {
				...resolved,
				atoms: promoted.map(({ atom }) => atom),
				classifications: resolved.classifications
					.filter((entry) => !terminalProviderIds.has(identifierFromEnvelope(entry)))
					.map((entry) => promoteEnvelope(entry, replacements)),
				publishable: resolved.publishable
					.filter((entry) => !terminalProviderIds.has(identifierFromEnvelope(entry)))
					.map((entry) => promoteEnvelope(entry, replacements)),
			},
		};
	};
}

let defaultBridge: WikidataIdentityBridge | undefined;

/**
 * Test seam for the process-wide bridge behind {@link bridgeClassificationIdentity} (the api
 * `classification.process` path): installs a bridge built from `options`, or drops it so the next
 * call builds the default one. The shared provider fetch ignores a replaced `globalThis.fetch`, so a
 * test that drives the real procedure hands its pin-aware fetch in here.
 */
export function resetDefaultWikidataIdentityBridgeForTests(
	options?: WikidataIdentityBridgeOptions
): void {
	defaultBridge = options ? createWikidataIdentityBridge(options) : undefined;
}

export async function bridgeClassificationIdentity(
	result: ClassificationResult,
	signal?: AbortSignal
): Promise<ClassificationResult> {
	defaultBridge ??= createWikidataIdentityBridge();
	return normalizeClassificationIdentifiers(await defaultBridge(result, signal));
}

function bridgeTargetForCanonicalId(
	canonicalId: string | undefined,
	schemaType: string
): BridgeTarget | undefined {
	const spotify = canonicalId?.match(/^(?:int:)?spotify:(album|artist|show):([A-Za-z0-9]{22})$/u);
	if (spotify?.[2]) {
		const targets = {
			album: { property: 'P2205', category: 'music-album', schemaType: 'MusicAlbum' },
			artist: { property: 'P1902', category: 'artist', schemaType: 'MusicGroup' },
			show: { property: 'P5916', category: 'podcast-series', schemaType: 'PodcastSeries' },
		} as const;
		const target = targets[spotify[1] as keyof typeof targets];
		if (target.schemaType === schemaType)
			return { property: target.property, category: target.category, value: spotify[2] };
	}
	let match = canonicalId?.match(/^tmdb:movie:([1-9]\d*)$/);
	if (match?.[1]) return { property: 'P4947', value: match[1], wdSlug: 'film' };
	match = canonicalId?.match(/^tmdb:tv:([1-9]\d*)$/);
	if (match?.[1]) {
		return { property: 'P4983', value: match[1], wdSlug: 'television-series' };
	}
	match = canonicalId?.match(/^imdb:title:(tt\d{6,})$/i);
	if (match?.[1]) {
		return {
			property: 'P345',
			value: match[1].toLowerCase(),
			wdSlug: schemaType === 'TVSeries' ? 'television-series' : 'film',
		};
	}
	return undefined;
}

/** Only direct, non-deprecated claims (benign qualifiers allowed) on the exact provider owner count. */
function bridgeClaimIdentifiers(
	target: BridgeTarget,
	entity: Record<string, unknown>
): Record<string, string> {
	const claims = recordValue(entity.claims);
	const unique = (property: string): string | undefined => {
		const entries = Array.isArray(claims[property]) ? claims[property] : [];
		const usable = entries
			.map(recordValue)
			.filter(
				(claim) =>
					claim.rank !== 'deprecated' &&
					Object.keys(recordValue(claim.qualifiers)).every((qualifier) =>
						BENIGN_CLAIM_QUALIFIERS.has(qualifier)
					)
			);
		const preferred = usable.filter((claim) => claim.rank === 'preferred');
		const values = uniqueStrings(
			(preferred.length ? preferred : usable)
				.map((claim) => recordValue(recordValue(claim.mainsnak).datavalue).value)
				.filter((value): value is string => typeof value === 'string')
		);
		return values.length === 1 ? values[0] : undefined;
	};
	const result: Record<string, string> = {};
	const add = (scheme: string, value: string | undefined) => {
		const canonical = value && getScheme(scheme)?.canonicalize(value);
		if (canonical) result[scheme] = canonical;
	};
	if (target.category === 'artist') {
		add('isni', unique('P213'));
		const mbid = unique('P434');
		add('mbid', mbid && (mbid.includes(':') ? mbid : `artist:${mbid}`));
		if (result.mbid && !result.mbid.startsWith('artist:')) delete result.mbid;
	}
	if (target.category === 'music-album') {
		const mbid = unique('P436');
		add('mbid', mbid && (mbid.includes(':') ? mbid : `release-group:${mbid}`));
		if (result.mbid && !result.mbid.startsWith('release-group:')) delete result.mbid;
	}
	if (target.category === 'podcast-series') {
		const feedUrl = unique('P1019');
		if (feedUrl && /^https?:\/\//u.test(feedUrl) && getScheme('url')?.canonicalize(feedUrl)) {
			result.feedUrl = feedUrl;
			add('podcastguid', derivePodcastGuid(normalizePodcastFeedUrl(feedUrl)));
		}
		const itunesId = unique('P5842');
		if (itunesId && /^[1-9]\d*$/u.test(itunesId)) result.itunesId = itunesId;
	}
	return result;
}

function withSkippedStage<T extends { metadata?: Record<string, unknown> }>(
	atom: T,
	reason: 'bridge_aborted' | 'bridge_backpressure' | 'bridge_timeout'
): T {
	return {
		...atom,
		metadata: {
			...atom.metadata,
			skippedStages: uniqueStrings([...stringArray(atom.metadata?.skippedStages), reason]),
		},
	};
}

function promoteEnvelope<T extends { data: Record<string, unknown> }>(
	envelope: T,
	replacements: ReadonlyMap<
		string,
		{
			presentation: WikidataPresentation;
			replacePresentation: boolean;
			sameAs: readonly string[];
			strongIid: string;
		}
	>
): T {
	const identifier = identifierFromEnvelope(envelope);
	const replacement = replacements.get(identifier);
	const data = replacement?.replacePresentation
		? withoutReplacedPresentationFields(envelope.data, replacement.presentation)
		: { ...envelope.data };
	if (replacement) {
		Object.assign(data, {
			identifier: replacement.strongIid,
			sameAs: [...replacement.sameAs],
			...(replacement.presentation.title ? { name: replacement.presentation.title } : {}),
			...(replacement.presentation.description
				? { description: replacement.presentation.description }
				: {}),
			...(replacement.presentation.image ? { image: replacement.presentation.image } : {}),
		});
	}
	return replacement
		? {
				...envelope,
				data,
			}
		: envelope;
}

function identifierFromEnvelope(envelope: { data: Record<string, unknown> }): string {
	return typeof envelope.data.identifier === 'string' ? envelope.data.identifier : '';
}

function isDirectTmdbAtom(atom: {
	canonicalId?: string;
	metadata?: Record<string, unknown>;
	source?: string;
}): boolean {
	if (!atom.canonicalId?.startsWith('tmdb:')) return false;
	return atom.metadata?.platform === 'tmdb' || atom.metadata?.provider === 'tmdb';
}

function withoutReplacedPresentationFields(
	data: Record<string, unknown>,
	presentation: WikidataPresentation
): Record<string, unknown> {
	const sanitized = withoutPresentationFields(data);
	const retainedKeys = [
		...(!presentation.title ? ['name', 'title'] : []),
		...(!presentation.description ? ['description'] : []),
	];
	for (const key of retainedKeys) {
		if (key in data) sanitized[key] = data[key];
	}
	return sanitized;
}

function withoutPresentationFields(data: Record<string, unknown>): Record<string, unknown> {
	const sanitized = { ...data };
	for (const key of ['description', 'image', 'name', 'title']) {
		delete sanitized[key];
	}
	return sanitized;
}

function withTmdbTerminalOutcome<
	T extends {
		data: Record<string, unknown>;
		metadata?: Record<string, unknown>;
		title: string;
	},
>(atom: T, outcome: Exclude<LookupOutcome['kind'], 'promotion'>): T {
	const status = outcome === 'miss' ? 'unavailable' : 'degraded';
	const reason =
		outcome === 'miss'
			? 'identity_bridge_not_found'
			: outcome === 'timeout'
				? 'bridge_timeout'
				: `identity_bridge_${outcome}`;
	const acquisitionOutcome = {
		reason,
		status,
		terminal: true,
	} satisfies AcquisitionOutcome;
	return {
		...atom,
		title: TMDB_UNAVAILABLE_COPY,
		metadata: {
			...atom.metadata,
			acquisitionOutcome,
		},
		data: withoutPresentationFields(atom.data),
	};
}

function wikidataPresentation(entity: Record<string, unknown>): WikidataPresentation {
	const title = localizedWikidataValue(entity.labels);
	const description = localizedWikidataValue(entity.descriptions);
	const imageFile = firstWikidataStringClaim(entity, 'P18');
	return {
		...(title ? { title } : {}),
		...(description ? { description } : {}),
		...(imageFile
			? {
					image: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(imageFile)}`,
				}
			: {}),
	};
}

function localizedWikidataValue(value: unknown): string | undefined {
	return pickWikidataLabel(recordValue(value));
}

function firstWikidataStringClaim(
	entity: Record<string, unknown>,
	property: string
): string | undefined {
	const statements = recordValue(entity.claims)[property];
	if (!Array.isArray(statements)) return undefined;
	for (const statement of statements) {
		const value = recordValue(recordValue(recordValue(statement).mainsnak).datavalue).value;
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	return undefined;
}

function providerUrlForCanonicalId(canonicalId: string): string | undefined {
	let match = canonicalId.match(/^tmdb:(movie|tv):([1-9]\d*)$/);
	if (match?.[1] && match[2]) {
		return `https://www.themoviedb.org/${match[1]}/${match[2]}`;
	}
	match = canonicalId.match(/^imdb:title:(tt\d{6,})$/i);
	return match?.[1] ? `https://www.imdb.com/title/${match[1].toLowerCase()}/` : undefined;
}

function combineAbortSignals(left: AbortSignal | undefined, right: AbortSignal): AbortSignal {
	if (!left) return right;
	if (typeof AbortSignal.any === 'function') return AbortSignal.any([left, right]);
	const controller = new AbortController();
	for (const signal of [left, right]) {
		if (signal.aborted) {
			controller.abort(signal.reason);
			break;
		}
		signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
	}
	return controller.signal;
}

function raceWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
	if (!signal) return promise;
	if (signal.aborted) return Promise.reject(signal.reason);
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(signal.reason);
		signal.addEventListener('abort', onAbort, { once: true });
		promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
	});
}

function trimCache<T>(cache: Map<string, T>, maxEntries: number): void {
	while (cache.size > maxEntries) {
		const oldest = cache.keys().next().value;
		if (typeof oldest !== 'string') return;
		cache.delete(oldest);
	}
}

function uniqueStrings(values: readonly (string | undefined)[]): string[] {
	return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
		: [];
}

function recordValue(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

/**
 * The abort reason of the bridge's own time budget (a lookup's 3 s, or Spotify's 1 s total). The
 * reason, not a clock comparison, tells a request refused for lack of budget from a caller who left.
 */
class BridgeBudgetError extends Error {
	constructor() {
		super('Wikidata bridge budget exhausted.');
	}
}

/**
 * Counts a lookup refused by the bridge's OWN queue or budget before it reached the shared slot
 * (the slot's refusals are recorded by the shared slotted observation): nothing was dialled, so
 * no duration.
 */
function observeBudgetExhausted(operation: 'bridge_search' | 'bridge_entity'): void {
	emitProviderEvent({
		type: 'provider_request',
		provider: 'wikidata',
		operation,
		outcome: 'budget_exhausted',
		reason: 'none',
		source: 'live',
	});
}

/**
 * CirrusSearch reply: the single hit's QID, or none for zero or several hits (raw hits are counted
 * before the sole result is validated). A MediaWiki API error body never reaches it (the hop wraps
 * it in `withoutMediaWikiApiError`, which gives each error code its meaning); a body of the wrong
 * shape (or a sole hit that is no QID) is an invalid response.
 */
const searchResponseSchema = z.unknown().transform((payload, ctx): { qid: string | undefined } => {
	const search = recordValue(recordValue(payload).query).search;
	if (!Array.isArray(search)) {
		ctx.issues.push({ code: 'custom', message: 'no search list', input: payload });
		return z.NEVER;
	}
	if (search.length !== 1) return { qid: undefined };
	const title = recordValue(search[0]).title;
	if (typeof title !== 'string' || !QID_PATTERN.test(title)) {
		ctx.issues.push({ code: 'custom', message: 'search hit is no QID', input: payload });
		return z.NEVER;
	}
	return { qid: title };
});

/**
 * EntityData reply: the entity of the requested QID, or of the QID it was redirected to (a merged
 * item answers under its target). A missing, invalid or deleted entity is an invalid response.
 */
function entityDataSchema(requestedQid: string) {
	return z.unknown().transform((payload, ctx): { entity: Record<string, unknown>; qid: string } => {
		const picked = pickWikidataEntity(payload, requestedQid);
		if (picked) return picked;
		ctx.issues.push({ code: 'custom', message: 'no usable entity', input: payload });
		return z.NEVER;
	});
}

/** The item must be no disambiguation page, of the expected type, and own the exact provider id. */
function entityOwnsTarget(entity: Record<string, unknown>, target: BridgeTarget): boolean {
	const p31 = extractWikidataP31(entity);
	const identity = resolveWikidataP31Identity(p31);
	return !(
		p31.includes(DISAMBIGUATION_QID) ||
		(target.wdSlug && identity.wdSlug !== target.wdSlug) ||
		!entityHasExactExternalId(entity, target.property, target.value)
	);
}
