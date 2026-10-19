import {
	buildAtomDataObject,
	getClassification,
	identityLadderFor,
	validateClassificationValues,
} from '@0xintuition/classifications';
import { calculateAtomId } from '@0xintuition/ids';
import type { IdentityLadder, IdentityRecipeField, IntuitionId } from '@0xintuition/iid';
import {
	deriveIntuitionId,
	geohashEncode,
	inspectIntuitionId,
	keccak16,
	norm1,
	SCHEMES,
} from '@0xintuition/iid';
import { classificationForIid, providersForIid } from '@0xintuition/iid-registry';

import type { AtomAnchor, BuildResult, IidAnchorOptions, UriLimits } from './types.js';

/**
 * Offline policy defaults for the URI context manifest. These mirror the
 * protocol's effective defaults but are a POLICY floor, not a substitute
 * for the live contract configuration — callers that know the current
 * on-chain `getAtomUriConfig` values pass them via `options.uriLimits`.
 */
export const DEFAULT_URI_LIMITS: UriLimits = Object.freeze({
	maxUris: 5,
	maxUriBytes: 700,
});

const encoder = new TextEncoder();

function toHex(data: string): `0x${string}` {
	let hex = '0x';

	for (const byte of encoder.encode(data)) {
		hex += byte.toString(16).padStart(2, '0');
	}

	return hex as `0x${string}`;
}

/**
 * Normalize the URI context manifest: trim entries, drop empties, remove
 * exact duplicates, PRESERVE first-occurrence order. URI context never
 * changes the IID, the atom bytes, or the atom ID — it travels alongside
 * creation and is emitted, not stored.
 */
function normalizeContextUris(
	contextUris: readonly string[],
	limits: UriLimits,
	errors: string[]
): readonly string[] {
	const seen = new Set<string>();
	const normalized: string[] = [];

	for (const uri of contextUris) {
		const trimmed = uri.trim();

		if (trimmed.length === 0 || seen.has(trimmed)) {
			continue;
		}

		const byteLength = encoder.encode(trimmed).length;

		if (byteLength > limits.maxUriBytes) {
			errors.push(
				`Context URI exceeds ${limits.maxUriBytes} bytes (${byteLength}): "${trimmed.slice(0, 64)}…"`
			);
			continue;
		}

		seen.add(trimmed);
		normalized.push(trimmed);
	}

	if (normalized.length > limits.maxUris) {
		errors.push(`Context manifest has ${normalized.length} URIs; the limit is ${limits.maxUris}.`);
	}

	return normalized;
}

/**
 * Build a canonical IID atom anchor: the supported high-level path from a
 * classification's field values to on-chain-ready atom bytes.
 *
 * Interprets the classification's declarative identity ladder through the
 * `@0xintuition/iid` engine, selects the representation profile, serializes
 * canonical bytes, computes the atom ID through `@0xintuition/ids`, and
 * returns the registry's classification and provider hints plus the
 * normalized URI context manifest.
 *
 * Profiles (IID spec §7):
 * - `p0` — atom data is the bare IID string. Legal only for anchor-eligible
 *   identifiers (Class A/B, unambiguously typed scheme). This is the only
 *   profile with protocol-level dedupe: `atomId = calculateAtomId(iid)`.
 * - `p1` — a deterministic JSON object carrying `@context`, `@type`,
 *   `identifier`, materialized recipe evidence, and nonempty `sameAs`.
 *   The REQUIRED floor for Class C, polymorphic schemes, and weak acct
 *   handles. Without a usable IID, validated classification fields form a
 *   P1 fallback envelope with no `identifier`.
 *
 * The default profile is the strongest legal one: `p0` when eligible,
 * otherwise `p1`. Requesting `p0` for an ineligible identifier is a
 * structured error, never a silent downgrade.
 *
 * Pure and offline: no wallet calls, provider fetches, live config reads,
 * or on-chain duplicate checks.
 */
