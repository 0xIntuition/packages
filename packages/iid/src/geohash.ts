const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode coordinates as a geohash of the given precision.
 *
 * Precisions used by the spec: 7 (~150m cell) for local-business identity
 * recipes, 8 (~38m cell) for the `geo` scheme's point locations.
 */
export function geohashEncode(latitude: number, longitude: number, precision: number): string {
	if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
		throw new Error(`Invalid latitude: ${latitude}`);
	}

	if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
		throw new Error(`Invalid longitude: ${longitude}`);
	}

	if (!Number.isInteger(precision) || precision < 1 || precision > 12) {
		throw new Error(`Invalid geohash precision: ${precision}`);
	}

	const latRange: [number, number] = [-90, 90];
	const lonRange: [number, number] = [-180, 180];
	let useLongitude = true;
	let bits = 0;
	let charIndex = 0;
	let out = '';

	while (out.length < precision) {
		const range = useLongitude ? lonRange : latRange;
		const value = useLongitude ? longitude : latitude;
		const mid = (range[0] + range[1]) / 2;

		if (value >= mid) {
			charIndex = (charIndex << 1) | 1;
			range[0] = mid;
		} else {
			charIndex <<= 1;
			range[1] = mid;
		}

		useLongitude = !useLongitude;
		bits += 1;

		if (bits === 5) {
			out += BASE32[charIndex];
			bits = 0;
			charIndex = 0;
		}
	}

	return out;
}
