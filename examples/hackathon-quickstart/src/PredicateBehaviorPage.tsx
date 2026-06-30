import { getPredicateBehavior, getPredicateRecord, I_SUBJECT_ID } from '@0xintuition/predicates';
import {
	type BuildResult,
	buildAtom,
	type GuidedTripleBlueprint,
	guidedBuildTriple,
} from '@0xintuition/primitives';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { Hex } from 'viem';

type BehaviorFlowKey = 'bookmark' | 'follow';
type AttemptMode = 'canonical' | 'opposite';
type AttemptStatus = 'allowed' | 'blocked';

type AttemptPreview = {
	title: string;
	status: AttemptStatus;
	shape: string;
	subjectLabel: string;
	predicateLabel: string;
	objectLabel: string;
	receivedSubject: string;
	expectedSubject: string;
	receivedActor: string;
	expectedActor: string;
	explanation: string;
	code: string;
	result: BuildResult<GuidedTripleBlueprint>;
};

type BehaviorFlow = {
	key: BehaviorFlowKey;
	title: string;
	shortLabel: string;
	productAction: string;
	canonicalShape: string;
	actorRead: string;
	billyCallout: string;
	rawTriple: {
		shape: string;
		questions: readonly string[];
	};
	behaviorAnswers: readonly {
		label: string;
		value: string;
	}[];
	decisionRule: string;
	aiWriteTest: {
		prompt: string;
		answer: string;
	};
	canonicalAttempt: AttemptPreview;
	oppositeAttempt: AttemptPreview;
	code: string;
	plan: GuidedTripleBlueprint;
	apiProjection: Record<string, unknown>;
};

const USER_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const userAccount = mustBuildAtom('ethereum-account', { address: USER_ADDRESS });
const bookmarkTarget = mustBuildAtom('thing', {
	name: 'Predicate Behavior Semantics Exploration',
	description: 'Team-facing note for predicate behavior metadata.',
});
const followTarget = mustBuildAtom('thing', {
	name: 'Geo Browser',
	description: 'A decentralized knowledge graph project.',
});

const behaviorFlows: Record<BehaviorFlowKey, BehaviorFlow> = {
	bookmark: createBookmarkFlow(),
	follow: createFollowFlow(),
};

