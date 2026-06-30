import type { ExpectedObject } from '@0xintuition/classifications';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { GeneratedUiPage } from './GeneratedUiPage.js';
import { IdentityLinkingPage } from './IdentityLinkingPage.js';
import { Playground } from './Playground.js';
import { PredicateBehaviorPage } from './PredicateBehaviorPage.js';
import { codeExample, lifecycle, packageCallouts } from './package-lifecycle.js';

type DemoPage = 'lifecycle' | 'generated-ui' | 'identity' | 'predicate-behavior';

export function App() {
	const [page, setPage] = useState<DemoPage>(() => getInitialPage());
	const schemaSample = lifecycle.schemaHighlights.slice(0, 5);
	const showQuickstartIntro = page !== 'predicate-behavior';

	useEffect(() => {
		const handleHashChange = () => {
			setPage(getInitialPage());
		};

		window.addEventListener('hashchange', handleHashChange);

		return () => {
			window.removeEventListener('hashchange', handleHashChange);
		};
	}, []);

	const navigateToPage = (nextPage: DemoPage) => {
		setPage(nextPage);

		if (window.location.hash !== `#${nextPage}`) {
			window.location.hash = nextPage;
		}
	};

	return (
		<main className="app-shell">
			{showQuickstartIntro ? <QuickstartIntro /> : null}

			<nav className="page-nav" aria-label="Quickstart pages">
				<button
					type="button"
					data-active={page === 'lifecycle'}
					onClick={() => navigateToPage('lifecycle')}
				>
					Package lifecycle
				</button>
				<button
					type="button"
					data-active={page === 'identity'}
					onClick={() => navigateToPage('identity')}
				>
					Identity linking
				</button>
				<button
					type="button"
					data-active={page === 'generated-ui'}
					onClick={() => navigateToPage('generated-ui')}
				>
					Generated UI
				</button>
				<button
					type="button"
					data-active={page === 'predicate-behavior'}
					onClick={() => navigateToPage('predicate-behavior')}
				>
					Predicate behavior
				</button>
			</nav>

			{page === 'lifecycle' ? <LifecycleOverview schemaSample={schemaSample} /> : null}
			{page === 'identity' ? <IdentityLinkingPage /> : null}
			{page === 'generated-ui' ? <GeneratedUiPage /> : null}
			{page === 'predicate-behavior' ? <PredicateBehaviorPage /> : null}
		</main>
	);
}

function QuickstartIntro() {
	return (
		<>
			<section className="intro">
				<div>
					<p className="section-label">Hackathon quickstart</p>
					<h1>Build a Spotify song atom from a Creation Profile.</h1>
					<p className="intro-copy">
						No API key or wallet is needed for this dry run. The app shows the payload and triple
						plan a builder can derive from the packages before wiring a live submit path.
					</p>
				</div>
				<div className="intro-card">
					<span className="eyebrow">Selected classification</span>
					<strong>{lifecycle.classification.displayName}</strong>
					<span>{lifecycle.classification.description}</span>
				</div>
			</section>

			<section className="demo-strip" aria-label="How to use this demo">
				<div>
					<span>Use it as</span>
					<strong>A package API walkthrough</strong>
					<p>Start at classification, then follow the generated atom data and metadata triples.</p>
				</div>
				<div>
					<span>Output</span>
					<strong>Dry-run payloads</strong>
					<p>The JSON and triple previews are what an SDK/API submit layer would consume later.</p>
				</div>
				<div>
					<span>Out of scope</span>
					<strong>Live writes</strong>
					<p>
						Wallet, RPC, API keys, and transaction submission stay out of this package showcase.
					</p>
				</div>
			</section>
		</>
	);
}

function getInitialPage(): DemoPage {
	if (typeof window === 'undefined') {
		return 'predicate-behavior';
	}

	return getDemoPageFromHash(window.location.hash) ?? 'predicate-behavior';
}

