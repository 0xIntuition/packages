export type TmdbTitleProjectionArtifact = {
	artifactKind: string;
	data: unknown;
	error?: unknown;
	stableKey?: string | null;
	status: string;
};

/**
 * @deprecated JP ruling 2026-08-27: TMDB is never a source in any form.
 * Kept as an identity-preserving compatibility export for older callers.
 */
export function projectTmdbTitleFromArtifacts(
	dataResolved: unknown,
	_artifacts: readonly TmdbTitleProjectionArtifact[]
): unknown {
	return dataResolved;
}