export function PredicateBehaviorPage() {
	const [activeFlowKey, setActiveFlowKey] = useState<BehaviorFlowKey>('bookmark');
	const [attemptMode, setAttemptMode] = useState<AttemptMode>('opposite');
	const activeFlow = behaviorFlows[activeFlowKey];
	const predicate = getPredicateRecord(activeFlow.key);
	const behavior = getPredicateBehavior(activeFlow.key);
	const activeAttempt =
		attemptMode === 'canonical' ? activeFlow.canonicalAttempt : activeFlow.oppositeAttempt;
	const activeIssues = getAttemptIssues(activeAttempt);

	return (
		<section className="behavior-page" aria-label="Predicate behavior usability flow">
			<div className="behavior-hero">
				<div>
					<p className="section-label">Predicate behavior</p>
					<h2>Show the package making the semantic decision.</h2>
					<p>
						A raw triple can look plausible in both directions. This route shows the practical
						difference behavior metadata makes: the package guides the canonical write, explains it
						to humans, and blocks the reversed shape before it reaches the app or API layer.
					</p>
				</div>
				<div className="behavior-hero-card">
					<span>First screen proof</span>
					<strong>Try the opposite path first</strong>
					<p>
						Defaulting to the blocked state makes the package guardrail visible instead of buried in
						JSON.
					</p>
				</div>
			</div>

			<section className="behavior-callouts" aria-label="Transcript callouts addressed">
				<div>
					<span>Callout 01</span>
					<strong>Which way do I use it?</strong>
					<p>Subject/object placement is explicit instead of inferred from predicate wording.</p>
				</div>
				<div>
					<span>Callout 02</span>
					<strong>Can AI write it correctly?</strong>
					<p>The package tells an agent where the actor, subject, and object belong.</p>
				</div>
				<div>
					<span>Callout 03</span>
					<strong>Can the predicate stay simple?</strong>
					<p>The base atom stays `bookmark`; display variants come from behavior metadata.</p>
				</div>
				<div>
					<span>Callout 04</span>
					<strong>Where does the actor live?</strong>
					<p>Some flows use subject; follow uses position on a canonical claim.</p>
				</div>
			</section>

			<fieldset className="behavior-tabs">
				<legend className="sr-only">Predicate behavior flows</legend>
				{Object.values(behaviorFlows).map((flow) => (
					<button
						type="button"
						key={flow.key}
						data-active={flow.key === activeFlowKey}
						onClick={() => setActiveFlowKey(flow.key)}
					>
						<strong>{flow.shortLabel}</strong>
						<span>{flow.canonicalShape}</span>
					</button>
				))}
			</fieldset>

			<section className="decision-simulator" data-status={activeAttempt.status}>
				<div className="decision-header">
					<div>
						<p className="section-label">Decision simulator</p>
						<h2>What happens when the app or an AI tries to write this relationship?</h2>
					</div>
					<fieldset className="attempt-toggle">
						<legend className="sr-only">Choose attempted write path</legend>
						<button
							type="button"
							data-active={attemptMode === 'opposite'}
							onClick={() => setAttemptMode('opposite')}
						>
							Try opposite
						</button>
						<button
							type="button"
							data-active={attemptMode === 'canonical'}
							onClick={() => setAttemptMode('canonical')}
						>
							Use package path
						</button>
					</fieldset>
				</div>

				<div className="decision-stage">
					<div className="decision-status">
						<span>{activeAttempt.status === 'allowed' ? 'Allowed' : 'Blocked'}</span>
						<strong>{activeAttempt.title}</strong>
						<p>{activeAttempt.explanation}</p>
					</div>

					<section className="attempted-triple" aria-labelledby="attempted-triple-heading">
						<h3 className="sr-only" id="attempted-triple-heading">
							Attempted triple
						</h3>
						<TripleNode label="Subject" value={activeAttempt.subjectLabel} />
						<div className="predicate-node">
							<span>Predicate</span>
							<strong>{activeAttempt.predicateLabel}</strong>
						</div>
						<TripleNode label="Object" value={activeAttempt.objectLabel} />
					</section>

					<div className="decision-reasons">
						<ReasonPair
							label="Subject rule"
							expected={activeAttempt.expectedSubject}
							received={activeAttempt.receivedSubject}
						/>
						<ReasonPair
							label="Actor rule"
							expected={activeAttempt.expectedActor}
							received={activeAttempt.receivedActor}
						/>
						<div className="package-result">
							<span>Package result</span>
							<strong>
								{activeAttempt.status === 'allowed'
									? 'guidedBuildTriple returns a plan'
									: activeIssues[0]}
							</strong>
						</div>
					</div>
				</div>
			</section>

			<div className="behavior-section-heading">
				<p className="section-label">Before and after</p>
				<h2>{activeFlow.billyCallout}</h2>
			</div>

			<div className="behavior-comparison-grid">
				<BehaviorPanel eyebrow="Before" title="Raw triple leaves ambiguity">
					<div className="raw-triple">
						<code>{activeFlow.rawTriple.shape}</code>
					</div>
					<ul className="ambiguity-list">
						{activeFlow.rawTriple.questions.map((question) => (
							<li key={question}>{question}</li>
						))}
					</ul>
				</BehaviorPanel>

				<BehaviorPanel eyebrow="After" title="Behavior metadata answers it">
					<div className="answer-list">
						{activeFlow.behaviorAnswers.map((answer) => (
							<div className="answer-row" key={answer.label}>
								<span>{answer.label}</span>
								<strong>{answer.value}</strong>
							</div>
						))}
					</div>
				</BehaviorPanel>

				<BehaviorPanel eyebrow="AI write test" title="Package tells the agent what to do">
					<div className="ai-write-test">
						<span>Prompt</span>
						<p>{activeFlow.aiWriteTest.prompt}</p>
						<span>Canonical answer</span>
						<code>{activeFlow.aiWriteTest.answer}</code>
					</div>
				</BehaviorPanel>

				<BehaviorPanel eyebrow="Guardrail" title="The opposite path is a package-level error">
					<div className="guardrail-summary">
						<code>{activeFlow.oppositeAttempt.shape}</code>
						<p>
							The same metadata that renders the label also validates subject/object placement and
							actor source before an app writes the triple.
						</p>
					</div>
				</BehaviorPanel>
			</div>

			<BehaviorPanel eyebrow="Direction rule" title="Why this shape is the recommendation">
				<p>{activeFlow.decisionRule}</p>
			</BehaviorPanel>

			<div className="behavior-section-heading compact-heading">
				<p className="section-label">Usability flow</p>
				<h2>The same metadata drives the app action, triple plan, and API interpretation.</h2>
			</div>

			<div className="behavior-grid">
				<BehaviorPanel eyebrow="Product action" title={activeFlow.title}>
					<p>{activeFlow.productAction}</p>
					<div className="behavior-flow-steps">
						<span>1. Resolve or create atoms</span>
						<span>2. Select canonical predicate</span>
						<span>3. Build deterministic triple</span>
						<span>4. Attach actor interpretation</span>
					</div>
				</BehaviorPanel>

				<BehaviorPanel eyebrow="Canonical triple" title={activeFlow.canonicalShape}>
					<div className="triple-line">
						<code>{truncateId(activeFlow.plan.subjectId)}</code>
						<strong>{activeFlow.plan.predicateKey}</strong>
						<code>{truncateId(activeFlow.plan.objectId)}</code>
					</div>
					<p>{activeFlow.plan.interpretation.plainEnglish}</p>
					{activeFlow.plan.interpretation.reversePlainEnglish ? (
						<p>{activeFlow.plan.interpretation.reversePlainEnglish}</p>
					) : null}
				</BehaviorPanel>

				<BehaviorPanel eyebrow="Actor source" title={activeFlow.actorRead}>
					<KeyValue label="Subject role" value={activeFlow.plan.interpretation.subjectRole} />
					<KeyValue label="Object role" value={activeFlow.plan.interpretation.objectRole} />
					<KeyValue
						label="Actor source"
						value={activeFlow.plan.interpretation.actorSource ?? 'not specified'}
					/>
					<KeyValue
						label="Actor role"
						value={activeFlow.plan.interpretation.actorRole ?? 'not specified'}
					/>
				</BehaviorPanel>

				<BehaviorPanel
					eyebrow="Predicate record"
					title={predicate?.name ?? activeFlow.plan.predicateKey}
				>
					<p>{predicate?.description}</p>
					<div className="target-list">
						<span>{predicate?.status ?? 'unknown'}</span>
						<span>{predicate?.category ?? 'uncategorized'}</span>
						<span>{predicate?.marketPattern ?? 'no market pattern'}</span>
					</div>
				</BehaviorPanel>
			</div>

			<div className="behavior-code-grid">
				<BehaviorPanel eyebrow="Behavior metadata" title="Package-level meaning">
					<CodeBlock value={JSON.stringify(behavior, null, 2)} />
				</BehaviorPanel>

				<BehaviorPanel eyebrow="Guided build output" title="IDs plus interpretation">
					<CodeBlock value={JSON.stringify(activeFlow.plan, null, 2)} />
				</BehaviorPanel>

				<BehaviorPanel eyebrow="API projection" title="Consumer-facing shape">
					<CodeBlock value={JSON.stringify(activeFlow.apiProjection, null, 2)} />
				</BehaviorPanel>

				<BehaviorPanel eyebrow="App code" title="Route-level package call">
					<CodeBlock value={activeFlow.code} />
				</BehaviorPanel>
			</div>
		</section>
	);
}

