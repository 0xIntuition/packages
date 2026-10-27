import { toRecordMaybe, toStringMaybe } from '../helpers';
import { HTML5_NAMED_CHARACTER_REFERENCES } from './html5-named-character-references';

const HTML_ENTITY_PATTERN = /&(?:[A-Za-z][A-Za-z0-9]+|#\d+|#[xX][0-9a-fA-F]+);/g;

// A double-quoted attribute value may legitimately contain a literal
// apostrophe (business/company names: "Joe's Pizza", "McDonald's"), and vice
// versa for single-quoted values containing a double quote. Matching either
// quote character generically (["'][^"']+["']) truncates at the FIRST quote
// of either kind found inside the value. Requiring the closing delimiter to
// match the opening one (via backreference) fixes this without otherwise
// changing behavior for the common no-embedded-quote case.
function quotedValuePattern(groupName: string): string {
	return `(["'])(?<${groupName}>(?:(?!\\1)[\\s\\S])*?)\\1`;
}

export function extractCanonicalUrl(html: string): string | undefined {
	return extractAttributeValue(
		html,
		new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=${quotedValuePattern('value')}[^>]*>`, 'i')
	);
}

export function extractMetaContent(html: string, name: string): string | undefined {
	const escapedName = escapeRegExp(name);
	const content =
		extractAttributeValue(
			html,
			new RegExp(
				`<meta[^>]+name=["']${escapedName}["'][^>]+content=${quotedValuePattern('value')}[^>]*>`,
				'i'
			)
		) ??
		extractAttributeValue(
			html,
			new RegExp(
				`<meta[^>]+content=${quotedValuePattern('value')}[^>]+name=["']${escapedName}["'][^>]*>`,
				'i'
			)
		) ??
		extractAttributeValue(
			html,
			new RegExp(
				`<meta[^>]+property=["']${escapedName}["'][^>]+content=${quotedValuePattern('value')}[^>]*>`,
				'i'
			)
		) ??
		extractAttributeValue(
			html,
			new RegExp(
				`<meta[^>]+content=${quotedValuePattern('value')}[^>]+property=["']${escapedName}["'][^>]*>`,
				'i'
			)
		);

	// extractAttributeValue already decodes the captured value exactly once.
	return content;
}

export function extractDocumentTitle(html: string): string | undefined {
	const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	return decodeHtmlEntities(stripHtml(match?.[1]));
}

export function extractElementTextById(html: string, id: string): string | undefined {
	const escapedId = escapeRegExp(id);
	const match = html.match(
		new RegExp(`<([a-z0-9]+)[^>]*id=["']${escapedId}["'][^>]*>([\\s\\S]*?)<\\/\\1>`, 'i')
	);
	if (!match) {
		return undefined;
	}

	return decodeHtmlEntities(stripHtml(match[2]));
}

export function extractAttributeValue(html: string, pattern: RegExp): string | undefined {
	const match = html.match(pattern);
	// Patterns built via quotedValuePattern() capture into a named "value"
	// group; other callers' inline patterns still rely on numbered group 1.
	return decodeHtmlEntities(match?.groups?.value ?? match?.[1]);
}

export function extractPrimaryJsonLd(html: string): Record<string, unknown> | undefined {
	const matches = html.matchAll(
		/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
	);

	for (const match of matches) {
		const raw = match[1]?.trim();
		if (!raw) {
			continue;
		}

		try {
			const parsed = JSON.parse(raw) as unknown;
			if (Array.isArray(parsed)) {
				for (const entry of parsed) {
					const record = toRecordMaybe(entry);
					if (record && toStringMaybe(record['@type'])) {
						return record;
					}
				}
				continue;
			}

			const record = toRecordMaybe(parsed);
			if (record && toStringMaybe(record['@type'])) {
				return record;
			}
		} catch {}
	}

	return undefined;
}

export function extractJsonLdByType(
	html: string,
	expectedType: string
): Record<string, unknown> | undefined {
	return extractJsonLdRecordsByType(html, expectedType)[0];
}

export function extractJsonLdRecordsByType(
	html: string,
	expectedType: string
): Record<string, unknown>[] {
	const matches = html.matchAll(
		/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
	);
	const records: Record<string, unknown>[] = [];
	const visited = new Set<object>();

	for (const match of matches) {
		const raw = match[1]?.trim();
		if (!raw) continue;
		try {
			const pending: unknown[] = [JSON.parse(raw) as unknown];
			while (pending.length > 0) {
				const value = pending.shift();
				if (Array.isArray(value)) {
					pending.unshift(...value);
					continue;
				}
				const record = toRecordMaybe(value);
				if (!record || visited.has(record)) continue;
				visited.add(record);
				const rawType = record['@type'];
				const types = Array.isArray(rawType) ? rawType : [rawType];
				if (types.some((type) => type === expectedType)) {
					records.push(record);
				}
				pending.unshift(...Object.values(record));
			}
		} catch {}
	}

	return records;
}

export function stripHtml(value: string | undefined): string {
	return (value ?? '').replace(/<[^>]+>/g, ' ');
}

export function decodeHtmlEntities(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	return value
		.replace(HTML_ENTITY_PATTERN, (entity) => {
			if (entity.startsWith('&#')) {
				const isHex = entity[2] === 'x' || entity[2] === 'X';
				const codePoint = Number.parseInt(entity.slice(isHex ? 3 : 2, -1), isHex ? 16 : 10);
				const isValidCodePoint =
					codePoint > 0 && codePoint <= 0x10ffff && (codePoint < 0xd800 || codePoint > 0xdfff);

				return isValidCodePoint ? String.fromCodePoint(codePoint) : entity;
			}
			return HTML5_NAMED_CHARACTER_REFERENCES[entity.slice(1)] ?? entity;
		})
		.trim();
}

export function normalizeWhitespace(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const normalized = value.replace(/\s+/g, ' ').trim();
	return normalized.length > 0 ? normalized : undefined;
}

export function normalizeStringArray(values: string[]): string[] {
	return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
