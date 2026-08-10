#!/usr/bin/env node

/**
 * Conformance-corpus integrity test for @0xintuition/iid-spec.
 *
 * A documentation-only package still has a testable contract: the fixture
 * files must match conformance/schema.json, cover every registered scheme
 * with positive and negative vectors, carry globally unique fixture IDs,
 * and the document set must be complete, internally linked, and free of
 * private-monorepo references.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageRoot = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFileSync(resolve(packageRoot, path), 'utf8');
const readJson = (path) => JSON.parse(read(path));

const SCHEME_NAMES = readJson('conformance/schema.json').$defs.schemeName.enum;
assert.equal(SCHEME_NAMES.length, 26, 'schema must register exactly 26 schemes');

const FIXTURE_FILES = ['canonicalization', 'norm1', 'gen1', 'parse', 'validation', 'schemes'];

const allIds = new Set();
const fixtures = {};

for (const name of FIXTURE_FILES) {
	const data = readJson(`conformance/${name}.json`);
	fixtures[name] = data;
	assert.match(data.specVersion, /^\d+\.\d+\.\d+$/, `${name}: specVersion`);
	assert.ok(
		Number.isInteger(data.fixtureVersion) && data.fixtureVersion >= 1,
		`${name}: fixtureVersion`
	);
	assert.equal(data.kind, name, `${name}: kind must match filename`);

	for (const vector of data.vectors ?? []) {
		assert.match(vector.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${name}: vector id shape ${vector.id}`);
		assert.ok(!allIds.has(vector.id), `duplicate fixture ID ${vector.id}`);
		allIds.add(vector.id);
	}
}

// --- canonicalization coverage: every scheme, positive and negative ---
const coverage = new Map(SCHEME_NAMES.map((scheme) => [scheme, { pos: 0, neg: 0 }]));
for (const vector of fixtures.canonicalization.vectors) {
	assert.ok(coverage.has(vector.scheme), `unknown scheme ${vector.scheme} in ${vector.id}`);
	assert.ok(typeof vector.raw === 'string' && vector.raw.length > 0, `${vector.id}: raw`);
	const stats = coverage.get(vector.scheme);
	if (vector.canonical === null) stats.neg++;
	else {
		assert.ok(
			typeof vector.canonical === 'string' && vector.canonical.length > 0,
			`${vector.id}: canonical`
		);
		stats.pos++;
	}
}
for (const [scheme, stats] of coverage) {
	assert.ok(stats.pos >= 1, `${scheme}: no positive canonicalization vector`);
	assert.ok(stats.neg >= 1, `${scheme}: no negative canonicalization vector`);
}

// --- scheme registry snapshot ---
const schemes = fixtures.schemes.schemes;
assert.deepEqual(
	Object.keys(schemes).sort(),
	[...SCHEME_NAMES].sort(),
	'schemes.json covers the registry'
);
for (const [scheme, entry] of Object.entries(schemes)) {
	assert.ok(['A', 'B', 'C'].includes(entry.class), `${scheme}: class`);
	assert.ok(['unambiguous', 'polymorphic'].includes(entry.typing), `${scheme}: typing`);
}
assert.equal(schemes.gen1.class, 'C', 'gen1 is the Class C scheme');
assert.equal(
	Object.values(schemes).filter((entry) => entry.class === 'C').length,
	1,
	'exactly one Class C scheme'
);

// --- gen1 vectors: structural integrity of preimage and value ---
for (const vector of fixtures.gen1.vectors) {
	assert.match(
		vector.iid,
		/^int:gen1:[a-z0-9-]+:r[1-9]\d*:[0-9a-f]{32}$/,
		`${vector.id}: iid shape`
	);
	assert.ok(
		vector.iid.startsWith(`int:gen1:${vector.slug}:r${vector.tag}:`),
		`${vector.id}: slug/tag embed`
	);
	const parsed = JSON.parse(vector.preimage);
	assert.deepEqual(Object.keys(parsed), ['c', 'f'], `${vector.id}: preimage key order`);
	assert.equal(parsed.c, vector.slug, `${vector.id}: preimage slug`);
	assert.deepEqual(
		Object.keys(parsed.f),
		Object.keys(parsed.f).slice().sort(),
		`${vector.id}: sorted fields`
	);
	assert.ok(
		!vector.preimage.includes(' ') || Object.values(parsed.f).some((v) => v.includes(' ')),
		`${vector.id}: preimage has no structural whitespace`
	);
	assert.deepEqual(
		Object.keys(parsed.f).sort(),
		Object.keys(vector.fields).sort(),
		`${vector.id}: recipe fields`
	);
}

// --- validation vectors: anchor eligibility is consistent with class/typing ---
for (const vector of fixtures.validation.vectors) {
	if (vector.anchorEligible) {
		assert.ok(vector.valid, `${vector.id}: anchor-eligible implies valid`);
		const scheme = vector.iid.split(':')[1];
		assert.ok(schemes[scheme].class !== 'C', `${vector.id}: Class C never anchors`);
		assert.equal(schemes[scheme].typing, 'unambiguous', `${vector.id}: polymorphic never anchors`);
	}
}

// --- parse vectors: colon-bearing coverage ---
assert.ok(
	fixtures.parse.vectors.some((vector) => vector.value?.includes(':')),
	'parse vectors must include a colon-bearing value'
);
assert.ok(
	fixtures.parse.vectors.some(
		(vector) => vector.input.startsWith('int:src:') && vector.scheme === null
	),
	'parse vectors must reject the int:src:* user-example guard case'
);

// --- document completeness ---
const specDocs = readdirSync(resolve(packageRoot, 'spec'));
for (let i = 0; i <= 9; i++) {
	assert.ok(
		specDocs.some((doc) => doc.startsWith(`0${i}-`)),
		`spec section 0${i} present`
	);
}
const schemeDocs = new Set(readdirSync(resolve(packageRoot, 'schemes')));
for (const scheme of SCHEME_NAMES) {
	assert.ok(schemeDocs.has(`${scheme}.md`), `schemes/${scheme}.md missing`);
}
assert.ok(schemeDocs.has('README.md'), 'schemes/README.md registry index missing');
for (const doc of ['README.md', 'explainer.md', 'implementation-notes.md', 'LICENSE']) {
	assert.ok(read(doc).length > 0, `${doc} present`);
}

// --- no private-monorepo references in normative content ---
const PRIVATE_PATTERNS = [
	/intuition-v2/,
	/\.planning\//,
	/\]\(\.\.\/iid\)/,
	/\]\(\.\.\/classifications\)/,
];
const contentFiles = [
	'README.md',
	'explainer.md',
	'implementation-notes.md',
	...specDocs.map((doc) => `spec/${doc}`),
	...[...schemeDocs].map((doc) => `schemes/${doc}`),
];
for (const file of contentFiles) {
	const content = read(file);
	for (const pattern of PRIVATE_PATTERNS) {
		assert.ok(!pattern.test(content), `${file}: contains private-monorepo reference ${pattern}`);
	}
}

// --- internal links resolve ---
for (const file of contentFiles) {
	const content = read(file);
	const dir = file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '.';
	for (const match of content.matchAll(/\]\((\.{1,2}\/[^)#]+)(#[^)]*)?\)/g)) {
		const target = resolve(packageRoot, dir, match[1]);
		assert.ok(existsSync(target), `${file}: broken link ${match[1]}`);
	}
}

console.log(
	`iid-spec conformance corpus OK: ${allIds.size} vectors, ${SCHEME_NAMES.length} schemes documented, links resolve, no private references.`
);
