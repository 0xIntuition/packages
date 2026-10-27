import type { ResolverAtom } from '../../plugins';
import type {
	ClassificationCanonicalFieldPolicyMap,
	ClassificationSourceFamily,
} from '../../types';

export type TryParseUrlOptions = {
	// Some platform URLs are pasted/typed without a scheme (e.g. "x.com/handle"
	// instead of "https://x.com/handle"). `new URL()` throws on those, which
	// otherwise silently drops the classifier match and lets the input fall
	// through to the generic default-url plugin — a URL-shape-dependent type
	// flip rather than a deterministic one. Opt in per-plugin so unrelated
	// callers (e.g. tmdb) keep their exact current matching behavior.
	allowBareHost?: boolean;
};

export function tryParseUrl(input: string, options?: TryParseUrlOptions): URL | null {
	const trimmed = input.trim();
	try {
		return new URL(trimmed);
	} catch {
		if (options?.allowBareHost && isLikelyBareHost(trimmed)) {
			try {
				return new URL(`https://${trimmed}`);
			} catch {
				return null;
			}
		}
		return null;
	}
}

function isLikelyBareHost(value: string): boolean {
	if (value.length === 0 || /\s/.test(value) || value.includes('@') || value.includes('://')) {
		return false;
	}

	const [authority] = value.split(/[/?#]/, 1);
	if (!authority || !authority.includes('.')) {
		return false;
	}

	return !authority.startsWith('.') && !authority.endsWith('.');
}

export function toStringMaybe(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function toRecordMaybe(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}

	return value as Record<string, unknown>;
}

export function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

export function toCategory(
	value: string
): 'person' | 'place' | 'thing' | 'company' | 'product' | 'podcast' | 'song' | 'software' {
	if (
		value === 'person' ||
		value === 'place' ||
		value === 'thing' ||
		value === 'company' ||
		value === 'product' ||
		value === 'podcast' ||
		value === 'song' ||
		value === 'software'
	) {
		return value;
	}

	return 'thing';
}

export function withPlatformMetadata(
	atom: ResolverAtom,
	platform: string,
	subtype: string,
	options?: {
		pluginId?: string;
		provider?: string;
		fetchedAt?: string;
		sourceUrl?: string;
		confidence?: number;
		resolutionMode?: 'identity-only' | 'enriched';
		sourceFamily?: ClassificationSourceFamily;
		fieldPolicies?: ClassificationCanonicalFieldPolicyMap;
	}
): ResolverAtom {
	const pluginId = options?.pluginId ?? platform;
	const provider = options?.provider ?? platform;

	return {
		...atom,
		metadata: {
			...(atom.metadata ?? {}),
			pluginId,
			provider,
			fetchedAt: options?.fetchedAt,
			sourceUrl: options?.sourceUrl,
			confidence: options?.confidence,
			resolutionMode: options?.resolutionMode,
			sourceFamily: options?.sourceFamily,
			fieldPolicies: options?.fieldPolicies,
			platform,
			subtype,
		},
	};
}
