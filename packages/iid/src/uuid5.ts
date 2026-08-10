import { sha1Bytes } from './sha1.js';

/**
 * Podcasting 2.0 `podcast:guid` namespace. A feed's GUID is UUIDv5 over this
 * namespace of the feed URL with scheme and trailing slashes stripped —
 * derivable fully offline.
 */
export const PODCAST_GUID_NAMESPACE = 'ead4c236-bf58-58c6-a2c6-a6b28d128cb6';

const encoder = new TextEncoder();

/** RFC 4122 UUIDv5 (SHA-1 based, name within a namespace). */
export function uuidv5(name: string, namespaceUuid: string): string {
	const namespaceHex = namespaceUuid.replace(/-/g, '');

	if (!/^[0-9a-f]{32}$/i.test(namespaceHex)) {
		throw new Error(`Invalid namespace UUID: ${namespaceUuid}`);
	}

	const nameBytes = encoder.encode(name);
	const data = new Uint8Array(16 + nameBytes.length);

	for (let i = 0; i < 16; i++) {
		data[i] = Number.parseInt(namespaceHex.slice(i * 2, i * 2 + 2), 16);
	}

	data.set(nameBytes, 16);

	const digest = sha1Bytes(data);
	const bytes = Array.from(digest.slice(0, 16));

	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

	const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** Derive a feed's Podcasting 2.0 GUID from its URL (offline, deterministic). */
export function derivePodcastGuid(feedUrl: string): string {
	const stripped = feedUrl
		.trim()
		.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
		.replace(/\/+$/, '');

	return uuidv5(stripped, PODCAST_GUID_NAMESPACE);
}
