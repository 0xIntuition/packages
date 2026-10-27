import type { ResolverAtom } from '../../plugins';
import { toStringMaybe, withPlatformMetadata } from '../shared/helpers';
import {
	buildOpenLibraryWorkAtom,
	createOpenLibraryLookupDeadlineAtMs,
	type OpenLibraryWorkLookupCandidate,
	type OpenLibraryWorkLookupHit,
	type OpenLibraryWorkLookupOptions,
	type OpenLibraryWorkLookupQuery,
	type OpenLibraryWorkLookupResult,
	openLibraryLookupFailureError,
	resolveOpenLibraryWork,
} from '../shared/openlibrary-lookup';
import {
	createPlatformStageOutcome,
	PLATFORM_STAGE_MISS,
	type PlatformStageAdapter,
} from '../shared/platform';

export type GoodreadsOpenLibraryAdapterOptions = OpenLibraryWorkLookupOptions & {
	firstStageWaitMs?: number;
};
export type GoodreadsOpenLibraryAdapter = PlatformStageAdapter;

const candidatesByClassification = new WeakMap<object, OpenLibraryWorkLookupCandidate[]>();

export function takeGoodreadsOpenLibraryCandidates(
	classification: object
): OpenLibraryWorkLookupCandidate[] | undefined {
	const candidates = candidatesByClassification.get(classification);
	candidatesByClassification.delete(classification);
	return candidates?.map((candidate) => ({ ...candidate }));
}

export const GOODREADS_OPENLIBRARY_LOOKUP_STATE = Symbol('goodreads-openlibrary-lookup-state');

export type GoodreadsOpenLibraryLookupState =
	| { deadlineAtMs: number; status: 'miss' }
	| { deadlineAtMs: number; status: 'failure'; timeout?: boolean }
	| GoodreadsPendingLookup;

export type GoodreadsPendingLookup = {
	kind: 'pending';
	status?: never;
	promise: Promise<OpenLibraryWorkLookupResult>;
	controller: AbortController;
	deadlineAtMs: number;
	result?: OpenLibraryWorkLookupResult;
};

export function startGoodreadsLookup(
	query: Exclude<OpenLibraryWorkLookupQuery, { kind: 'title' }>,
	options: OpenLibraryWorkLookupOptions & { deadlineAtMs: number }
): GoodreadsPendingLookup {
	const controller = new AbortController();
	const abort = () => controller.abort(options.signal?.reason);
	if (options.signal?.aborted) abort();
	else options.signal?.addEventListener('abort', abort, { once: true });
	const pending: GoodreadsPendingLookup = {
		kind: 'pending',
		controller,
		deadlineAtMs: options.deadlineAtMs,
		promise: resolveOpenLibraryWork(query, { ...options, signal: controller.signal })
			.then((result) => {
				pending.result = result;
				return result;
			})
			.finally(() => options.signal?.removeEventListener('abort', abort)),
	};
	return pending;
}

export function buildGoodreadsOpenLibraryWorkAtom(
	result: OpenLibraryWorkLookupHit,
	input: { bookId: string; canonicalUrl: string; stage?: 'domain-api' | 'opengraph' }
): ResolverAtom {
	const atom = withPlatformMetadata(
		buildOpenLibraryWorkAtom(result, {
			identifiers: { goodreadsBookId: input.bookId },
			providerCanonicalIds: [`goodreads:book:${input.bookId}`],
			sourceUrls: [input.canonicalUrl],
		}),
		'goodreads',
		'book',
		{
			pluginId: 'goodreads',
			provider: 'openlibrary',
			sourceUrl: result.workUrl,
		}
	);

	return {
		...atom,
		source: 'goodreads-openlibrary',
		metadata: {
			...atom.metadata,
			fallbackStage: input.stage ?? 'domain-api',
			fallbackChain: input.stage === 'opengraph' ? ['domain-api', 'opengraph'] : ['domain-api'],
			skippedStages: [],
		},
	};
}

export function createGoodreadsOpenLibraryAdapter(
	options: GoodreadsOpenLibraryAdapterOptions = {}
): GoodreadsOpenLibraryAdapter {
	return async ({ runtime, domain, classification, canonicalUrl, stageContext, signal }) => {
		if (runtime !== 'server' || domain !== 'goodreads') return PLATFORM_STAGE_MISS;
		const bookId = toStringMaybe(classification.meta.bookId);
		if (!bookId) return PLATFORM_STAGE_MISS;
		signal?.throwIfAborted();
		const deadlineAtMs =
			options.deadlineAtMs ?? createOpenLibraryLookupDeadlineAtMs(Date.now(), options.budgetMs);
		const pending = startGoodreadsLookup(
			{ kind: 'goodreads', value: bookId },
			{ ...options, deadlineAtMs, signal }
		);
		let waitTimer: ReturnType<typeof setTimeout> | undefined;
		const firstStageWaitMs = options.firstStageWaitMs ?? Number.POSITIVE_INFINITY;
		const result = await (Number.isFinite(firstStageWaitMs)
			? Promise.race([
					pending.promise,
					new Promise<undefined>((resolve) => {
						waitTimer = setTimeout(() => resolve(undefined), Math.max(0, firstStageWaitMs));
					}),
				])
			: pending.promise
		).finally(() => clearTimeout(waitTimer));
		signal?.throwIfAborted();
		if (!result) {
			stageContext.set(GOODREADS_OPENLIBRARY_LOOKUP_STATE, pending);
			return PLATFORM_STAGE_MISS;
		}
		if (result.status === 'hit') {
			return buildGoodreadsOpenLibraryWorkAtom(result, { bookId, canonicalUrl });
		}

		const diagnostics: unknown[] = [];
		if (result.status === 'failure') {
			stageContext.set(GOODREADS_OPENLIBRARY_LOOKUP_STATE, {
				deadlineAtMs,
				status: 'failure',
				timeout: result.failure.kind === 'timeout',
			});
			diagnostics.push(openLibraryLookupFailureError(result));
		} else {
			stageContext.set(GOODREADS_OPENLIBRARY_LOOKUP_STATE, { deadlineAtMs, status: 'miss' });
		}

		const slugTitle = toStringMaybe(classification.meta.slugTitle);
		if (!slugTitle) {
			return diagnostics.length > 0
				? createPlatformStageOutcome(null, diagnostics)
				: PLATFORM_STAGE_MISS;
		}

		const titleResult = await resolveOpenLibraryWork(
			{ kind: 'title', value: slugTitle },
			{ ...options, deadlineAtMs, signal }
		);
		signal?.throwIfAborted();
		if (titleResult.status === 'hit') {
			const atom = buildGoodreadsOpenLibraryWorkAtom(titleResult, { bookId, canonicalUrl });
			return diagnostics.length > 0 ? createPlatformStageOutcome(atom, diagnostics) : atom;
		}
		if (titleResult.status === 'ambiguous') {
			candidatesByClassification.set(classification, titleResult.candidates);
			diagnostics.push(new Error('openlibrary_title:ambiguous'));
		} else if (titleResult.status === 'failure') {
			diagnostics.push(openLibraryLookupFailureError(titleResult));
		}

		return diagnostics.length > 0
			? createPlatformStageOutcome(null, diagnostics)
			: PLATFORM_STAGE_MISS;
	};
}
