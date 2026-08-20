import { getClassification, identityLadderFor } from '@0xintuition/classifications';
import { calculateAtomId } from '@0xintuition/ids';
import type { IdentityLadder, IntuitionId } from '@0xintuition/iid';
import { deriveIntuitionId, inspectIntuitionId } from '@0xintuition/iid';
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
 *   `identifier`, and the identity fields the fired rung consumed. The
 *   REQUIRED floor for Class C identifiers and polymorphic schemes.
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

	if (!ladder) {
		return {
			success: false,
			errors: [`Classification "${classificationSlug}" declares no identity ladder.`],
		};
	}

	const derived = deriveIntuitionId(ladder, values);

	if (!derived) {
		return {
			success: false,
			errors: [
				`No identity rung fired for "${classificationSlug}": the provided values contain neither a usable registry identifier nor a complete derivation recipe.`,
			],
		};
	}

	const inspection = inspectIntuitionId(derived.iid);

	if (!inspection.valid) {
		return {
			success: false,
			errors: [`Derived identifier failed inspection: ${derived.iid} (${inspection.reason}).`],
		};
	}

	const requestedProfile = options.profile;
	const profile = requestedProfile ?? (inspection.anchorEligible ? 'p0' : 'p1');

	if (profile === 'p0' && !inspection.anchorEligible) {
		const reason =
			inspection.anchorIneligibilityReason === 'class-c'
				? 'Class C identifiers must carry their recipe fields in a P1 payload'
				: 'polymorphic schemes must carry @type in a P1 payload';
		return {
			success: false,
			errors: [`${derived.iid} cannot mint as a bare P0 anchor: ${reason}.`],
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

	const data =
		profile === 'p0' ? derived.iid : buildProfilePayload(spec.type, derived, ladder, values);

	const registryClassification = classificationForIid(derived.iid);

	return {
		success: true,
		value: {
			classification: registryClassification?.slug ?? classificationSlug,
			profile,
			iid: derived.iid,
			scheme: derived.scheme,
			class: derived.class,
			...(derived.tag !== undefined ? { tag: derived.tag } : {}),
			data,
			dataHex: toHex(data),
			id: calculateAtomId(data),
			contextUris,
			providerPlan: providersForIid(derived.iid),
			values: Object.freeze({ ...values }),
		},
	};
}

/**
 * The deterministic P1/P2 payload. Key order is frozen: `@context`,
 * `@type`, `identifier`, then identity fields sorted by key. For a fired
 * gen1 rung the identity fields are the recipe's inputs as provided (the
 * preimage evidence — spec §6.6); scheme rungs carry no extra fields at P1.
 */
function buildProfilePayload(
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
			for (const field of rung.recipe) {
				const sourceKey = 'of' in field ? field.of : field.key;
				const provided = values[sourceKey] ?? values[field.key];

				if (provided !== undefined && provided !== null && provided !== '') {
					identityFields[field.key] = provided;
				}
			}
		}
	}

	const payload: Record<string, unknown> = {
		'@context': 'https://schema.org/',
		'@type': schemaType,
		identifier: derived.iid,
	};

	for (const key of Object.keys(identityFields).sort()) {
		payload[key] = identityFields[key];
	}

	return JSON.stringify(payload);
}
