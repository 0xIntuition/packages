import { classifications, primitives } from './public';
import { ladders } from './vectors';

/** Slugs map by identical schema type, not guessed spelling. Slug changes would
 * affect gen1 preimages, so the evaluator keeps the train's declared slug.
 */
export const slugMapping: Record<string, string | null> = Object.fromEntries(
	Object.entries(ladders.ladders).map(([slug, ref]: [string, any]) => {
		if (!ref) return [slug, classifications.getClassification(slug)?.slug ?? null];
		const matches = classifications.CLASSIFICATION_SPECS.filter(
			(s: any) => s.type === ref.classificationType
		);
		return [slug, matches.length === 1 ? matches[0].slug : null];
	})
);
export function trainLadder(slug: string) {
	const mapped = slugMapping[slug] ?? slug;
	const spec = classifications.getClassification(mapped);
	return spec?.identity?.ladder
		? { slug: spec.slug, identifies: spec.identity.identifies, rungs: spec.identity.ladder }
		: null;
}

/** Reference buildAtomAnchor(spec, values, {candidateIid}) maps to the public
 * buildIidAnchor(slug, values, options). Slug is resolved by schema type; values
 * pass unchanged. The public options have no candidateIid and expose no fallback
 * or searchText. We never synthesize candidate fields: those proofs stay OPEN.
 */
export function buildAnchor(c: any) {
	const result = primitives.buildIidAnchor(
		slugMapping[c.input.slug] ?? c.input.slug,
		c.input.values
	);
	if (!result.success) return { ok: false, errors: result.errors };
	return { ok: true, anchor: result.value };
}

const derivationReads: Record<string, string[]> = {
	'acct-strong': ['platform', 'platformUserId'],
	'acct-weak': ['platform', 'username'],
	'appid-bundle': ['bundleId', 'operatingSystem'],
	'rss-item': ['feedGuid', 'itemGuid'],
	'termset-term': ['inDefinedTermSet', 'termCode'],
	'caip10-eoa': ['address'],
	'caip10-contract': ['address', 'chainId'],
	'caip19-erc20': ['address', 'chainId'],
};
export function sourceReads(source: any): string[] {
	switch (source.kind) {
		case 'field':
		case 'url-origin':
		case 'podcast-guid':
			return [source.key];
		case 'same-as':
			return ['sameAs'];
		case 'geohash':
			return ['latitude', 'longitude'];
		case 'derivation': {
			const reads = derivationReads[source.name];
			if (!reads) throw new Error(`Unmapped public derivation: ${source.name}`);
			return reads;
		}
		default:
			throw new Error(`Unmapped public source: ${source.kind}`);
	}
}
export function recipeReads(field: any): string[] {
	if (field.from === 'geohash') return ['latitude', 'longitude'];
	return [field.of ?? field.key];
}
export function trainStructure(ladder: any) {
	return ladder.rungs.map((r: any) => ({
		kind: r.kind,
		scheme: r.scheme ?? 'gen1',
		tag: r.tag ?? null,
		reads: (r.kind === 'scheme'
			? sourceReads(r.source)
			: [...new Set(r.recipe.flatMap(recipeReads))]
		).sort(),
		fields:
			r.kind === 'gen1'
				? r.recipe.map((f: any) => ({ key: f.key, reads: recipeReads(f).sort() }))
				: null,
	}));
}
export function referenceStructure(ladder: any) {
	return ladder.rungs.map((r: any) => ({
		kind: r.kind,
		scheme: r.scheme,
		tag: r.tag,
		reads: [...r.reads].sort(),
		fields: r.fields?.map((f: any) => ({ key: f.key, reads: [...f.reads].sort() })) ?? null,
	}));
}