function createBookmarkFlow(): BehaviorFlow {
	const plan = mustBuildGuidedTriple({
		subjectId: userAccount.id,
		predicateKey: 'bookmark',
		objectId: bookmarkTarget.id,
		subjectLabel: 'Account 0x742d...f44e',
		objectLabel: 'Predicate Behavior note',
		actorSource: 'subject',
		subjectClassification: 'ethereum-account',
		objectClassification: 'thing',
	});
	const oppositeAttempt = guidedBuildTriple({
		subjectId: bookmarkTarget.id,
		predicateKey: 'bookmark',
		objectId: userAccount.id,
		subjectLabel: 'Predicate Behavior note',
		objectLabel: 'Account 0x742d...f44e',
		actorSource: 'subject',
		subjectClassification: 'thing',
		objectClassification: 'ethereum-account',
	});
	const canonicalAttempt: AttemptPreview = {
		title: 'Canonical bookmark write',
		status: 'allowed',
		shape: '[account] -> bookmark -> [target]',
		subjectLabel: 'Account 0x742d...f44e',
		predicateLabel: 'bookmark',
		objectLabel: 'Predicate Behavior note',
		receivedSubject: 'ethereum-account',
		expectedSubject: 'account, person, or social account',
		receivedActor: 'subject',
		expectedActor: 'subject',
		explanation:
			'The actor is the subject, the saved thing is the object, and the reverse display can still read "is bookmarked by" without creating a second predicate.',
		result: { success: true, value: plan },
		code: `guidedBuildTriple({
  subjectId: accountAtom.id,
  predicateKey: 'bookmark',
  objectId: targetAtom.id,
  actorSource: 'subject',
});`,
	};

	return {
		key: 'bookmark',
		title: 'Account bookmarks a target',
		shortLabel: 'Bookmark',
		productAction: 'A user clicks bookmark on a note, claim, stack, post, or imported entity.',
		canonicalShape: '[account] -> bookmark -> [target]',
		actorRead: 'Actor is the triple subject',
		billyCallout: 'Bookmark is the clean example: without roles, it can read in either direction.',
		rawTriple: {
			shape: '[0x742d...f44e] [bookmark] [Predicate Behavior note]',
			questions: [
				'Is the account bookmarking the note, or is the note bookmarked by the account?',
				'Which atom should an AI put in the subject slot?',
				'Can the UI render reverse language without minting another predicate?',
			],
		},
		behaviorAnswers: [
			{ label: 'Subject role', value: 'bookmarker' },
			{ label: 'Object role', value: 'bookmarked target' },
			{ label: 'Actor source', value: 'subject' },
			{ label: 'Display', value: 'bookmarks / is bookmarked by' },
		],
		decisionRule:
			'For bookmark, the common query and render path is account profile -> saved targets. The account is the standalone subject, the saved thing is the object, and SDK/API layers render forward or reverse phrasing from one canonical predicate.',
		aiWriteTest: {
			prompt: 'Account A bookmarks note B. Create the canonical triple.',
			answer: 'subject=A, predicate=bookmark, object=B, actorSource=subject',
		},
		oppositeAttempt: {
			title: 'Reversed bookmark is rejected',
			status: 'blocked',
			shape: '[target] -> bookmark -> [account]',
			subjectLabel: 'Predicate Behavior note',
			predicateLabel: 'bookmark',
			objectLabel: 'Account 0x742d...f44e',
			receivedSubject: 'thing',
			expectedSubject: 'account, person, or social account',
			receivedActor: 'subject',
			expectedActor: 'subject',
			explanation:
				'This is the tempting inverse write. The package rejects it because the subject is the bookmarked target, not the bookmarker.',
			result: oppositeAttempt,
			code: `guidedBuildTriple({
  subjectId: targetAtom.id,
  predicateKey: 'bookmark',
  objectId: accountAtom.id,
  subjectClassification: 'thing',
  objectClassification: 'ethereum-account',
});`,
		},
		canonicalAttempt,
		plan,
		apiProjection: {
			predicateKey: 'bookmark',
			tripleId: plan.id,
			interpretation: {
				actorId: userAccount.id,
				actorSource: 'subject',
				bookmarks: true,
				plainEnglish: plan.interpretation.plainEnglish,
			},
		},
		code: `const plan = guidedBuildTriple({
  subjectId: accountAtom.id,
  predicateKey: 'bookmark',
  objectId: targetAtom.id,
  actorSource: 'subject',
});`,
	};
}

