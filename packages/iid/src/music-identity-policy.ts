/** Music rows shared by the ladder and classification's existing IID dependency. */
export const MUSIC_IDENTITY_RUNG_POLICY = {
	artist: { schemaType: 'MusicGroup', rungs: ['isni', 'mbid:artist', 'wd', 'spotify:artist'] },
	'music-album': { schemaType: 'MusicAlbum', rungs: ['mbid:release-group', 'wd', 'spotify:album'] },
} as const;

/** Only a music policy row admitting plain wd permits a plain-QID primary. */
export function isPlainWdPrimaryAllowed(schemaType: string): boolean {
	return Object.values(MUSIC_IDENTITY_RUNG_POLICY).some(
		(row) => row.schemaType === schemaType && (row.rungs as readonly string[]).includes('wd')
	);
}
