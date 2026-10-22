import { referenceStructure, slugMapping, trainLadder, trainStructure } from './mappings';
import { ids, iid, primitives, protocol, registry, viem } from './public';
import {
	anchorCases,
	anchors,
	assertCanonicalAgreement,
	canonicalization,
	equal,
	golden,
	ladderCases,
	ladders,
	parser,
	recordedCanonicalOutput,
	utf8Hex,
} from './vectors';

export interface ProofCase {
	id: string;
	input?: unknown;
	expected: unknown;
	run: () => unknown | Promise<unknown>;
	open?: string;
	policy?: 'single-field-anchor';
}

/** Candidate options pass unchanged through the public builder, never through values. */
function buildAnchor(c: any) {
	const result = primitives.buildIidAnchor(
		slugMapping[c.input.slug] ?? c.input.slug,
		c.input.values,
		{ candidateIid: c.input.options?.candidateIid }
	);
	if (!result.success) return { ok: false, errors: result.errors };
	return { ok: true, anchor: result.value };
}

function checkedPublicParse(input: string) {
	const parsed = iid.parseIntuitionId(input);
	// Public parseIntuitionId rejects with undefined (no object and no fields).
	// Success is exactly { scheme: string, value: string }; validate before projection.
	if (parsed === undefined) return parsed;
	if (
		!parsed ||
		typeof parsed !== 'object' ||
		!equal(Object.keys(parsed).sort(), ['scheme', 'value']) ||
		typeof parsed.scheme !== 'string' ||
		!iid.SCHEMES[parsed.scheme] ||
		typeof parsed.value !== 'string' ||
		parsed.value.length === 0
	)
		throw new Error('Malformed public parseIntuitionId result');
	return parsed;
}

function parseOutcome(input: string) {
	const parsed = checkedPublicParse(input);
	const inspection = iid.inspectIntuitionId(input);
	if (!inspection.valid && inspection.reason === 'unknown-scheme')
		return { outcome: 'unknown-scheme', canonical: null, reason: 'unknown_or_malformed_iid' };
	if (!parsed)
		return { outcome: 'rejected-with-reason', canonical: null, reason: 'unknown_or_malformed_iid' };
	const value = iid.SCHEMES[parsed.scheme].canonicalize(parsed.value);
	if (value === undefined)
		return { outcome: 'rejected-with-reason', canonical: null, reason: 'invalid_iid_value' };
	const canonical = iid.formatIntuitionId(parsed.scheme, value);
	return {
		outcome:
			canonical === input ? 'accepted-canonical' : 'accepted-noncanonical-then-canonicalized',
		canonical,
		reason: null,
	};
}
function expectedParse(c: any) {
	const d = c.expected.data;
	return {
		outcome: d.valid
			? d.canonicalIid === c.input
				? 'accepted-canonical'
				: 'accepted-noncanonical-then-canonicalized'
			: d.reason === 'unknown_or_malformed_iid'
				? 'unknown-scheme'
				: 'rejected-with-reason',
		canonical: d.canonicalIid,
		reason: d.reason ?? null,
	};
}
export const parseCases: ProofCase[] = parser.cases.map((c: any) => ({
	id: c.name,
	input: c.input,
	expected: expectedParse(c),
	run: () => {
		const result = parseOutcome(c.input);
		if (result.canonical) registry.classificationForIid(result.canonical);
		return result;
	},
}));
parseCases.push({
	id: 'golden-parse-classify',
	input: golden.iid,
	expected: {
		parse: golden.pure.parse,
		valid: true,
		canonical: golden.iid,
		anchorEligible: true,
		classification: { slug: 'music-recording', schemaType: 'MusicRecording', category: 'Media' },
		hints: golden.pure.registry.identifierHintsForIid,
		providers: golden.pure.registry.providersForIid,
		scheme: golden.pure.scheme.class,
		typing: golden.pure.scheme.typing,
	},
	run: () => {
		const classification = registry.classificationForIid(golden.iid);
		return {
			parse: checkedPublicParse(golden.iid),
			valid: iid.validateIntuitionId(golden.iid),
			canonical: parseOutcome(golden.iid).canonical,
			anchorEligible: iid.isAnchorEligible(golden.iid),
			classification: {
				slug: classification.slug,
				schemaType: classification.schemaType,
				category: classification.category,
			},
			hints: registry.identifierHintsForIid(golden.iid),
			providers: registry.providersForIid(golden.iid),
			scheme: iid.SCHEMES.isrc.class,
			typing: iid.SCHEME_TYPING.isrc,
		};
	},
});

