/** Licensed catalog API origin, shared by identity lookup and enrichment. */
export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

export function buildTmdbFindEndpoint(imdbId: string, apiKey: string): string {
	const endpoint = new URL(`${TMDB_API_BASE_URL}/find/${imdbId}`);
	endpoint.searchParams.set('external_source', 'imdb_id');
	endpoint.searchParams.set('api_key', apiKey);
	return endpoint.toString();
}
