import { getClassification } from '@0xintuition/classifications';
import {
	formatIntuitionId,
	getScheme,
	isAnchorEligible,
	isIntuitionId,
	parseIntuitionId,
	validateIntuitionId,
} from '@0xintuition/iid';
import { classificationForIid } from '@0xintuition/iid-registry';
import { classificationEntityCategorySchema } from '../../types';
import { createNonUrlPlugin, type NonUrlV0Profile } from '../shared/non-url';

const INT_PLUGIN_ID = 'int';
const INTUITION_DOMAIN = 'intuition';
const ASCII_EDGE_WHITESPACE = /^[\t-\r ]+|[\t-\r ]+$/g;

type CanonicalIidInput = {
	scheme: string;
	value: string;
	canonicalIid: string;
};

export const intProfile: NonUrlV0Profile = {
	id: INT_PLUGIN_ID,
	classifier: {
		id: 'int-identifier-classifier',
		priority: 20,
		classify: (_input, request) => {
			// The engine's generic classifier argument is Unicode-trimmed. IID
			// boundaries instead follow TWD-9d's ASCII-only normalization.
			const iid = canonicalizeIidInput(request.input);
			if (!iid) {
				return null;
			}

			return {
				type: 'identifier',
				domain: INTUITION_DOMAIN,
				subtype: iid.scheme,
				confidence: 1,
				meta: iid,
			};
		},
	},
	canResolve: (classification) =>
		classification.type === 'identifier' && classification.domain === INTUITION_DOMAIN,
	resolve: ({ request }) => {
		const iid = canonicalizeIidInput(request.input);
		if (!iid) {
			return null;
		}

		const classification = classificationForIid(iid.canonicalIid);
		const schemaType = classification?.schemaType ?? 'Thing';
		const categoryParse = classificationEntityCategorySchema.safeParse(
			classification ? getClassification(classification.slug)?.atomCategory : undefined
		);
		const category = categoryParse.success ? categoryParse.data : 'thing';

		return {
			fallbackUsed: classification === undefined,
			atoms: [
				{
					schemaType,
					category,
					title: iid.canonicalIid,
					canonicalId: iid.canonicalIid,
					source: INT_PLUGIN_ID,
					hints: {
						identifiers: { [iid.scheme]: iid.value },
					},
					metadata: {
						pluginId: INT_PLUGIN_ID,
						provider: INT_PLUGIN_ID,
						anchorEligible: isAnchorEligible(iid.canonicalIid),
						...(classification ? { classificationSlug: classification.slug } : {}),
					},
					// The canonical identifier is the load-bearing field here.
					// The engine's legacy shape layer still injects `name` (its
					// schemas require one) — emission must route through
					// buildAtomAnchor (C6), which collapses anchor-eligible IIDs
					// to bare D29 P0 bytes; metadata.anchorEligible is the signal.
					data: {
						'@context': 'https://schema.org/',
						'@type': schemaType,
						identifier: iid.canonicalIid,
					},
				},
			],
		};
	},
};

export function createIntuitionIdPlugin() {
	return createNonUrlPlugin({
		pluginId: INT_PLUGIN_ID,
		resolverId: 'int-resolver',
		profile: intProfile,
	});
}

function canonicalizeIidInput(input: string): CanonicalIidInput | null {
	const trimmed = foldIidCasing(input.replace(ASCII_EDGE_WHITESPACE, ''));
	if (!isIntuitionId(trimmed)) {
		return null;
	}

	const parsed = parseIntuitionId(trimmed);
	if (!parsed) {
		return null;
	}

	const canonicalValue = getScheme(parsed.scheme)?.canonicalize(parsed.value);
	if (!canonicalValue) {
		return null;
	}

	const canonicalIid = formatIntuitionId(parsed.scheme, canonicalValue);
	if (!validateIntuitionId(canonicalIid)) {
		return null;
	}

	return {
		scheme: parsed.scheme,
		value: canonicalValue,
		canonicalIid,
	};
}

function foldIidCasing(input: string): string {
	if (!/^int:/i.test(input)) {
		return input;
	}

	const payload = input.slice('int:'.length);
	const valueSeparator = payload.indexOf(':');
	const scheme = valueSeparator === -1 ? payload : payload.slice(0, valueSeparator);
	const rest = valueSeparator === -1 ? '' : payload.slice(valueSeparator);
	return `int:${scheme.toLowerCase()}${rest}`;
}
