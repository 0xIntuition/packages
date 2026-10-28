const ISBN_10_PATTERN = /^\d{9}[\dX]$/;
const ISBN_13_PATTERN = /^97[89]\d{10}$/;
const ISBN_PREFIX_PATTERN = /^ISBN(-1[03])?:?\s*/i;

export type ParsedIsbn = {
	isbn13: string;
	sourceType: 'isbn-10' | 'isbn-13';
};

export function normalizeIsbn(value: string): string | undefined {
	return parseIsbn(value)?.isbn13;
}

export function parseIsbn(value: string): ParsedIsbn | undefined {
	const compact = value.trim().replace(ISBN_PREFIX_PATTERN, '').replace(/[-\s]/g, '').toUpperCase();
	if (ISBN_10_PATTERN.test(compact)) {
		if (isbn10CheckDigit(compact.slice(0, 9)) !== compact[9]) {
			return undefined;
		}

		const core = `978${compact.slice(0, 9)}`;
		return { isbn13: `${core}${isbn13CheckDigit(core)}`, sourceType: 'isbn-10' };
	}

	if (!ISBN_13_PATTERN.test(compact)) {
		return undefined;
	}

	return isbn13CheckDigit(compact.slice(0, 12)) === Number(compact[12])
		? { isbn13: compact, sourceType: 'isbn-13' }
		: undefined;
}

function isbn10CheckDigit(core: string): string {
	let sum = 0;
	for (let index = 0; index < core.length; index += 1) {
		sum += (10 - index) * Number(core[index]);
	}
	const check = (11 - (sum % 11)) % 11;
	return check === 10 ? 'X' : String(check);
}

function isbn13CheckDigit(core: string): number {
	let sum = 0;
	for (let index = 0; index < core.length; index += 1) {
		sum += Number(core[index]) * (index % 2 === 0 ? 1 : 3);
	}
	return (10 - (sum % 10)) % 10;
}