function anchorOutput(anchor: any) {
	const envelope = anchor.data.startsWith('{') ? JSON.parse(anchor.data) : null;
	return {
		ok: true,
		profile: anchor.profile.toUpperCase(),
		data: anchor.data,
		hex: anchor.dataHex.slice(2),
		byteLength: Buffer.from(anchor.data).length,
		atomId: ids.calculateAtomId(anchor.dataHex),
		iid: anchor.iid,
		keyOrder: envelope ? Object.keys(envelope) : null,
	};
}
function referenceAnchor(c: any) {
	const e = c.expected;
	if (!e.ok) return { ok: false, error: e.error };
	return {
		ok: true,
		profile: e.profile,
		data: e.anchorJson,
		hex: e.anchorBytesHex,
		byteLength: e.anchorByteLength,
		atomId: e.atomId,
		iid: e.iid,
		keyOrder: e.envelopeKeyOrder,
	};
}
export const anchorProofCases: ProofCase[] = anchorCases.map((c: any) => {
	const identityKeys =
		c.expected.envelopeKeyOrder?.filter(
			(k: string) => !['@context', '@type', 'identifier', 'sameAs'].includes(k)
		) ?? [];
	return {
		id: `anchor:${c.label}`,
		input: c.input,
		expected: referenceAnchor(c),
		policy: identityKeys.length === 1 ? 'single-field-anchor' : undefined,
		run: () => {
			const result = buildAnchor(c);
			if (!result.ok)
				return {
					ok: false,
					error: result.errors.some(
						(e: string) =>
							e.startsWith('Derived identifier failed inspection:') || e.startsWith('Candidate ')
					)
						? 'INVALID_IID'
						: 'Error',
				};
			if (ids.calculateAtomId(result.anchor.dataHex) !== result.anchor.id)
				throw new Error('Builder id differs from hash of bytes');
			if (utf8Hex(result.anchor.data) !== result.anchor.dataHex)
				throw new Error('Builder UTF-8 bytes differ from serialized data');
			return anchorOutput(result.anchor);
		},
	};
});

for (const c of anchors.validators)
	anchorProofCases.push({
		id: `validator:${c.label}`,
		input: c.input,
		expected: c.expected,
		run: () => {
			const isOverCapUrlIid = primitives.isOverCapUrlIid(c.input.iid);
			try {
				return {
					isOverCapUrlIid,
					validateDerivedAnchorIid: primitives.validateDerivedAnchorIid(c.input.slug, c.input.iid),
					error: null,
					raw: { thrown: null },
				};
			} catch (error: any) {
				return {
					isOverCapUrlIid,
					validateDerivedAnchorIid: null,
					error: error.code ?? error.name,
					raw: { thrown: { name: error.name, code: error.code, message: error.message } },
				};
			}
		},
	});

