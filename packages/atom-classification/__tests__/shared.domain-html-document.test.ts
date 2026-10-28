import { describe, expect, it } from 'bun:test';

import {
	decodeHtmlEntities,
	extractCanonicalUrl,
	extractMetaContent,
} from '../src/plugins/shared/domain-html/document';

// Root-cause guard found while building the places/OpenGraph fixes: the
// attribute-value regexes used a single "either quote" character class
// (["'][^"']+["']) instead of matching the SAME quote that opened the
// attribute. A double-quoted content value containing a literal apostrophe
// (extremely common in real business/company names — "Joe's Pizza",
// "McDonald's", "Trader Joe's") silently truncated at the apostrophe.
describe('domain-html document parsing', () => {
	it('extracts a double-quoted meta content value containing an apostrophe', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Joe's Pizza · Italian Restaurant" />
			</head></html>
		`;

		expect(extractMetaContent(html, 'og:title')).toBe("Joe's Pizza · Italian Restaurant");
	});

	it('still supports single-quoted meta attributes', () => {
		const html = `<meta property='og:title' content='OpenAI' />`;
		expect(extractMetaContent(html, 'og:title')).toBe('OpenAI');
	});

	it('extracts content when content precedes the name/property attribute', () => {
		const html = `<meta content="Trader Joe's" name="og:title" />`;
		expect(extractMetaContent(html, 'og:title')).toBe("Trader Joe's");
	});

	it('extracts a canonical href containing an apostrophe', () => {
		const html = `<link rel="canonical" href="https://example.com/mcdonald's-menu" />`;
		expect(extractCanonicalUrl(html)).toBe("https://example.com/mcdonald's-menu");
	});

	it('decodes named and numeric HTML entities at the metadata boundary', () => {
		const html =
			'<meta property="og:title" content="Spring &ndash; Summer &amp; Fall &#8212; Winter &#x2014; Finale" />';

		expect(extractMetaContent(html, 'og:title')).toBe('Spring – Summer & Fall — Winter — Finale');
	});

	it('decodes standard HTML5 named references without changing delimiter semantics', () => {
		expect(decodeHtmlEntities('Caf&eacute;')).toBe('Café');
		expect(decodeHtmlEntities('Schr&ouml;dinger &mdash; A Biography&hellip;')).toBe(
			'Schrödinger — A Biography…'
		);
		expect(decodeHtmlEntities('&amp;')).toBe('&');
		expect(decodeHtmlEntities('&lt;')).toBe('<');
	});

	it('decodes escaped entity text exactly once', () => {
		expect(decodeHtmlEntities('&amp;ndash;')).toBe('&ndash;');
		expect(decodeHtmlEntities('&amp;amp;')).toBe('&amp;');
	});

	it('does not rescan entity text emitted by numeric ampersand references', () => {
		expect(decodeHtmlEntities('&#38;ndash;')).toBe('&ndash;');
		expect(decodeHtmlEntities('&#x26;#8211;')).toBe('&#8211;');
	});

	it('passes malformed and invalid numeric entities through unchanged', () => {
		expect(decodeHtmlEntities('&#999999999;')).toBe('&#999999999;');
		expect(decodeHtmlEntities('&#0;')).toBe('&#0;');
		expect(decodeHtmlEntities('&#;')).toBe('&#;');
		expect(decodeHtmlEntities('&#x;')).toBe('&#x;');
		expect(decodeHtmlEntities('&#xD800;')).toBe('&#xD800;');
	});

	it('decodes spec-defined uppercase entity variants without case-folding names', () => {
		expect(decodeHtmlEntities('&AMP;')).toBe('&');
		expect(decodeHtmlEntities('&#X26;')).toBe('&');
		expect(decodeHtmlEntities('&NDASH;')).toBe('&NDASH;');
	});

	it('decodes metadata content exactly once at the boundary', () => {
		expect(
			extractMetaContent('<meta property="og:title" content="&amp;ndash;" />', 'og:title')
		).toBe('&ndash;');
		expect(extractMetaContent('<meta property="og:title" content="&amp;amp;" />', 'og:title')).toBe(
			'&amp;'
		);
	});
});