function getDemoPageFromHash(hash: string): DemoPage | null {
	const page = hash.replace(/^#\/?/, '');

	if (
		page === 'lifecycle' ||
		page === 'generated-ui' ||
		page === 'identity' ||
		page === 'predicate-behavior'
	) {
		return page;
	}

	return null;
}

function LifecycleOverview({ schemaSample }: { schemaSample: typeof lifecycle.schemaHighlights }) {
	return (
		<>
			<Playground />

			<section className="package-callouts" aria-label="Package calls by surface">
				<div className="section-heading">
					<p className="section-label">Package calls</p>
					<h2>Each visible surface maps to a small importable API call.</h2>
					<p>
						Use these as the copyable pieces: import one Creation Profile for known browser flows,
						then use root registry helpers later for open-ended exploration.
					</p>
				</div>

				<div className="callout-grid">
					<CodePair title="Recommended atom fields" code={packageCallouts.fields}>
						<div className="field-list compact">
							{lifecycle.fields.map((field) => (
								<div className="field-row" key={field.key}>
									<div>
										<strong>{field.label}</strong>
										<span>{field.key}</span>
									</div>
									<em>{field.required ? 'required' : 'optional'}</em>
								</div>
							))}
						</div>
					</CodePair>

					<CodePair title="Generated atom data" code={packageCallouts.atomData}>
						<CodeBlock value={JSON.stringify(lifecycle.atomData, null, 2)} />
					</CodePair>

					<CodePair title="Schema provenance" code={packageCallouts.schemaSuperset}>
						<div className="schema-list compact">
							{schemaSample.map((property) => (
								<div className="schema-row" key={property.id}>
									<strong>{property.name}</strong>
									<span>from {property.originType}</span>
								</div>
							))}
						</div>
					</CodePair>

					<CodePair title="Metadata predicate targets" code={packageCallouts.metadataPredicates}>
						<div className="schema-list compact">
							{lifecycle.metadataPredicates.map((relation) => (
								<div className="schema-row" key={relation.predicateKey}>
									<strong>{relation.predicateKey}</strong>
									<span>{relation.expectedObjects.map(formatExpectedObject).join(' or ')}</span>
								</div>
							))}
						</div>
					</CodePair>
				</div>
			</section>

			<section className="workflow-grid" aria-label="Atom creation lifecycle">
				<Panel index="01" title="Classification">
					<KeyValue label="Slug" value={lifecycle.classification.slug} />
					<KeyValue
						label="Schema context"
						value={lifecycle.classification.schema?.context ?? 'none'}
					/>
					<KeyValue label="Schema type" value={lifecycle.classification.schema?.type ?? 'none'} />
				</Panel>

				<Panel index="02" title="Recommended atom fields">
					<div className="field-list">
						{lifecycle.fields.map((field) => (
							<div className="field-row" key={field.key}>
								<div>
									<strong>{field.label}</strong>
									<span>
										{field.key}
										{field.schemaProperty ? ` -> ${field.schemaProperty}` : ''}
									</span>
								</div>
								<em>{field.required ? 'required' : 'optional'}</em>
							</div>
						))}
					</div>
				</Panel>

				<Panel index="03" title="Generated atom data">
					<CodeBlock value={JSON.stringify(lifecycle.atomData, null, 2)} />
				</Panel>

				<Panel index="04" title="Schema provenance">
					<p className="panel-copy">
						{lifecycle.availableSchemaFieldCount} schema fields are available for{' '}
						{lifecycle.classification.schema?.type}; this Creation Profile carries the recommended
						atom fields with their schema provenance.
					</p>
					<div className="schema-list">
						{schemaSample.map((property) => (
							<div className="schema-row" key={property.id}>
								<strong>{property.name}</strong>
								<span>from {property.originType}</span>
							</div>
						))}
					</div>
				</Panel>
			</section>

			<section className="relations-section">
				<div className="section-heading">
					<p className="section-label">Metadata predicates</p>
					<h2>Recommended triples stay outside the atom data.</h2>
					<p>
						The profile turns each promoted predicate into a usable object-target model for app
						builders.
					</p>
				</div>

				<div className="relation-grid">
					{lifecycle.metadataPredicates.map((relation) => (
						<article className="relation-card" key={relation.predicateKey}>
							<div className="relation-card-header">
								<div>
									<span>{relation.priority ?? 'recommended'}</span>
									<h3>{relation.predicateKey}</h3>
								</div>
								<code>{truncateId(relation.predicateId)}</code>
							</div>
							<p>{relation.predicateRecord?.description}</p>
							<div className="target-list">
								{relation.expectedObjects.map((object) => (
									<span key={formatExpectedObject(object)}>{formatExpectedObject(object)}</span>
								))}
							</div>
							<CodeBlock value={JSON.stringify(relation.triplePreview, null, 2)} />
						</article>
					))}
				</div>
			</section>

			<section className="code-section">
				<div className="section-heading">
					<p className="section-label">Developer surface</p>
					<h2>The core package calls fit in one flow.</h2>
					<p>
						This is the browser-light code path to copy into a real app. Replace the sample objects
						with atoms selected or created by your UI, then pass the generated plan into the submit
						layer.
					</p>
				</div>
				<CodeBlock value={codeExample} />
			</section>
		</>
	);
}

function CodePair({ title, code, children }: { title: string; code: string; children: ReactNode }) {
	return (
		<article className="code-pair">
			<div className="code-pair-output">
				<h3>{title}</h3>
				{children}
			</div>
			<div className="code-pair-code">
				<span>Package call</span>
				<CodeBlock value={code} />
			</div>
		</article>
	);
}

function Panel({ index, title, children }: { index: string; title: string; children: ReactNode }) {
	return (
		<article className="panel">
			<div className="panel-header">
				<span>{index}</span>
				<h2>{title}</h2>
			</div>
			{children}
		</article>
	);
}

function KeyValue({ label, value }: { label: string; value: string }) {
	return (
		<div className="key-value">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
}

function CodeBlock({ value }: { value: string }) {
	return <pre className="code-block">{value}</pre>;
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

function truncateId(id: string | undefined): string {
	if (!id) {
		return 'id pending';
	}

	return `${id.slice(0, 8)}...${id.slice(-6)}`;
}