const creator = '0x0000000000000000000000000000000000000001';
const txHash = `0x${'11'.repeat(32)}`;
function encodeInputs(data: string, uri: string) {
	return { args: [creator, [data], [1n], [[utf8Hex(uri)]]], value: 1n };
}
function eventLog(name: string, args: Record<string, any>, index: number) {
	const event = protocol.MultiVaultAbi.find((e: any) => e.type === 'event' && e.name === name);
	const nonindexed = event.inputs.filter((p: any) => !p.indexed);
	return {
		address: creator,
		topics: viem.encodeEventTopics({ abi: protocol.MultiVaultAbi, eventName: name, args }),
		data: viem.encodeAbiParameters(
			nonindexed,
			nonindexed.map((p: any) => args[p.name])
		),
		blockNumber: 1n,
		blockHash: txHash,
		transactionHash: txHash,
		transactionIndex: 0,
		logIndex: index,
		removed: false,
	};
}
export const encodeCases: ProofCase[] = anchorCases
	.map((c: any) => {
		if (c.input.options?.candidateIid) return null;
		const result = buildAnchor(c);
		if (!result.ok) return null;
		const anchor = result.anchor;
		// A no-identifier fallback envelope has no URI to encode; the encode inventory
		// covers identified anchors only (manifest.json pins its ids).
		if (anchor.iid === null) return null;
		return {
			id: `encode:${c.label}`,
			input: c.input,
			expected: {
				bytes: anchor.dataHex,
				uri: utf8Hex(anchor.iid),
				termId: anchor.id,
				createdCount: 1,
				contextCount: 1,
				linked: true,
			},
			run: async () => {
				const calldata = protocol.multiVaultCreateAtomsWithUrisEncode(
					encodeInputs(anchor.dataHex, anchor.iid)
				);
				const decoded = viem.decodeFunctionData({ abi: protocol.MultiVaultAbi, data: calldata });
				if (decoded.functionName !== 'createAtomsWithUris')
					throw new Error('Wrong encoded function');
				if (!equal(decoded.args, encodeInputs(anchor.dataHex, anchor.iid).args))
					throw new Error('Decoded creator, atom count, data, assets, or URI manifest differs');
				const bytes = decoded.args[1][0];
				const termId = ids.calculateAtomId(bytes);
				const logs = [
					eventLog('AtomCreated', { creator, termId, atomWallet: creator, atomData: bytes }, 0),
					eventLog(
						'AtomContextRegistered',
						{ registrant: creator, termId, uris: [utf8Hex(anchor.iid)] },
						1
					),
				];
				const receiptClient = {
					waitForTransactionReceipt: async () => ({ status: 'success', logs }),
				};
				const created = await protocol.eventParseAtomCreated(receiptClient, txHash);
				const context = await protocol.eventParseAtomContextRegistered(receiptClient, txHash);
				if (created[0]?.args.atomData !== bytes) throw new Error('Created event bytes differ');
				if (!equal(context[0]?.args.uris, [utf8Hex(anchor.iid)]))
					throw new Error('Context event URI differs');
				return {
					bytes,
					uri: decoded.args[3][0][0],
					termId,
					createdCount: created.length,
					contextCount: context.length,
					linked: created[0]?.args.termId === termId && context[0]?.args.termId === termId,
				};
			},
		};
	})
	.filter(Boolean);
encodeCases.push({
	id: 'protocol-odd-length-hex',
	input: '0xabc',
	expected: { validatorRejects: true, encoderRejects: true },
	run: () => {
		const inputs = encodeInputs('0xabc', golden.iid);
		function rejectsOddHex(run: () => unknown) {
			try {
				run();
				return false;
			} catch (error) {
				if (
					!(error instanceof Error) ||
					error.message !== 'atom data must be even-length hex bytes'
				)
					throw error;
				return true;
			}
		}
		return {
			validatorRejects: rejectsOddHex(() => protocol.multiVaultValidateCreateAtomsWithUris(inputs)),
			encoderRejects: rejectsOddHex(() => protocol.multiVaultCreateAtomsWithUrisEncode(inputs)),
		};
	},
});

