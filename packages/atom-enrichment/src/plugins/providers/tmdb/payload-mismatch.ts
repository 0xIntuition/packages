/** A TMDB payload that answers for another id than the one requested: unusable, not a bug. */
export class TmdbPayloadMismatchError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TmdbPayloadMismatchError';
	}
}
