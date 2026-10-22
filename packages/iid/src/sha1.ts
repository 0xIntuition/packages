/**
 * Minimal pure SHA-1 (FIPS 180-4), needed only for RFC 4122 UUIDv5
 * derivation (Podcasting 2.0 feed GUIDs). Not used for any security
 * purpose. Implemented in-package to avoid a new dependency.
 */
export function sha1Bytes(message: Uint8Array): Uint8Array {
	const ml = message.length;
	const withPadding = new Uint8Array((((ml + 8) >> 6) + 1) << 6);
	withPadding.set(message);
	withPadding[ml] = 0x80;

	const bitLength = ml * 8;
	const view = new DataView(withPadding.buffer);
	view.setUint32(withPadding.length - 8, Math.floor(bitLength / 0x100000000), false);
	view.setUint32(withPadding.length - 4, bitLength >>> 0, false);

	let h0 = 0x67452301;
	let h1 = 0xefcdab89;
	let h2 = 0x98badcfe;
	let h3 = 0x10325476;
	let h4 = 0xc3d2e1f0;

	const w = new Uint32Array(80);

	for (let block = 0; block < withPadding.length; block += 64) {
		for (let i = 0; i < 16; i++) {
			w[i] = view.getUint32(block + i * 4, false);
		}

		for (let i = 16; i < 80; i++) {
			const value = (w[i - 3] ?? 0) ^ (w[i - 8] ?? 0) ^ (w[i - 14] ?? 0) ^ (w[i - 16] ?? 0);
			w[i] = (value << 1) | (value >>> 31);
		}

		let a = h0;
		let b = h1;
		let c = h2;
		let d = h3;
		let e = h4;

		for (let i = 0; i < 80; i++) {
			let f: number;
			let k: number;

			if (i < 20) {
				f = (b & c) | (~b & d);
				k = 0x5a827999;
			} else if (i < 40) {
				f = b ^ c ^ d;
				k = 0x6ed9eba1;
			} else if (i < 60) {
				f = (b & c) | (b & d) | (c & d);
				k = 0x8f1bbcdc;
			} else {
				f = b ^ c ^ d;
				k = 0xca62c1d6;
			}

			const temp = (((a << 5) | (a >>> 27)) + f + e + k + (w[i] ?? 0)) >>> 0;
			e = d;
			d = c;
			c = (b << 30) | (b >>> 2);
			b = a;
			a = temp;
		}

		h0 = (h0 + a) >>> 0;
		h1 = (h1 + b) >>> 0;
		h2 = (h2 + c) >>> 0;
		h3 = (h3 + d) >>> 0;
		h4 = (h4 + e) >>> 0;
	}

	const out = new Uint8Array(20);
	const outView = new DataView(out.buffer);
	outView.setUint32(0, h0, false);
	outView.setUint32(4, h1, false);
	outView.setUint32(8, h2, false);
	outView.setUint32(12, h3, false);
	outView.setUint32(16, h4, false);
	return out;
}
