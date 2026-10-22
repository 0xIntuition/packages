import type { IdentityRungToken } from './category-rungs.js';
import { iidForIdentityRung } from './identity-rung-iid.js';
import {
	type LadderInput,
	type LadderOptions,
	type LadderResult,
	projectIdentifierLadder,
} from './ladder.js';

/** The two ladder entry points with an application policy bound at construction. */
export type Ladder = {
	projectIdentifierLadder: (input: LadderInput) => LadderResult;
	iidForIdentityRung: (
		rung: IdentityRungToken,
		value: string,
		primarySchemaType?: string
	) => string | undefined;
};

/** Bind an application policy once without changing the spec-conforming defaults. */
export function createLadder(options: LadderOptions = {}): Ladder {
	const policy: LadderOptions = { providerLocalHandles: options.providerLocalHandles ?? 'reject' };
	return {
		projectIdentifierLadder: (input: LadderInput) => projectIdentifierLadder(input, policy),
		iidForIdentityRung: (rung: IdentityRungToken, value: string, primarySchemaType?: string) =>
			iidForIdentityRung(rung, value, primarySchemaType, policy),
	};
}
