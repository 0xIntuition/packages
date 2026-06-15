import type { ExpectedObject } from '@0xintuition/classifications';
import { useState } from 'react';
import {
	type GeneratedFieldControl,
	type GeneratedRelationshipControl,
	type GeneratedUiExampleSlug,
	generatedCreationModels,
	generatedUiCodeExample,
	generatedUiExamples,
} from './generated-ui-model.js';

export function GeneratedUiPage() {
	const [selectedSlug, setSelectedSlug] = useState<GeneratedUiExampleSlug>('music-recording');
	const selectedExample =
		generatedUiExamples.find((example) => example.slug === selectedSlug) ?? generatedUiExamples[0];
	if (!selectedExample) {
		throw new Error('Missing generated UI examples.');
	}
	const model = generatedCreationModels[selectedSlug];

	return (
		<section className="generated-ui-page" aria-label="Generated UI profile preview">
			<div className="generated-hero">
				<div>
					<p className="section-label">Generated UI</p>
					<h2>Let the packages describe the creation surface.</h2>
					<p>
						This tab sketches the browser model a creation flow can consume: atom fields,
						relationship targets, predicate IDs, and schema provenance from a Creation Profile.
					</p>
				</div>
				<div className="generated-stat-grid">
					<Stat label="Classification" value={model.classification.slug} />
					<Stat label="Atom fields" value={String(model.fields.length)} />
					<Stat
						label="Modeled relationships"
						value={`${model.relationships.length}/${model.promotedPredicateCount}`}
					/>
					<Stat label="Available schema fields" value={String(model.availableFieldCount)} />
				</div>
			</div>

			<nav className="entity-example-tabs" aria-label="Generated UI examples">
				{generatedUiExamples.map((example) => (
					<button
						type="button"
						key={example.slug}
						data-active={example.slug === selectedSlug}
						onClick={() => setSelectedSlug(example.slug)}
					>
						<strong>{example.title}</strong>
						<span>{example.description}</span>
					</button>
				))}
			</nav>

			<div className="generated-layout">
				<section className="generated-panel generated-preview" aria-label="Generated form preview">
					<div className="generated-panel-header">
						<div>
							<span>Generated preview</span>
							<h3>{model.classification.displayName}</h3>
						</div>
						<code>{model.classification.schemaType}</code>
					</div>

					<div className="generated-form">
						{model.fields.map((field) => (
							<GeneratedField key={field.key} field={field} />
						))}
					</div>
				</section>

				<section className="generated-panel" aria-label="Generated relationship controls">
					<div className="generated-panel-header">
						<div>
							<span>Relationship controls</span>
							<h3>Metadata predicates</h3>
						</div>
						<code>matrix</code>
					</div>

					<div className="relationship-control-list">
						{model.relationships.map((relationship) => (
							<RelationshipControl
								key={relationship.key}
								relationship={relationship}
								value={selectedExample.sampleRelationships[relationship.key] ?? ''}
							/>
						))}
					</div>
					<p className="generated-note">
						The profile models {model.relationships.length} of {model.promotedPredicateCount}{' '}
						promoted metadata predicates for this classification, so a builder can generate controls
						from the same package data used for validation.
					</p>
				</section>
			</div>

			<section className="generated-panel generated-code-panel">
				<div className="generated-panel-header">
					<div>
						<span>Creation Profile</span>
						<h3>One subpath import can drive the UI model.</h3>
					</div>
					<code>profile</code>
				</div>
				<div className="generated-code-grid">
					<pre className="code-block">{generatedUiCodeExample}</pre>
					<pre className="code-block">{JSON.stringify(model, null, 2)}</pre>
				</div>
			</section>
		</section>
	);
}

function GeneratedField({ field }: { field: GeneratedFieldControl }) {
	return (
		<label className="generated-field">
			<span>
				{field.label}
				{field.required ? ' *' : ''}
			</span>
			<input
				readOnly
				type={field.control === 'number' ? 'number' : 'text'}
				value={field.placeholder ?? ''}
				aria-label={field.label}
			/>
			<small>
				{field.control}
				{field.schemaProperty
					? ` · schema:${field.schemaProperty.name} from ${field.schemaProperty.originType ?? 'direct'}`
					: ''}
			</small>
		</label>
	);
}

function RelationshipControl({
	relationship,
	value,
}: {
	relationship: GeneratedRelationshipControl;
	value: string;
}) {
	return (
		<article className="relationship-control">
			<div>
				<span>{relationship.priority}</span>
				<strong>{relationship.label}</strong>
				<small>{relationship.key}</small>
			</div>
			<input readOnly type="text" value={value} aria-label={`${relationship.label} target`} />
			<div className="target-list">
				{relationship.expectedObjects.map((object) => (
					<span key={formatExpectedObject(object)}>{formatExpectedObject(object)}</span>
				))}
			</div>
			<small>{relationship.control}</small>
		</article>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="generated-stat">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
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
