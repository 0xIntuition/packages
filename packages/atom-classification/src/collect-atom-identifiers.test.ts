import { expect, test } from 'bun:test';
import { IDENTITY_CATEGORIES } from '@0xintuition/iid-ladder';
import { collectAtomIdentifiers } from './collect-atom-identifiers';
import { classificationEntityCategorySchema } from './types';

test('classification accepts every ladder category', () => {
	for (const category of IDENTITY_CATEGORIES)
		expect(classificationEntityCategorySchema.safeParse(category).success).toBe(true);
});
test('album identifiers retain release-group authority without minting unregistered provider IIDs', () => {
	const mbid = 'int:mbid:release-group:6b1b8f24-9d81-4b3a-8ad8-3791ae3e6c76';
	const album = 'int:spotify:album:4uLU6hMCjMI75M1A2tKUQC';
	expect(
		collectAtomIdentifiers({
			schemaType: 'MusicAlbum',
			data: { identifier: album },
			hints: { identifierSet: [album, mbid, 'int:imdb:tt0133093'] },
		})
	).toEqual([mbid, 'int:imdb:tt0133093']);
});