export function buildIidAnchor(
	classificationSlug: string,
	values: Record<string, unknown>,
	options: IidAnchorOptions = {}
): BuildResult<AtomAnchor> {
	const spec = getClassification(classificationSlug);

	if (!spec) {
		return { success: false, errors: [`Unknown classification "${classificationSlug}".`] };
	}

	const ladder = identityLadderFor(classificationSlug);

	let derived = ladder ? deriveIntuitionId(ladder, values) : undefined;
	const inspection = derived ? inspectIntuitionId(derived.iid) : undefined;

	if (derived && inspection && !inspection.valid) {
		// Only a canonical URL over the 220-character IID value cap may fall
		// back. Other invalid derivations must retain their inspection error.
		const url = derived.iid.startsWith('int:url:') ? derived.iid.slice(8) : undefined;
		if (url !== undefined && url.length > 220 && SCHEMES.url.isCanonical(url)) {
			derived = undefined;
		} else {
			return {
				success: false,
				errors: [`Derived identifier failed inspection: ${derived.iid} (${inspection.reason}).`],
			};
		}
	}

	const weakAccount = derived?.scheme === 'acct' && /^int:acct:[^:]+:@/.test(derived.iid);
	const anchorEligible = derived && inspection?.valid && inspection.anchorEligible && !weakAccount;
	const requestedProfile = options.profile;
	const profile = requestedProfile ?? (anchorEligible ? 'p0' : 'p1');

	if (profile === 'p0' && !anchorEligible) {
		const reason = !derived
			? 'no usable identifier was derived'
			: weakAccount
				? 'weak account handles must carry @type in a P1 payload'
				: inspection?.valid && inspection.anchorIneligibilityReason === 'class-c'
					? 'Class C identifiers must carry their recipe fields in a P1 payload'
					: 'polymorphic schemes must carry @type in a P1 payload';
		return {
			success: false,
			errors: [`${derived?.iid ?? classificationSlug} cannot mint as a bare P0 anchor: ${reason}.`],
		};
	}

	const errors: string[] = [];
	const contextUris = normalizeContextUris(
		options.contextUris ?? [],
		options.uriLimits ?? DEFAULT_URI_LIMITS,
		errors
	);

	if (errors.length > 0) {
		return { success: false, errors };
	}

	let data: string;
	if (derived && ladder) {
		data =
			profile === 'p0'
				? derived.iid
				: buildProfilePayload(spec.schema?.context, spec.type, derived, ladder, values);
	} else {
		const issues = validateClassificationValues(classificationSlug, values);
		if (issues.length > 0) {
			return {
				success: false,
				errors: issues.map((issue) =>
					ladder
						? `No identity rung fired for "${classificationSlug}": ${issue.message}`
						: issue.message
				),
			};
		}
		const envelope = buildAtomDataObject(classificationSlug, values);
		for (const field of spec.fields) {
			if (field.fieldType === 'string[]' && Array.isArray(envelope[field.key])) {
				envelope[field.key] = stableStringSet(envelope[field.key]);
			}
		}
		data = JSON.stringify(envelope);
	}

	const registryClassification = derived ? classificationForIid(derived.iid) : undefined;

	return {
		success: true,
		value: {
			classification: registryClassification?.slug ?? classificationSlug,
			profile: derived ? profile : 'p1',
			iid: derived?.iid ?? null,
			scheme: derived?.scheme ?? null,
			class: derived?.class ?? null,
			...(derived?.tag !== undefined ? { tag: derived.tag } : {}),
			data,
			dataHex: toHex(data),
			id: calculateAtomId(data),
			contextUris,
			providerPlan: derived ? providersForIid(derived.iid) : [],
			values: Object.freeze({ ...values }),
		},
	};
}

/**
 * The deterministic P1/P2 payload. Key order is frozen: `@context`,
 * `@type`, `identifier`, recipe evidence, then nonempty `sameAs`. Direct-only
 * recipes retain the train's sorted field order; transformed recipes use
 * declaration order and materialize each source before NORM-1 of the IID.
 */
function buildProfilePayload(
	schemaContext: string | undefined,
	schemaType: string,
	derived: { iid: IntuitionId; tag?: number },
	ladder: IdentityLadder,
	values: Record<string, unknown>
): string {
	const identityFields: Record<string, unknown> = {};

	if (derived.tag !== undefined) {
		const rung = ladder.rungs.find(
			(candidate) => candidate.kind === 'gen1' && candidate.tag === derived.tag
		);

		if (rung && rung.kind === 'gen1') {
			const recipe = rung.recipe.some((field) => field.from !== 'field')
				? rung.recipe
				: [...rung.recipe].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
			for (const field of recipe) {
				identityFields[field.key] = recipeValue(field, values);
			}
		}
	}

	const payload: Record<string, unknown> = {
		'@context': schemaContext,
		'@type': schemaType,
		identifier: derived.iid,
	};

	for (const key of Object.keys(identityFields)) {
		payload[key] = identityFields[key];
	}
	const sameAs = stableStringSet(values.sameAs);
	if (sameAs.length > 0) {
		payload.sameAs = sameAs;
	}

	return JSON.stringify(payload);
}

function stableStringSet(value: unknown): string[] {
	return Array.isArray(value)
		? [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))].sort()
		: [];
}

/** The producing rung already checked that all of these sources resolve. */
function recipeValue(field: IdentityRecipeField, values: Record<string, unknown>): string {
	switch (field.from) {
		case 'field':
			return String(values[field.key]);
		case 'year':
			return String(values[field.of]).trim().slice(0, 4);
		case 'text-hash':
			return keccak16(norm1(String(values[field.of])));
		case 'geohash':
			return geohashEncode(Number(values.latitude), Number(values.longitude), field.precision);
	}
}
