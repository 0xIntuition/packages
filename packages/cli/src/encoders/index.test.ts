import { describe, expect, it } from 'vitest';
import * as encoders from './index';
import { peripheryEncoderCatalog } from './periphery';

describe('encoders index', () => {
	it('re-exports all periphery encoders', () => {
		for (const entry of peripheryEncoderCatalog) {
			expect(typeof (encoders as Record<string, unknown>)[entry.encoderName]).toBe('function');
		}
	});
});
