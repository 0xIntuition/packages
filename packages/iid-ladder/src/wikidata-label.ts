/** Select labels and descriptions only from the requested locale and stable fallbacks. */
export function pickWikidataLabel(
	labels: Readonly<Record<string, unknown>> | undefined,
	language = 'en'
): string | undefined {
	for (const locale of [language, 'en', 'en-gb', 'en-us', 'en-ca', 'en-au', 'mul']) {
		const entry = labels?.[locale];
		if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
		const value = (entry as { value?: unknown }).value;
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	return undefined;
}
