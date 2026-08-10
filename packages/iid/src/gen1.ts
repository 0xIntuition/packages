import { keccak16 } from './hash.js';
import { norm1 } from './norm.js';
import type { IntuitionId } from './types.js';

/**
 * Build a `gen1` derived IID (spec §6):
 *
 *   int:gen1:<classification-slug>:r<tag>:<keccak16>
 *
 * The preimage is a JCS-style canonical JSON object over the NORM-1
 * normalized recipe fields, sorted by key. The rung tag is a STABLE recipe
 * identifier (spec §6.4) — it annotates the ID but does not enter the hash.
 */
export function buildGen1Iid(
	slug: string,
	tag: number,
	fields: Record<string, string>
): IntuitionId {
	if (!/^[a-z0-9-]+$/.test(slug)) {
		throw new Error(`Invalid classification slug for gen1: "${slug}"`);
	}

	if (!Number.isInteger(tag) || tag < 1) {
		throw new Error(`Invalid gen1 rung tag: ${tag}`);
	}

	const keys = Object.keys(fields).sort();

	if (keys.length === 0) {
		throw new Error('gen1 recipes require at least one field');
	}

	const normalized: Record<string, string> = {};

	for (const key of keys) {
		const value = norm1(fields[key] ?? '');

		if (value.length === 0) {
			throw new Error(`gen1 recipe field "${key}" is empty after NORM-1`);
		}

		normalized[key] = value;
	}

	const preimage = JSON.stringify({ c: slug, f: normalized });
	return `int:gen1:${slug}:r${tag}:${keccak16(preimage)}`;
}
