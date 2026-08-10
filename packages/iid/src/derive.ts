import { buildGen1Iid } from './gen1.js';
import { geohashEncode } from './geohash.js';
import { keccak16 } from './hash.js';
import { norm1 } from './norm.js';
import { formatIntuitionId } from './parse.js';
import { SCHEMES } from './schemes.js';
import type {
	DerivedIid,
	IdentityDerivationName,
	IdentityLadder,
	IdentityRecipeField,
	IdentityValueSource,
	IidValueMap,
} from './types.js';
import { derivePodcastGuid } from './uuid5.js';

/**
 * The pure declarative derivation engine (spec §5.2).
 *
 * Walks a classification's identity ladder strongest-first and mints from
 * the first rung whose declared inputs resolve. Scheme rungs fire when
 * their source yields a value the scheme can canonicalize; `gen1` rungs are
 * all-or-nothing — every recipe field must resolve, or the rung is skipped.
 *
 * Every value source and derivation name below is a frozen, serializable
 * contract: ladders are data, and two engines interpreting the same ladder
 * against the same field map MUST return the same identifier.
 *
 * Returns `undefined` when no rung fires — the atom mints without an IID.
 */
export function deriveIntuitionId(
	ladder: IdentityLadder,
	values: IidValueMap
): DerivedIid | undefined {
	for (const rung of ladder.rungs) {
		if (rung.kind === 'scheme') {
			const raw = resolveValueSource(rung.source, rung.scheme, values);

			if (raw === undefined) {
				continue;
			}

			const definition = SCHEMES[rung.scheme];
			const canonical = definition.canonicalize(raw);

			if (canonical === undefined) {
				continue;
			}

			return {
				iid: formatIntuitionId(rung.scheme, canonical),
				scheme: rung.scheme,
				class: definition.class,
			};
		}

		const recipeFields = resolveRecipe(rung.recipe, values);

		if (recipeFields === undefined) {
			continue;
		}

		return {
			iid: buildGen1Iid(ladder.slug, rung.tag, recipeFields),
			scheme: 'gen1',
			class: 'C',
			tag: rung.tag,
		};
	}

	return undefined;
}

// ---------------------------------------------------------------------------
// Value sources (scheme rungs)
// ---------------------------------------------------------------------------

function resolveValueSource(
	source: IdentityValueSource,
	scheme: keyof typeof SCHEMES,
	values: IidValueMap
): string | undefined {
	switch (source.kind) {
		case 'field':
			return stringField(values, source.key);

		case 'same-as': {
			// Selection is a pure function of the SET, never the sequence:
			// every entry is canonicalized through the rung's scheme and the
			// lexicographically smallest canonical value wins, so
			// independently-ordered sameAs arrays converge on the same IID.
			const list = values.sameAs;

			if (!Array.isArray(list)) {
				return undefined;
			}

			const canonicalize = SCHEMES[scheme].canonicalize;
			let smallest: string | undefined;

			for (const entry of list) {
				if (typeof entry !== 'string') {
					continue;
				}

				const canonical = canonicalize(entry);

				if (canonical !== undefined && (smallest === undefined || canonical < smallest)) {
					smallest = canonical;
				}
			}

			return smallest;
		}

		case 'url-origin': {
			const raw = stringField(values, source.key);

			if (raw === undefined) {
				return undefined;
			}

			try {
				return new URL(raw.trim()).origin;
			} catch {
				return undefined;
			}
		}

		case 'geohash': {
			const latitude = numericField(values, 'latitude');
			const longitude = numericField(values, 'longitude');

			if (latitude === undefined || longitude === undefined) {
				return undefined;
			}

			try {
				return geohashEncode(latitude, longitude, source.precision);
			} catch {
				return undefined;
			}
		}

		case 'podcast-guid': {
			const feedUrl = stringField(values, source.key);
			return feedUrl === undefined ? undefined : derivePodcastGuid(feedUrl);
		}

		case 'derivation':
			return resolveDerivation(source.name, values);
	}
}

/**
 * Frozen multi-field derivations. The field keys each name reads are part
 * of its contract:
 *
 * | Name              | Reads                          | Produces                                        |
 * | ----------------- | ------------------------------ | ----------------------------------------------- |
 * | `acct-strong`     | `platform`, `platformUserId`   | `<platform>:<platformUserId>`                   |
 * | `acct-weak`       | `platform`, `username`         | `<platform>:@<username>` (leading `@` folded)   |
 * | `appid-bundle`    | `operatingSystem`, `bundleId`  | `<operatingSystem>:<bundleId>`                  |
 * | `rss-item`        | `feedGuid`, `itemGuid`         | `<feedGuid>:<keccak16(NORM-1(itemGuid))>`       |
 * | `termset-term`    | `inDefinedTermSet`, `termCode` | `<keccak16(NORM-1(set))>:<slug(termCode)>`      |
 * | `caip10-eoa`      | `address`                      | `eip155:1:<address>` (EOAs are chain-agnostic)  |
 * | `caip10-contract` | `chainId`, `address`           | `eip155:<chainId>:<address>`                    |
 * | `caip19-erc20`    | `chainId`, `address`           | `eip155:<chainId>/erc20:<address>`              |
 */
