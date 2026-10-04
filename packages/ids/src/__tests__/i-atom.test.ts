import { describe, expect, it } from 'vitest';

import { calculateAtomId } from '../atom-id.js';
import { I_SUBJECT, I_SUBJECT_DATA, I_SUBJECT_ID } from '../i-atom.js';

describe('I subject atom', () => {
	it('uses the exact first-person subject byte', () => {
		expect(I_SUBJECT_DATA).toBe('I');
		expect(I_SUBJECT).toBe(I_SUBJECT_DATA);
	});

	it('pins the train atom id for I', () => {
		expect(I_SUBJECT_ID).toBe('0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b');
		expect(I_SUBJECT_ID).toBe(calculateAtomId('I'));
	});
});
