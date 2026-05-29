import { describe, expect, it } from 'vitest';

import {
	divWadDown,
	divWadUp,
	feeOnRaw,
	marketCap,
	mulDivDown,
	mulDivUp,
	mulWadDown,
	mulWadUp,
	requirePositiveEvenSlope,
	sqrt,
	sqrtWad,
	squareWadDown,
	squareWadUp,
	WAD,
} from '../math';

const E18 = WAD;

describe('math', () => {
	describe('mulDivDown', () => {
		it('returns exact result when evenly divisible', () => {
			expect(mulDivDown(10n, 20n, 5n)).toBe(40n);
		});

		it('rounds toward zero', () => {
			// 7 * 3 / 5 = 4.2 → 4
			expect(mulDivDown(7n, 3n, 5n)).toBe(4n);
		});

		it('returns 0 when a or b is 0', () => {
			expect(mulDivDown(0n, 100n, 1n)).toBe(0n);
			expect(mulDivDown(100n, 0n, 1n)).toBe(0n);
		});

		it('throws on zero denominator', () => {
			expect(() => mulDivDown(1n, 1n, 0n)).toThrow('Denominator must be greater than zero.');
		});
	});

	describe('mulDivUp', () => {
		it('returns exact result when evenly divisible', () => {
			expect(mulDivUp(10n, 20n, 5n)).toBe(40n);
		});

		it('rounds up when remainder exists', () => {
			// 7 * 3 / 5 = 4.2 → 5
			expect(mulDivUp(7n, 3n, 5n)).toBe(5n);
		});

		it('returns 0 when a or b is 0', () => {
			expect(mulDivUp(0n, 100n, 1n)).toBe(0n);
			expect(mulDivUp(100n, 0n, 1n)).toBe(0n);
		});

		it('throws on zero denominator', () => {
			expect(() => mulDivUp(1n, 1n, 0n)).toThrow('Denominator must be greater than zero.');
		});
	});

	describe('mulWadDown / mulWadUp', () => {
		it('multiplies WAD-scaled values correctly', () => {
			const two = 2n * E18;
			const three = 3n * E18;
			expect(mulWadDown(two, three)).toBe(6n * E18);
			expect(mulWadUp(two, three)).toBe(6n * E18);
		});

		it('rounds correctly for fractional results', () => {
			// 1 * 1 / WAD = 0 (down) or 1 (up)
			expect(mulWadDown(1n, 1n)).toBe(0n);
			expect(mulWadUp(1n, 1n)).toBe(1n);
		});
	});

	describe('divWadDown / divWadUp', () => {
		it('divides WAD-scaled values correctly', () => {
			const six = 6n * E18;
			const three = 3n * E18;
			expect(divWadDown(six, three)).toBe(2n * E18);
			expect(divWadUp(six, three)).toBe(2n * E18);
		});

		it('rounds correctly for fractional results', () => {
			// 1 * WAD / 3 rounds differently
			const downResult = divWadDown(1n, 3n);
			const upResult = divWadUp(1n, 3n);
			expect(upResult).toBe(downResult + 1n);
			// Match Rust parity: divUp(1, 3) = 333_333_333_333_333_334
			expect(upResult).toBe(333_333_333_333_333_334n);
		});

		it('throws on zero divisor', () => {
			expect(() => divWadDown(1n, 0n)).toThrow('Divisor must be greater than zero.');
			expect(() => divWadUp(1n, 0n)).toThrow('Divisor must be greater than zero.');
		});

		it('divWadUp returns 0 for zero numerator', () => {
			expect(divWadUp(0n, 3n)).toBe(0n);
		});
	});

	describe('sqrt', () => {
		it('handles small values', () => {
			expect(sqrt(0n)).toBe(0n);
			expect(sqrt(1n)).toBe(1n);
			expect(sqrt(4n)).toBe(2n);
			expect(sqrt(9n)).toBe(3n);
		});

		it('returns floor for non-perfect squares', () => {
			expect(sqrt(2n)).toBe(1n);
			expect(sqrt(3n)).toBe(1n);
			expect(sqrt(5n)).toBe(2n);
			expect(sqrt(8n)).toBe(2n);
		});

		it('handles large values', () => {
			const largeVal = 10n ** 36n;
			expect(sqrt(largeVal)).toBe(10n ** 18n);
		});

		it('throws on negative values', () => {
			expect(() => sqrt(-1n)).toThrow('Cannot compute square root of a negative value.');
		});
	});

	describe('sqrtWad', () => {
		it('matches Rust parity: sqrtWad(2.25e18) = 1.5e18', () => {
			const twoAndQuarter = 2_250_000_000_000_000_000n;
			expect(sqrtWad(twoAndQuarter)).toBe(1_500_000_000_000_000_000n);
		});

		it('handles WAD = 1.0', () => {
			expect(sqrtWad(E18)).toBe(E18);
		});

		it('throws on negative', () => {
			expect(() => sqrtWad(-1n)).toThrow('Cannot compute square root of a negative value.');
		});
	});

	describe('squareWadDown / squareWadUp', () => {
		it('squares WAD-scaled values', () => {
			const oneAndHalf = 1_500_000_000_000_000_000n;
			expect(squareWadDown(oneAndHalf)).toBe(2_250_000_000_000_000_000n);
		});

		it('rounds differently for tiny values', () => {
			// squareUp(1) = ceil(1*1/WAD) = 1
			expect(squareWadUp(1n)).toBe(1n);
			// squareDown(1) = floor(1*1/WAD) = 0
			expect(squareWadDown(1n)).toBe(0n);
		});
	});

	describe('requirePositiveEvenSlope', () => {
		it('does not throw for valid even slope', () => {
			expect(() => requirePositiveEvenSlope(2n)).not.toThrow();
			expect(() => requirePositiveEvenSlope(2n * E18)).not.toThrow();
			expect(() => requirePositiveEvenSlope(100n)).not.toThrow();
		});

		it('throws for odd slope', () => {
			expect(() => requirePositiveEvenSlope(1n)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
			expect(() => requirePositiveEvenSlope(3n)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});

		it('throws for zero slope', () => {
			expect(() => requirePositiveEvenSlope(0n)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});

		it('throws for negative slope', () => {
			expect(() => requirePositiveEvenSlope(-2n)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});
	});

	describe('feeOnRaw', () => {
		it('matches Rust parity: feeOnRaw(1000, 150, 10000) = 15', () => {
			expect(feeOnRaw(1000n, 150n, 10000n)).toBe(15n);
		});

		it('rounds up when remainder exists', () => {
			// 999 * 1 / 10000 = 0.0999 → 1
			expect(feeOnRaw(999n, 1n, 10000n)).toBe(1n);
		});

		it('returns 0 when amount is 0', () => {
			expect(feeOnRaw(0n, 150n, 10000n)).toBe(0n);
		});

		it('returns 0 when fee is 0', () => {
			expect(feeOnRaw(1000n, 0n, 10000n)).toBe(0n);
		});
	});

	describe('marketCap', () => {
		it('matches Rust parity: marketCap(10e18, 21e18) = 210e18', () => {
			expect(marketCap(10_000_000_000_000_000_000n, 21_000_000_000_000_000_000n)).toBe(
				210_000_000_000_000_000_000n
			);
		});

		it('returns 0 for zero shares', () => {
			expect(marketCap(0n, E18)).toBe(0n);
		});
	});
});
