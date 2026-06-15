import type { ExpectedObject } from '@0xintuition/classifications';
import { useState } from 'react';
import {
	type GeneratedFieldControl,
	type GeneratedRelationshipControl,
	type GeneratedUiExampleSlug,
	generatedCreationContracts,
	generatedUiCodeExample,
	generatedUiExamples,
} from './generated-ui-contract.js';

export function GeneratedUiPage() {
	const [selectedSlug, setSelectedSlug] = useState<GeneratedUiExampleSlug>('music-recording');
	const selectedExample =
		generatedUiExamples.find((example) => example.slug === selectedSlug) ?? generatedUiExamples[0];
	if (!selectedExample) {
		throw new Error('Missing generated UI examples.');
	}
	const contract = generatedCreationContracts[selectedSlug];

	return (
		<section className="generated-ui-page" aria-label="Generated UI contract proof of concept">
			<div className="generated-hero">
				<div>
					<p className="section-label">Generative UI POC</p>
					<h2>Let the packages describe the creation surface.</h2>
					<p>
						This tab sketches the contract a creation flow could consume: atom fields from the
						classification package, relationship targets from the metadata predicate matrix, and
						provenance from schema.org.
					</p>
				</div>
				<div className="generated-stat-grid">
					<Stat label="Classification" value={contract.classification.slug} />
					<Stat label="Atom fields" value={String(contract.fields.length)} />
					<Stat
						label="Modeled relationships"
						value={`${contract.relationships.length}/${contract.promotedPredicateCount}`}
					/>
					<Stat label="Available schema fields" value={String(contract.availableFieldCount)} />
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
							<h3>{contract.classification.displayName}</h3>
						</div>
						<code>{contract.classification.schemaType}</code>
					</div>

					<div className="generated-form">
						{contract.fields.map((field) => (
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
						{contract.relationships.map((relationship) => (
							<RelationshipControl
								key={relationship.key}
								relationship={relationship}
								value={selectedExample.sampleRelationships[relationship.key] ?? ''}
							/>
						))}
					</div>
					<p className="generated-note">
						The matrix models {contract.relationships.length} of {contract.promotedPredicateCount}{' '}
						promoted metadata predicates for this classification, so a builder can generate controls
						from the same contract used for validation.
					</p>
				</section>
			</div>

			<section className="generated-panel generated-code-panel">
				<div className="generated-panel-header">
					<div>
						<span>Package composition</span>
						<h3>One helper can assemble the UI contract.</h3>
					</div>
					<code>POC</code>
				</div>
				<div className="generated-code-grid">
					<pre className="code-block">{generatedUiCodeExample}</pre>
					<pre className="code-block">{JSON.stringify(contract, null, 2)}</pre>
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
