import { parseIsbn } from '../shared/isbn';
import { createNonUrlPlugin, type NonUrlV0Profile } from '../shared/non-url';
import {
	buildOpenLibraryWorkAtom,
	type OpenLibraryWorkLookupOptions,
	openLibraryLookupFailureError,
	resolveOpenLibraryWork,
} from '../shared/openlibrary-lookup';

export type IsbnPluginOptions = {
	/** Open Library uses a shared 5000ms default; set budgetMs to override, or false to skip. */
	openLibrary?: OpenLibraryWorkLookupOptions | false;
};

function buildIsbnFallback(normalized: string, subtype: string | undefined, now: string) {
	const sourceUrl = `https://www.worldcat.org/isbn/${normalized}`;
	const name = `Book (ISBN ${normalized})`;
	return {
		fallbackUsed: true,
		atoms: [
			{
				schemaType: 'Book' as const,
				category: 'thing' as const,
				title: name,
				canonicalId: `isbn:${normalized}`,
				sameAs: [sourceUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'Book',
					name,
					isbn: normalized,
					sameAs: [sourceUrl],
				},
				metadata: {
					pluginId: 'isbn',
					provider: 'isbn',
					fetchedAt: now,
					sourceUrl,
					identifierType: subtype,
				},
			},
		],
	};
}

function createIsbnProfile(options: IsbnPluginOptions = {}): NonUrlV0Profile {
	return {
		id: 'isbn',
		classifier: {
			id: 'isbn-identifier-classifier',
			priority: 25,
			classify: (input) => {
				const parsed = parseIsbn(input);
				if (!parsed) return null;
				const isbn10 = parsed.sourceType === 'isbn-10';
				return {
					type: 'identifier',
					domain: 'isbn',
					subtype: isbn10 ? 'isbn-10' : 'isbn-13',
					confidence: isbn10 ? 0.97 : 0.98,
					meta: {
						normalizedIsbn: parsed.isbn13,
						identifierType: isbn10 ? 'ISBN10' : 'ISBN13',
					},
				};
			},
		},
		canResolve: (classification) => classification.domain === 'isbn',
		resolve: async ({ classification, request, now, runtime, signal }) => {
			const normalized =
				(typeof classification.meta.normalizedIsbn === 'string' &&
					classification.meta.normalizedIsbn) ||
				request.input.trim();
			const fallback = buildIsbnFallback(normalized, classification.subtype, now);
			if (runtime !== 'server' || options.openLibrary === false) return fallback;

			const result = await resolveOpenLibraryWork(
				{ kind: 'isbn', value: normalized },
				{ ...options.openLibrary, signal }
			);
			if (result.status === 'miss' || result.status === 'ambiguous') return fallback;
			if (result.status === 'failure') {
				return { ...fallback, errors: [openLibraryLookupFailureError(result).message] };
			}

			const atom = buildOpenLibraryWorkAtom(result);
			atom.metadata = {
				pluginId: 'isbn',
				provider: 'openlibrary',
				fetchedAt: now,
				sourceUrl: result.workUrl,
				identifierType: classification.subtype,
			};
			return { fallbackUsed: false, atoms: [atom] };
		},
	};
}

export const isbnProfile: NonUrlV0Profile = createIsbnProfile();

export function createIsbnPlugin(options: IsbnPluginOptions = {}) {
	return createNonUrlPlugin({
		pluginId: 'isbn',
		resolverId: 'isbn-resolver',
		profile: createIsbnProfile(options),
	});
}
