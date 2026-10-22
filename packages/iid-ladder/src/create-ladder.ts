import type { IdentityRungToken } from './category-rungs.js';
import { iidForIdentityRung } from './identity-rung-iid.js';
import { type LadderInput, type LadderOptions, projectIdentifierLadder } from './ladder.js';

/** Bind an application policy once without changing the spec-conforming defaults. */
export function createLadder(options: LadderOptions = {}) {
	const policy: LadderOptions = { providerLocalHandles: options.providerLocalHandles ?? 'reject' };
	return {
		projectIdentifierLadder: (input: LadderInput) => projectIdentifierLadder(input, policy),
		iidForIdentityRung: (rung: IdentityRungToken, value: string, primarySchemaType?: string) =>
			iidForIdentityRung(rung, value, primarySchemaType, policy),
	};
}
