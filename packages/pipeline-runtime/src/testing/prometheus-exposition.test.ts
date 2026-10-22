import { describe, expect, test } from 'vitest';
import {
	checkExpositionStructure,
	promtoolAvailable,
	promtoolPassed,
	runPromtool,
} from './prometheus-exposition';

const VALID = `# HELP a_total A counter.
# TYPE a_total counter
a_total{x="1"} 1
a_total{x="2"} 0
# HELP h_seconds A histogram.
# TYPE h_seconds histogram
h_seconds_bucket{op="w",le="0.1"} 1
h_seconds_bucket{op="w",le="1"} 2
h_seconds_bucket{op="w",le="+Inf"} 3
h_seconds_sum{op="w"} 4.5
h_seconds_count{op="w"} 3
# HELP g A gauge.
# TYPE g gauge
g 1
`;

describe('checkExpositionStructure', () => {
	test('accepts a sound exposition', () => {
		expect(checkExpositionStructure(VALID)).toEqual([]);
	});

	test('rejects a second # TYPE for the same family', () => {
		const text = `${VALID}# TYPE a_total counter\n`;
		expect(checkExpositionStructure(text)).toContainEqual(
			expect.stringContaining('duplicate # TYPE for a_total')
		);
	});

	test('rejects samples of one family that are not contiguous', () => {
		const text = VALID.replace('a_total{x="2"} 0\n', '').replace(
			'g 1\n',
			'g 1\na_total{x="2"} 0\n'
		);
		expect(checkExpositionStructure(text)).toContainEqual(
			expect.stringContaining('samples of a_total are not contiguous')
		);
	});

	test('rejects a histogram whose cumulative buckets decrease', () => {
		const text = VALID.replace('le="1"} 2', 'le="1"} 0');
		expect(checkExpositionStructure(text)).toContainEqual(
			expect.stringContaining('cumulative bucket decreases')
		);
	});

	test('rejects bucket bounds that do not increase', () => {
		const text = VALID.replace('le="1"} 2', 'le="0.1"} 2');
		expect(checkExpositionStructure(text)).toContainEqual(
			expect.stringContaining('bounds are not increasing')
		);
	});

	test('rejects +Inf differing from _count', () => {
		const text = VALID.replace('h_seconds_count{op="w"} 3', 'h_seconds_count{op="w"} 4');
		expect(checkExpositionStructure(text)).toContainEqual(
			expect.stringContaining('+Inf bucket 3 differs from _count 4')
		);
	});

	test('rejects a histogram without its +Inf bucket', () => {
		const text = VALID.replace('h_seconds_bucket{op="w",le="+Inf"} 3\n', '');
		expect(checkExpositionStructure(text)).toContainEqual(
			expect.stringContaining('missing the +Inf bucket')
		);
	});

	test('rejects NaN, duplicates, unparseable lines and samples with no # TYPE', () => {
		expect(checkExpositionStructure(`${VALID}# TYPE n gauge\nn NaN\n`)).toContainEqual(
			expect.stringContaining('n is NaN')
		);
		expect(
			checkExpositionStructure(VALID.replace('a_total{x="2"} 0', 'a_total{x="1"} 0'))
		).toContainEqual(expect.stringContaining('duplicate series'));
		expect(checkExpositionStructure(`${VALID}!!! not a sample\n`)).toContainEqual(
			expect.stringContaining('unparseable sample')
		);
		expect(checkExpositionStructure(`${VALID}orphan 1\n`)).toContainEqual(
			expect.stringContaining('orphan has no # TYPE')
		);
	});

	test('treats histogram series with different base labels as separate series', () => {
		const second = VALID.replace(/op="w"/gu, 'op="v"')
			.split('\n')
			.filter((line) => !line.startsWith('#') && line.startsWith('h_seconds'))
			.join('\n');
		const text = VALID.replace('# HELP g', `${second}\n# HELP g`);
		expect(checkExpositionStructure(text)).toEqual([]);
	});
});

describe('promtool helpers', () => {
	test.skipIf(!promtoolAvailable() && !process.env.CI)(
		'promtool is available whenever CI is set',
		() => {
			expect(promtoolAvailable()).toBe(true);
		}
	);

	test.skipIf(!promtoolAvailable())(
		'flags an unparsable TYPE as a parse error and not as a pass',
		() => {
			const result = runPromtool(
				VALID.replace('# TYPE h_seconds histogram', '# TYPE h_seconds histogramm')
			);
			expect(result.parseError).toBe(true);
			expect(promtoolPassed(result)).toBe(false);
		}
	);

	test.skipIf(!promtoolAvailable())(
		'passes a sound exposition, and allows a listed lint finding only',
		() => {
			expect(promtoolPassed(runPromtool(VALID))).toBe(true);
			const withLint = `${VALID}# HELP up_ms Uptime.\n# TYPE up_ms gauge\nup_ms 1\n`;
			const strict = runPromtool(withLint);
			expect(promtoolPassed(strict)).toBe(false);
			expect(
				promtoolPassed(
					runPromtool(withLint, [/up_ms metric names should not contain abbreviated units/u])
				)
			).toBe(true);
		}
	);
});
