/**
 * HTTP statuses of a fetched page that opengraph's fetch and the page observer must agree on, so
 * the observed outcome can never disagree with opengraph's own result.
 */

/** The site refused us (opengraph `blocked`, observed as `blocked`). */
export const BLOCKED_STATUSES: ReadonlySet<number> = new Set([401, 403, 451]);

/** The page is gone (opengraph `dead_url`, observed as a miss). */
export const DEAD_URL_STATUSES: ReadonlySet<number> = new Set([404, 410]);
