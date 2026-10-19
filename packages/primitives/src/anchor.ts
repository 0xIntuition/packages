import {
	buildAtomDataObject,
	type ClassificationSpec,
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
	isAnchorEligible,
	isPlainWdPrimaryAllowed,
	keccak16,
	norm1,
	SCHEME_NAMES,
	SCHEMES,
	validateIntuitionId,
	WD_ENTITYSCHEMA_BINDINGS,
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
const MAX_IID_VALUE_LENGTH = 220;
const URL_IID_PREFIX = 'int:url:';
const GENERIC_IID_SHAPE = /^int:([a-z0-9-]{1,32}):(.{1,220})$/;
const REGISTERED_IID_SCHEMES = new Set<string>(SCHEME_NAMES);

/** Reference validator errors retain their name, code, and exact message. */
class AtomAnchorError extends Error {
	readonly code = 'INVALID_IID';

	constructor(message: string) {
		super(message);
		this.name = 'AtomAnchorError';
	}
}

/** False is reserved for a canonical URL whose length alone exceeds the IID cap. */
export function validateDerivedAnchorIid(slug: string, iid: string): boolean {
	if (validateIntuitionId(iid)) return true;
	if (isOverCapUrlIid(iid)) return false;
	throw new AtomAnchorError(`Derived identifier is not canonical for "${slug}": ${iid}`);
}

export function isOverCapUrlIid(iid: string): boolean {
	if (!iid.startsWith(URL_IID_PREFIX)) return false;
	const value = iid.slice(URL_IID_PREFIX.length);
	return value.length > MAX_IID_VALUE_LENGTH && SCHEMES.url.isCanonical(value);
}

function validateCandidateAnchorIid(spec: ClassificationSpec, candidateIid: string): void {
	const match = GENERIC_IID_SHAPE.exec(candidateIid);
	const scheme = match?.[1];
	const isRegisteredScheme = scheme !== undefined && REGISTERED_IID_SCHEMES.has(scheme);
	const isCanonical = isRegisteredScheme
		? validateIntuitionId(candidateIid)
		: match !== null && candidateIid.trim() === candidateIid && !/\s/.test(candidateIid);

	if (!isCanonical) {
		throw new AtomAnchorError(
			`Candidate identifier is not canonical for "${spec.slug}": ${candidateIid}`
		);
	}

	if (scheme !== 'wd') return;
	const canonicalValue = match?.[2] ?? '';
	if (/^Q[1-9]\d*$/.test(canonicalValue) && isPlainWdPrimaryAllowed(spec.type)) return;
	const separator = canonicalValue.indexOf(':');
	const slug = separator > 0 ? canonicalValue.slice(0, separator) : undefined;
	const binding = WD_ENTITYSCHEMA_BINDINGS.find((candidate) => candidate.slug === slug);

	if (binding?.status !== 'active') {
		throw new AtomAnchorError(
			`Candidate wd identifier is parse-only and cannot be minted for "${spec.slug}": ${candidateIid}`
		);
	}
	if (binding.classification !== spec.type) {
		throw new AtomAnchorError(
			`Candidate wd identifier classifies as "${binding.classification}", not "${spec.type}": ${candidateIid}`
		);
	}
}

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
	if (options.candidateIid !== undefined) {
		return buildCandidateAnchor(spec, values, options.candidateIid, options);
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

/** The reference's helper name; both public names share one function object. */
export const buildAtomAnchor = buildIidAnchor;

function buildCandidateAnchor(
	spec: ClassificationSpec,
	values: Record<string, unknown>,
	candidateIid: string,
	options: IidAnchorOptions
): BuildResult<AtomAnchor> {
	try {
		validateCandidateAnchorIid(spec, candidateIid);
	} catch (error) {
		if (!(error instanceof AtomAnchorError)) throw error;
		return { success: false, errors: [error.message] };
	}

	const eligible = isAnchorEligible(candidateIid) && !/^int:acct:[^:]+:@/.test(candidateIid);
	const profile = options.profile ?? (eligible ? 'p0' : 'p1');
	if (profile === 'p0' && !eligible) {
		return {
			success: false,
			errors: [
				`${candidateIid} cannot mint as a bare P0 anchor: candidate is not anchor-eligible.`,
			],
		};
	}
	const errors: string[] = [];
	const contextUris = normalizeContextUris(
		options.contextUris ?? [],
		options.uriLimits ?? DEFAULT_URI_LIMITS,
		errors
	);
	if (errors.length > 0) return { success: false, errors };

	let data = candidateIid;
	if (profile !== 'p0') {
		let envelope: Record<string, unknown>;
		try {
			envelope = buildAtomDataObject(spec.slug, values);
		} catch (error) {
			if (!(error instanceof Error)) throw error;
			return { success: false, errors: [error.message] };
		}
		for (const field of spec.fields) {
			if (field.fieldType === 'string[]' && Array.isArray(envelope[field.key])) {
				envelope[field.key] = stableStringSet(envelope[field.key]);
			}
		}
		const entries: Array<[string, unknown]> = [];
		for (const [key, value] of Object.entries(envelope)) {
			entries.push([key, value]);
			if (key === '@type') entries.push(['identifier', candidateIid]);
		}
		data = JSON.stringify(Object.fromEntries(entries));
	}

	const inspection = inspectIntuitionId(candidateIid);
	return {
		success: true,
		value: {
			classification: classificationForIid(candidateIid)?.slug ?? spec.slug,
			profile,
			iid: candidateIid,
			scheme: candidateIid.split(':')[1] ?? null,
			class: inspection.valid ? inspection.class : null,
			data,
			dataHex: toHex(data),
			id: calculateAtomId(data),
			contextUris,
			providerPlan: providersForIid(candidateIid),
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
