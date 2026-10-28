import { describe, expect, it } from 'vitest';

import {
	authUserIdHash,
	calculateAuthUserAtomId,
	createAuthUserAtomData,
	serializeAuthUserAtomData,
} from '../auth-user-atom.js';

const USER_ID = '018f8f2d-7d7b-7c2d-9a07-5f5f1adbd201';

describe('auth user atom helpers', () => {
	it('normalizes user ids before hashing', () => {
		expect(authUserIdHash(USER_ID)).toBe(authUserIdHash(`  ${USER_ID.toUpperCase()}  `));
	});

	it('serializes deterministic public auth identity metadata', () => {
		const data = createAuthUserAtomData({ userId: USER_ID });
		const serialized = serializeAuthUserAtomData({ userId: USER_ID });

		expect(data.userIdHash).toMatch(/^0x[0-9a-f]{64}$/);
		expect(serialized).toBe(
			`{"@type":"IntuitionAuthUser","@context":"https://schema.0xintuition.com/v1/metadata.jsonld","derivationVersion":"auth-user-default-wallet-v1","userIdHash":"${data.userIdHash}"}`
		);
		expect(serialized).not.toContain(USER_ID);
	});

	it('derives a stable atom id from the auth user identity payload', () => {
		expect(calculateAuthUserAtomId({ userId: USER_ID })).toBe(
			calculateAuthUserAtomId({ userId: USER_ID })
		);
	});
});