function createFollowFlow(): BehaviorFlow {
	const plan = mustBuildGuidedTriple({
		subjectId: I_SUBJECT_ID,
		predicateKey: 'follow',
		objectId: followTarget.id,
		subjectLabel: 'I',
		objectLabel: 'Geo Browser',
		actorLabel: 'Account 0x742d...f44e',
		actorSource: 'position',
	});
	const oppositeAttempt = guidedBuildTriple({
		subjectId: userAccount.id,
		predicateKey: 'follow',
		objectId: followTarget.id,
		subjectLabel: 'Account 0x742d...f44e',
		objectLabel: 'Geo Browser',
		actorSource: 'subject',
		subjectClassification: 'ethereum-account',
		objectClassification: 'thing',
	});
	const canonicalAttempt: AttemptPreview = {
		title: 'Canonical follow claim plus viewer position',
		status: 'allowed',
		shape: '[I] -> follow -> [target]',
		subjectLabel: 'I',
		predicateLabel: 'follow',
		objectLabel: 'Geo Browser',
		receivedSubject: 'canonical I atom',
		expectedSubject: 'canonical I atom',
		receivedActor: 'position from Account 0x742d...f44e',
		expectedActor: 'position',
		explanation:
			'Follow keeps one reusable first-person claim and reads the concrete follower from the account position on that claim.',
		result: { success: true, value: plan },
		code: `guidedBuildTriple({
  subjectId: I_SUBJECT_ID,
  predicateKey: 'follow',
  objectId: targetAtom.id,
  actorLabel: 'Account 0x742d...f44e',
  actorSource: 'position',
});`,
	};

	return {
		key: 'follow',
		title: 'Account has an active follow position',
		shortLabel: 'Follow',
		productAction:
			'A user follow state is read from their affirmative position on the canonical first-person follow claim.',
		canonicalShape: '[I] -> follow -> [target]',
		actorRead: 'Actor is resolved from position',
		billyCallout:
			'Follow is the loaded example: the concrete follower is not the triple subject in the canonical claim model.',
		rawTriple: {
			shape: '[I] [follow] [Geo Browser]',
			questions: [
				'Who is the concrete follower if the subject is the canonical I atom?',
				'Does this create one edge per follower-target pair?',
				'Where should the API read the user-specific follow state from?',
			],
		},
		behaviorAnswers: [
			{ label: 'Subject role', value: 'first-person actor placeholder' },
			{ label: 'Object role', value: 'followed target' },
			{ label: 'Actor source', value: 'position' },
			{ label: 'Display', value: 'follows / is followed by' },
		],
		decisionRule:
			'For follow, the canonical triple is the reusable first-person claim. Individual accounts express follow state through affirmative positions on that claim, so the read model can project many account-target relationships without creating a new semantic edge per follower.',
		aiWriteTest: {
			prompt: 'Account A follows Geo Browser. Create the canonical claim and actor interpretation.',
			answer: 'subject=I, predicate=follow, object=Geo Browser, actorSource=position(A)',
		},
		oppositeAttempt: {
			title: 'Direct account follow edge is rejected',
			status: 'blocked',
			shape: '[account] -> follow -> [target]',
			subjectLabel: 'Account 0x742d...f44e',
			predicateLabel: 'follow',
			objectLabel: 'Geo Browser',
			receivedSubject: 'ethereum-account',
			expectedSubject: 'canonical I atom',
			receivedActor: 'subject',
			expectedActor: 'position',
			explanation:
				'This is the loaded follow shape the app should avoid. The package prevents one edge per follower-target pair and preserves the current position-based follow model.',
			result: oppositeAttempt,
			code: `guidedBuildTriple({
  subjectId: accountAtom.id,
  predicateKey: 'follow',
  objectId: targetAtom.id,
  actorSource: 'subject',
});`,
		},
		canonicalAttempt,
		plan,
		apiProjection: {
			predicateKey: 'follow',
			canonicalTriple: {
				subjectId: I_SUBJECT_ID,
				tripleId: plan.id,
				subjectRole: plan.interpretation.subjectRole,
				objectRole: plan.interpretation.objectRole,
			},
			viewerInterpretation: {
				actorId: userAccount.id,
				actorSource: 'position',
				follows: true,
				plainEnglish: 'Account 0x742d...f44e follows Geo Browser',
			},
		},
		code: `const plan = guidedBuildTriple({
  subjectId: I_SUBJECT_ID,
  predicateKey: 'follow',
  objectId: targetAtom.id,
  actorLabel: 'Account 0x742d...f44e',
  actorSource: 'position',
});`,
	};
}