function resolveDerivation(name: IdentityDerivationName, values: IidValueMap): string | undefined {
	switch (name) {
		case 'acct-strong': {
			const platform = stringField(values, 'platform');
			const platformUserId = stringField(values, 'platformUserId');
			return platform !== undefined && platformUserId !== undefined
				? `${platform}:${platformUserId}`
				: undefined;
		}

		case 'acct-weak': {
			const platform = stringField(values, 'platform');
			const username = stringField(values, 'username');
			return platform !== undefined && username !== undefined
				? `${platform}:@${username.replace(/^@+/, '')}`
				: undefined;
		}

		case 'appid-bundle': {
			const operatingSystem = stringField(values, 'operatingSystem');
			const bundleId = stringField(values, 'bundleId');
			return operatingSystem !== undefined && bundleId !== undefined
				? `${operatingSystem}:${bundleId}`
				: undefined;
		}

		case 'rss-item': {
			const feedGuid = stringField(values, 'feedGuid');
			const itemGuid = stringField(values, 'itemGuid');
			return feedGuid !== undefined && itemGuid !== undefined
				? `${feedGuid}:${keccak16(norm1(itemGuid))}`
				: undefined;
		}

		case 'termset-term': {
			const termSet = stringField(values, 'inDefinedTermSet');
			const termCode = stringField(values, 'termCode');

			if (termSet === undefined || termCode === undefined) {
				return undefined;
			}

			const slug = slugifyTermCode(termCode);
			return slug === undefined ? undefined : `${keccak16(norm1(termSet))}:${slug}`;
		}

		case 'caip10-eoa': {
			const address = stringField(values, 'address');
			return address === undefined ? undefined : `eip155:1:${address}`;
		}

		case 'caip10-contract': {
			const chainId = numericField(values, 'chainId');
			const address = stringField(values, 'address');
			return chainId !== undefined && address !== undefined
				? `eip155:${chainId}:${address}`
				: undefined;
		}

		case 'caip19-erc20': {
			const chainId = numericField(values, 'chainId');
			const address = stringField(values, 'address');
			return chainId !== undefined && address !== undefined
				? `eip155:${chainId}/erc20:${address}`
				: undefined;
		}
	}
}

/**
 * Term codes become the `termset` scheme's `[a-z0-9][a-z0-9-]*` code slug:
 * NORM-1, whitespace to hyphens, everything outside `[a-z0-9-]` dropped,
 * hyphen runs collapsed, edge hyphens trimmed. Frozen with the derivation.
 */
function slugifyTermCode(termCode: string): string | undefined {
	const slug = norm1(termCode)
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-{2,}/g, '-')
		.replace(/^-+|-+$/g, '');

	return slug.length === 0 ? undefined : slug;
}

// ---------------------------------------------------------------------------
// Recipe fields (gen1 rungs)
// ---------------------------------------------------------------------------

/** All-or-nothing (spec §5.2): returns undefined unless EVERY field resolves. */
function resolveRecipe(
	recipe: readonly IdentityRecipeField[],
	values: IidValueMap
): Record<string, string> | undefined {
	const resolved: Record<string, string> = {};

	for (const field of recipe) {
		const value = resolveRecipeField(field, values);

		if (value === undefined || value.trim().length === 0) {
			return undefined;
		}

		resolved[field.key] = value;
	}

	return Object.keys(resolved).length > 0 ? resolved : undefined;
}

function resolveRecipeField(field: IdentityRecipeField, values: IidValueMap): string | undefined {
	switch (field.from) {
		case 'field':
			return scalarField(values, field.key);

		case 'year': {
			const raw = stringField(values, field.of);
			const match = raw === undefined ? null : /^(\d{4})(?:-|$)/.exec(raw.trim());
			return match ? match[1] : undefined;
		}

		case 'text-hash': {
			const raw = stringField(values, field.of);
			return raw === undefined ? undefined : keccak16(norm1(raw));
		}

		case 'geohash': {
			const latitude = numericField(values, 'latitude');
			const longitude = numericField(values, 'longitude');

			if (latitude === undefined || longitude === undefined) {
				return undefined;
			}

			try {
				return geohashEncode(latitude, longitude, field.precision);
			} catch {
				return undefined;
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Field access
// ---------------------------------------------------------------------------

function stringField(values: IidValueMap, key: string): string | undefined {
	const value = values[key];
	return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

/**
 * Scalar recipe input (spec §4.5): strings pass through (NORM-1 is applied
 * by the gen1 builder); finite numbers take their shortest round-tripping
 * decimal form. Booleans, arrays, and objects are not permitted in recipes.
 */
function scalarField(values: IidValueMap, key: string): string | undefined {
	const value = values[key];

	if (typeof value === 'string') {
		return value.trim().length > 0 ? value : undefined;
	}

	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}

	return undefined;
}

/** Accepts a finite number or a string of one (chain IDs, coordinates). */
function numericField(values: IidValueMap, key: string): number | undefined {
	const value = values[key];

	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string' && value.trim().length > 0) {
		const parsed = Number(value.trim());
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	return undefined;
}
