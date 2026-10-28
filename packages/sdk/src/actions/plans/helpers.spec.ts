import { describe, expect, it } from 'vitest';

import { buildPlanStep, serializeEnvelopeObject } from './helpers';

describe('plan helpers', () => {
	it('returns undefined for empty serializable objects input', () => {
		expect(serializeEnvelopeObject()).toBeUndefined();
	});

	it('serializes bigint values in nested plan metadata', () => {
		expect(
			serializeEnvelopeObject({
				amount: 10n,
				nested: {
					values: [1n, 'two', null],
				},
			})
		).toEqual({
			amount: '10',
			nested: {
				values: ['1', 'two', null],
			},
		});
	});

	it('omits optional metadata when a step only needs intent and calldata', () => {
		const step = buildPlanStep({
			id: 'deposit',
			intent: {
				chainId: 1155,
				contract: 'multivault',
			},
			data: '0x1234',
		});

		expect(step.metadata).toBeUndefined();
		expect(step.value).toBeUndefined();
	});
});
