#!/usr/bin/env node

const schemaUrls = [
	'https://schema.intuition.systems/v1/oauth-atom.jsonld',
	'https://schema.intuition.systems/v1/ethereum.jsonld',
	'https://schema.intuition.systems/v1/social-media-account.jsonld',
];

const failures = [];

function formatFetchError(error) {
	if (!(error instanceof Error)) {
		return String(error);
	}

	const cause = error.cause;
	if (cause instanceof Error && cause.message.length > 0) {
		return `${error.message}: ${cause.message}`;
	}

	return error.message;
}

for (const url of schemaUrls) {
	try {
		const response = await fetch(url, {
			headers: {
				accept: 'application/ld+json, application/json;q=0.9, */*;q=0.1',
			},
		});

		if (!response.ok) {
			failures.push(`${url}: HTTP ${response.status}`);
			continue;
		}

		const contentType = response.headers.get('content-type') ?? '';
		const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
		if (
			mediaType !== 'application/ld+json' &&
			mediaType !== 'application/json' &&
			!(mediaType.startsWith('application/') && mediaType.endsWith('+json'))
		) {
			failures.push(
				`${url}: unexpected content-type "${contentType || 'missing'}"; expected application/ld+json, application/json, or application/*+json`
			);
			continue;
		}

		const parsed = await response.json();
		if (!parsed || typeof parsed !== 'object' || !('@context' in parsed)) {
			failures.push(`${url}: response JSON is missing @context`);
			continue;
		}

		console.log(`${url}: ok`);
	} catch (error) {
		failures.push(`${url}: ${formatFetchError(error)}`);
	}
}

if (failures.length > 0) {
	console.error('Live schema verification failed:');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log('Live schema verification passed.');