function rungDescriptor(rung: any, structure: any[]) {
	if (!rung) return null;
	return structure[rung.index];
}
export const ladderProofCases: ProofCase[] = ladderCases.map((c: any) => {
	const ladder = trainLadder(c.slug);
	const refStructure = referenceStructure(ladders.ladders[c.slug]);
	return {
		id: `ladder:${c.slug}:${c.label}`,
		input: c.input,
		expected: {
			iid: c.expected.iid,
			rung: rungDescriptor(c.expected.rung, refStructure),
			validates: c.expected.validates,
			anchorEligible: c.expected.anchorEligible,
			raw: c.expected.raw,
			thrown: c.expected.thrown,
		},
		open: ladder ? undefined : `No public declarative ladder maps to ${c.slug}`,
		run: () => {
			const derived = iid.deriveIntuitionId(ladder, c.input) ?? null;
			const index = derived
				? ladder.rungs.findIndex(
						(r: any) =>
							iid.deriveIntuitionId({ ...ladder, rungs: [r] }, c.input)?.iid === derived.iid
					)
				: -1;
			return {
				iid: derived?.iid ?? null,
				rung: index >= 0 ? trainStructure(ladder)[index] : null,
				validates: derived ? iid.validateIntuitionId(derived.iid) : null,
				anchorEligible: derived ? iid.isAnchorEligible(derived.iid) : null,
				raw: derived ? { ...derived, tag: derived.tag ?? null } : null,
				thrown: null,
			};
		},
	};
});
export const structureCases: ProofCase[] = Object.entries(ladders.ladders).map(
	([slug, ref]: [string, any]) => ({
		id: `structure:${slug}`,
		expected: ref ? referenceStructure(ref) : null,
		open: !slugMapping[slug] ? `Unmapped classification ${slug}` : undefined,
		run: () => (trainLadder(slug) ? trainStructure(trainLadder(slug)) : null),
	})
);

function canonicalOutput(c: any, reference: boolean) {
	if (reference) {
		assertCanonicalAgreement(c);
		const recorded = recordedCanonicalOutput(c);
		if (
			c.corpusFile === 'gen1.json' &&
			iid.keccak16(recorded.preimage) !== recorded.iid.split(':').at(-1)
		)
			throw new Error('Gen1 preimage hash differs from IID');
		return recorded;
	}
	switch (c.corpusFile) {
		case 'canonicalization.json': {
			const canonical = iid.SCHEMES[c.input.scheme].canonicalize(c.input.raw);
			// This API documents undefined for rejection; map only that sentinel here.
			if (canonical !== undefined && typeof canonical !== 'string')
				throw new Error('Malformed public canonicalize result');
			return { canonical: canonical === undefined ? null : canonical };
		}
		case 'parse.json': {
			const p = checkedPublicParse(c.input);
			// Map the documented public rejection sentinel once to the corpus null pair.
			return p === undefined ? { scheme: null, value: null } : p;
		}
		case 'norm1.json':
			return { output: iid.norm1(c.input) };
		case 'gen1.json': {
			const fields = Object.fromEntries(
				Object.keys(c.input.fields)
					.sort()
					.map((k) => [k, iid.norm1(c.input.fields[k])])
			);
			const preimage = JSON.stringify({ c: c.input.slug, f: fields });
			const output = iid.buildGen1Iid(c.input.slug, c.input.tag, c.input.fields);
			if (iid.keccak16(preimage) !== output.split(':').at(-1))
				throw new Error('Gen1 preimage hash differs from IID');
			return { preimage, iid: output };
		}
		default:
			throw new Error(`Unknown corpus ${c.corpusFile}`);
	}
}
export const canonicalCases: ProofCase[] = canonicalization.cases.flatMap((c: any) => [
	{
		id: `corpus-train:${c.id}`,
		input: c.input,
		expected: c.corpusExpected,
		run: () => canonicalOutput(c, false),
	},
	{ id: c.id, input: c.input, expected: c.corpusExpected, run: () => canonicalOutput(c, true) },
]);
export const proofs: Record<string, ProofCase[]> = {
	'parse-and-classify': parseCases,
	'anchor-build-hash': anchorProofCases,
	'encode-decode': encodeCases,
	'ladder-differential': [...structureCases, ...ladderProofCases],
	'canonicalization-parity': canonicalCases,
};
