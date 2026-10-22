import { spawnSync } from 'node:child_process';

/**
 * Test helpers for Prometheus text exposition, used by the api and the workers.
 * `checkExpositionStructure` is pure JavaScript and always runs; `runPromtool`
 * adds promtool's own parser on top when the binary is installed.
 */

type Sample = { name: string; labels: Map<string, string>; value: number; line: number };

function parseLabels(raw: string | undefined): Map<string, string> | undefined {
	const labels = new Map<string, string>();
	if (!raw) return labels;
	const rest = raw.replace(
		/([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/gu,
		(_pair, key: string, value: string) => {
			labels.set(key, value);
			return '';
		}
	);
	// Commas between pairs are the only other characters a valid label set may contain.
	return rest.replace(/,/gu, '').trim() === '' ? labels : undefined;
}

function parseSample(text: string, line: number): Sample | undefined {
	const match = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+(\S+)(?:\s+\S+)?$/u.exec(text);
	if (!match) return undefined;
	const labels = parseLabels(match[2]);
	if (!labels) return undefined;
	const value = match[3] === '+Inf' ? Number.POSITIVE_INFINITY : Number(match[3]);
	return { name: match[1] as string, labels, value, line };
}

const HISTOGRAM_SUFFIXES = ['_bucket', '_sum', '_count'] as const;

function familyOf(name: string, types: Map<string, string>): string {
	for (const suffix of HISTOGRAM_SUFFIXES) {
		if (name.endsWith(suffix)) {
			const base = name.slice(0, -suffix.length);
			const type = types.get(base);
			if (type === 'histogram' || type === 'summary') return base;
		}
	}
	return name;
}

function labelsKey(labels: Map<string, string>, without?: string): string {
	return [...labels.entries()]
		.filter(([key]) => key !== without)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, value]) => `${key}=${value}`)
		.join(',');
}

type HistogramSeries = {
	buckets: Array<{ le: number; value: number; line: number }>;
	count?: number;
};

function checkHistograms(histograms: Map<string, HistogramSeries>, problems: string[]): void {
	for (const [key, series] of histograms) {
		let previous: { le: number; value: number } | undefined;
		for (const bucket of series.buckets) {
			if (previous && bucket.le <= previous.le) {
				problems.push(`${key}: bucket bounds are not increasing at line ${bucket.line}`);
			}
			if (previous && bucket.value < previous.value) {
				problems.push(`${key}: cumulative bucket decreases at line ${bucket.line}`);
			}
			previous = bucket;
		}
		const last = series.buckets.at(-1);
		if (!last || last.le !== Number.POSITIVE_INFINITY) {
			problems.push(`${key}: missing the +Inf bucket`);
		} else if (series.count !== undefined && last.value !== series.count) {
			problems.push(`${key}: +Inf bucket ${last.value} differs from _count ${series.count}`);
		}
		if (series.count === undefined) problems.push(`${key}: missing _count`);
	}
}

/**
 * Structural problems of an exposition, or an empty list when it is sound:
 * a `# TYPE` at most once per family and before its samples, the samples of a
 * family contiguous, every sample parseable with a number value, no duplicate
 * series, histogram buckets non-decreasing with `+Inf` equal to `_count`.
 */
export function checkExpositionStructure(text: string): string[] {
	const problems: string[] = [];
	const types = new Map<string, string>();
	const closed = new Set<string>();
	const seen = new Set<string>();
	const histograms = new Map<string, HistogramSeries>();
	let current: string | undefined;

	const lines = text.split('\n');
	lines.forEach((raw, index) => {
		const line = index + 1;
		const trimmed = raw.trim();
		if (trimmed === '') return;
		const typeMatch = /^# TYPE (\S+) (\S+)$/u.exec(trimmed);
		if (typeMatch) {
			const [, name, type] = typeMatch as unknown as [string, string, string];
			if (types.has(name)) problems.push(`line ${line}: duplicate # TYPE for ${name}`);
			types.set(name, type);
			return;
		}
		if (trimmed.startsWith('#')) return;
		const sample = parseSample(trimmed, line);
		if (!sample) {
			problems.push(`line ${line}: unparseable sample "${trimmed.slice(0, 80)}"`);
			return;
		}
		if (Number.isNaN(sample.value)) problems.push(`line ${line}: ${sample.name} is NaN`);
		const family = familyOf(sample.name, types);
		if (!types.has(family))
			problems.push(`line ${line}: ${family} has no # TYPE before its samples`);
		if (current !== family) {
			if (current) closed.add(current);
			if (closed.has(family))
				problems.push(`line ${line}: samples of ${family} are not contiguous`);
			current = family;
		}
		const identity = `${sample.name}{${labelsKey(sample.labels)}}`;
		if (seen.has(identity)) problems.push(`line ${line}: duplicate series ${identity}`);
		seen.add(identity);

		if (types.get(family) === 'histogram') {
			const key = `${family}{${labelsKey(sample.labels, 'le')}}`;
			const series = histograms.get(key) ?? { buckets: [] };
			histograms.set(key, series);
			if (sample.name === `${family}_bucket`) {
				const le = sample.labels.get('le');
				series.buckets.push({
					le: le === '+Inf' ? Number.POSITIVE_INFINITY : Number(le),
					value: sample.value,
					line,
				});
			} else if (sample.name === `${family}_count`) {
				series.count = sample.value;
			}
		}
	});
	checkHistograms(histograms, problems);
	return problems;
}

export type PromtoolResult = {
	status: number | null;
	stderr: string;
	/** promtool could not parse the text at all. */
	parseError: boolean;
	/** stderr lines not covered by an allowed pattern. */
	findings: string[];
};

export function promtoolAvailable(): boolean {
	return spawnSync('promtool', ['--version']).status === 0;
}

/**
 * `promtool check metrics` over the text. Lint findings matching an allowed
 * pattern (known, pre-existing ones) are dropped from `findings`; a parse error
 * is never allowable. A clean run exits 0, a run with only allowed findings
 * exits 3 (promtool's lint status).
 */
export function runPromtool(text: string, allowed: readonly RegExp[] = []): PromtoolResult {
	const result = spawnSync('promtool', ['check', 'metrics'], { input: text, encoding: 'utf8' });
	const stderr = result.stderr ?? '';
	const lines = stderr.split('\n').filter((line) => line.trim() !== '');
	return {
		status: result.status,
		stderr,
		parseError: /parsing error/u.test(stderr),
		findings: lines.filter((line) => !allowed.some((pattern) => pattern.test(line))),
	};
}

/** True when the promtool run is clean apart from the allowed lint findings. */
export function promtoolPassed(result: PromtoolResult): boolean {
	if (result.parseError || result.findings.length > 0) return false;
	return result.stderr.trim() === '' ? result.status === 0 : result.status === 3;
}