function mustBuildAtom(classification: string, values: Record<string, unknown>) {
	const result = buildAtom(classification, values);

	if (!result.success) {
		throw new Error(`Could not build ${classification} atom: ${result.errors.join(', ')}`);
	}

	return result.value;
}

function mustBuildGuidedTriple(
	intent: Parameters<typeof guidedBuildTriple>[0]
): GuidedTripleBlueprint {
	const result: BuildResult<GuidedTripleBlueprint> = guidedBuildTriple(intent);

	if (!result.success) {
		throw new Error(`Could not build guided triple: ${result.errors.join(', ')}`);
	}

	return result.value;
}

function BehaviorPanel({
	eyebrow,
	title,
	children,
}: {
	eyebrow: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<article className="behavior-panel">
			<div className="behavior-panel-header">
				<span>{eyebrow}</span>
				<h3>{title}</h3>
			</div>
			{children}
		</article>
	);
}

function TripleNode({ label, value }: { label: string; value: string }) {
	return (
		<div className="triple-node">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
}

function ReasonPair({
	label,
	expected,
	received,
}: {
	label: string;
	expected: string;
	received: string;
}) {
	return (
		<div className="reason-pair">
			<span>{label}</span>
			<div>
				<small>Expected</small>
				<strong>{expected}</strong>
			</div>
			<div>
				<small>Received</small>
				<strong>{received}</strong>
			</div>
		</div>
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

function truncateId(id: Hex): string {
	return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function getAttemptIssues(attempt: AttemptPreview): string[] {
	if (attempt.result.success) {
		return attempt.result.value.warnings.length > 0
			? attempt.result.value.warnings
			: ['No blocking issues.'];
	}

	return attempt.result.errors;
}
