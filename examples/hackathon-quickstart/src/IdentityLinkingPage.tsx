import { useMemo, useState } from 'react';
import {
	identityCandidates,
	identityCodeExamples,
	postActivationIdentity,
	preActivationIdentity,
	preActivationIds,
} from './identity-linking.js';

export function IdentityLinkingPage() {
	const [threshold, setThreshold] = useState(8);
	const acceptedCandidates = useMemo(
		() => identityCandidates.filter((candidate) => candidate.confidence >= threshold),
		[threshold]
	);
	const heldCandidates = useMemo(
		() => identityCandidates.filter((candidate) => candidate.confidence < threshold),
		[threshold]
	);

	return (
		<>
			<section className="identity-hero">
				<div>
					<p className="section-label">Identity linking</p>
					<h2>Use sameAs carefully across the atom lifecycle.</h2>
					<p>
						The package data supports both payload-level external references and graph-level
						identity triples. The app decides which surface is correct based on timing, confidence,
						and whether the atom has already been activated.
					</p>
				</div>
				<div className="identity-rule-card">
					<strong>Default review rule</strong>
					<span>Only strict identity becomes sameAs. Related content stays out.</span>
				</div>
			</section>

			<section className="identity-grid" aria-label="sameAs lifecycle examples">
				<article className="playground-card identity-panel wide">
					<div className="playground-card-header">
						<h3>1. Review candidate URLs</h3>
						<span>{acceptedCandidates.length} accepted</span>
					</div>
					<label className="threshold-control">
						<span>Accept as sameAs when confidence is at least {threshold}</span>
						<input
							type="range"
							min="1"
							max="10"
							value={threshold}
							onChange={(event) => setThreshold(Number(event.target.value))}
						/>
					</label>
					<div className="candidate-list">
						{identityCandidates.map((candidate) => {
							const accepted = candidate.confidence >= threshold;

							return (
								<div className="candidate-row" data-accepted={accepted} key={candidate.label}>
									<div>
										<strong>{candidate.label}</strong>
										<span>{candidate.url}</span>
									</div>
									<em>{candidate.confidence}/10</em>
									<small>{accepted ? 'sameAs candidate' : candidate.verdict}</small>
								</div>
							);
						})}
					</div>
				</article>

				<article className="playground-card identity-panel">
					<div className="playground-card-header">
						<h3>2. Pre-activation payload choice</h3>
						<span>changes ID</span>
					</div>
					<p className="panel-copy">
						If accepted links are known before activation, they can be serialized into the atom
						payload. That is valid, but it produces different bytes and therefore a different atom
						ID.
					</p>
					<div className="id-compare">
						<div>
							<span>without sameAs</span>
							<code>{preActivationIds.plainAtomId}</code>
						</div>
						<div>
							<span>with payload sameAs</span>
							<code>{preActivationIds.enrichedAtomId}</code>
						</div>
					</div>
					<div className="inline-code-pair">
						<div>
							<span>Payload output</span>
							<CodeBlock value={JSON.stringify(preActivationIdentity.enrichedAtomData, null, 2)} />
						</div>
						<div>
							<span>Package call</span>
							<CodeBlock value={identityCodeExamples.preActivation} />
						</div>
					</div>
				</article>

				<article className="playground-card identity-panel">
					<div className="playground-card-header">
						<h3>3. Post-activation graph growth</h3>
						<span>triple</span>
					</div>
					<p className="panel-copy">
						After activation, do not pretend the original payload changed. Link duplicate atoms with
						the Intuition sameAs predicate and let the read model collapse them later.
					</p>
					<div className="atom-pair">
						<AtomSummary
							label={postActivationIdentity.spotifyAtom.label}
							id={postActivationIdentity.spotifyAtom.id}
						/>
						<span>sameAs</span>
						<AtomSummary
							label={postActivationIdentity.appleMusicAtom.label}
							id={postActivationIdentity.appleMusicAtom.id}
						/>
					</div>
					<div className="inline-code-pair">
						<div>
							<span>Triple output</span>
							<CodeBlock value={JSON.stringify(postActivationIdentity.sameAsTriple, null, 2)} />
						</div>
						<div>
							<span>Package call</span>
							<CodeBlock value={identityCodeExamples.postActivation} />
						</div>
					</div>
				</article>

				<article className="playground-card identity-panel wide">
					<div className="playground-card-header">
						<h3>Held back from sameAs</h3>
						<span>{heldCandidates.length} held</span>
					</div>
					<p className="panel-copy">
						These candidates can still be useful evidence, source references, or related content.
						They should not be promoted to strict identity links without an entity-specific rule.
					</p>
					<CodeBlock
						value={JSON.stringify(
							heldCandidates.map((candidate) => ({
								label: candidate.label,
								source: candidate.source,
								confidence: candidate.confidence,
								reason: candidate.verdict,
							})),
							null,
							2
						)}
					/>
				</article>
			</section>
		</>
	);
}

function AtomSummary({ label, id }: { label: string; id: string }) {
	return (
		<div className="atom-summary">
			<strong>{label}</strong>
			<code>{id}</code>
		</div>
	);
}

function CodeBlock({ value }: { value: string }) {
	return <pre className="code-block">{value}</pre>;
}
