import type { ExpectedObject } from '@0xintuition/classifications';
import { buildAtomDataObject, validateClassificationValues } from '@0xintuition/classifications';
import { useMemo, useState } from 'react';
import { lifecycle, sampleObjectsByPredicate, sampleValues } from './package-lifecycle.js';

type StringMap = Record<string, string>;

const initialFieldValues = Object.fromEntries(
	lifecycle.fields.map((field) => [
		field.key,
		String(sampleValues[field.key as keyof typeof sampleValues] ?? ''),
	])
) as StringMap;

const initialTargetValues = Object.fromEntries(
	lifecycle.metadataPredicates.map((relation) => [
		relation.predicateKey,
		String(
			sampleObjectsByPredicate[relation.predicateKey as keyof typeof sampleObjectsByPredicate] ?? ''
		),
	])
) as StringMap;

export function Playground() {
	const [fieldValues, setFieldValues] = useState<StringMap>(initialFieldValues);
	const [targetValues, setTargetValues] = useState<StringMap>(initialTargetValues);

	const normalizedFieldValues = useMemo(() => normalizeFieldValues(fieldValues), [fieldValues]);
	const validationIssues = useMemo(
		() => validateClassificationValues(lifecycle.classification.slug, normalizedFieldValues),
		[normalizedFieldValues]
	);
	const atomData = useMemo(() => {
		if (validationIssues.length > 0) {
			return null;
		}

		return buildAtomDataObject(lifecycle.classification.slug, normalizedFieldValues);
	}, [normalizedFieldValues, validationIssues]);

	const subjectLabel = fieldValues.name?.trim() || 'Current song atom';
	const triples = lifecycle.metadataPredicates.map((relation) => ({
		subject: subjectLabel,
		predicateKey: relation.predicateKey,
		predicateId: relation.predicateId,
		object: targetValues[relation.predicateKey]?.trim() || 'Choose or create target atom',
		expectedObjects: relation.expectedObjects.map(formatExpectedObject),
	}));

	return (
		<section className="playground-section" aria-label="Local package playground">
			<div className="section-heading">
				<p className="section-label">Local playground</p>
				<h2>Change the song data and see what the packages derive.</h2>
				<p>
					This is the middle ground: no API key, no wallet, no writes. It uses the packages live in
					the browser to validate atom data and keep metadata predicates as separate relationship
					previews.
				</p>
			</div>

			<div className="playground-grid">
				<div className="playground-card">
					<div className="playground-card-header">
						<h3>Atom fields</h3>
						<span>{validationIssues.length === 0 ? 'valid' : 'needs input'}</span>
					</div>
					<div className="input-list">
						{lifecycle.fields.map((field) => (
							<label className="input-row" key={field.key}>
								<span>
									{field.label}
									{field.required ? ' *' : ''}
								</span>
								<input
									type="text"
									value={fieldValues[field.key] ?? ''}
									placeholder={field.placeholder}
									onChange={(event) =>
										setFieldValues((current) => ({
											...current,
											[field.key]: event.target.value,
										}))
									}
								/>
								<small>
									{field.schemaProperty ? `schema:${field.schemaProperty}` : 'local field'}
								</small>
							</label>
						))}
					</div>
					{validationIssues.length > 0 ? (
						<ul className="issue-list">
							{validationIssues.map((issue) => (
								<li key={`${issue.field ?? 'root'}-${issue.message}`}>{issue.message}</li>
							))}
						</ul>
					) : null}
				</div>

				<div className="playground-card">
					<div className="playground-card-header">
						<h3>Relationship targets</h3>
						<span>{triples.length} predicates</span>
					</div>
					<div className="input-list">
						{lifecycle.metadataPredicates.map((relation) => (
							<label className="input-row" key={relation.predicateKey}>
								<span>{relation.predicateKey}</span>
								<input
									type="text"
									value={targetValues[relation.predicateKey] ?? ''}
									onChange={(event) =>
										setTargetValues((current) => ({
											...current,
											[relation.predicateKey]: event.target.value,
										}))
									}
								/>
								<small>
									expects {relation.expectedObjects.map(formatExpectedObject).join(' or ')}
								</small>
							</label>
						))}
					</div>
				</div>

				<div className="playground-card output-card">
					<div className="playground-card-header">
						<h3>Atom data output</h3>
						<span>{atomData ? 'ready' : 'blocked'}</span>
					</div>
					<pre className="code-block">
						{atomData
							? JSON.stringify(atomData, null, 2)
							: 'Fix required fields to generate atom data.'}
					</pre>
				</div>

				<div className="playground-card output-card">
					<div className="playground-card-header">
						<h3>Triple plan output</h3>
						<span>local preview</span>
					</div>
					<pre className="code-block">{JSON.stringify(triples, null, 2)}</pre>
				</div>
			</div>
		</section>
	);
}

function normalizeFieldValues(values: StringMap): Record<string, string | string[]> {
	const normalizedEntries: Array<[string, string | string[]]> = [];

	for (const field of lifecycle.fields) {
		const value = values[field.key]?.trim();

		if (!value) {
			continue;
		}

		if (field.fieldType === 'string[]') {
			normalizedEntries.push([
				field.key,
				value
					.split(/[\n,]/)
					.map((entry) => entry.trim())
					.filter(Boolean),
			]);
			continue;
		}

		normalizedEntries.push([field.key, value]);
	}

	return Object.fromEntries(normalizedEntries);
}

function formatExpectedObject(object: ExpectedObject): string {
	switch (object.kind) {
		case 'classification':
			return `classification:${object.slug}`;
		case 'schema':
			return `schema:${object.type}`;
		case 'primitive':
			return `primitive:${object.valueType}`;
		case 'same-classification':
			return 'same classification';
		case 'any':
			return `any:${object.reason}`;
		default:
			return object satisfies never;
	}
}
