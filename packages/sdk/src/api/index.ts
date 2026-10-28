type FetchHeaders = Record<string, string>;

type FetchResponseLike = {
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
	text(): Promise<string>;
};

export type FetchLike = (
	input: string,
	init?: {
		method?: string;
		headers?: FetchHeaders;
		body?: string;
	}
) => Promise<FetchResponseLike>;

export type IntuitionApiClientAuth =
	| {
			kind: 'bearer';
			token: string;
	  }
	| {
			kind: 'apiKey';
			value: string;
			headerName?: string;
	  };

export type IntuitionApiClientConfig = {
	baseUrl?: string;
	auth?: IntuitionApiClientAuth;
	fetch?: FetchLike;
	headers?: FetchHeaders;
};

export type IntuitionApiNetwork = 'local' | 'testnet' | 'mainnet';

export type IntuitionApiAtom = {
	termId: string;
	label: string | null;
	data: string | null;
	image: string | null;
	emoji: string | null;
	type: string | null;
};

export type IntuitionApiTermReference = {
	termId: string;
	label: string | null;
	image: string | null;
	type: string | null;
};

export type IntuitionApiTriple = {
	termId: string;
	subject: IntuitionApiTermReference;
	predicate: IntuitionApiTermReference;
	object: IntuitionApiTermReference;
};

export type IntuitionApiClient = {
	atoms: {
		getById(inputs: { termId: string }): Promise<IntuitionApiAtom | null>;
		getByLabel(inputs: { label: string }): Promise<IntuitionApiAtom | null>;
		getByData(inputs: { data: string }): Promise<IntuitionApiAtom | null>;
	};
	triples: {
		getById(inputs: { termId: string }): Promise<IntuitionApiTriple | null>;
	};
};

type GraphqlSuccess<TData> = {
	data?: TData;
	errors?: Array<{ message?: string }>;
};

export const INTUITION_API_URL_LOCAL = 'http://localhost:8080/v1/graphql';
export const INTUITION_API_URL_TESTNET = 'https://testnet.intuition.sh/v1/graphql';
export const INTUITION_API_URL_MAINNET = 'https://mainnet.intuition.sh/v1/graphql';

export function getIntuitionApiUrl(network: IntuitionApiNetwork): string {
	switch (network) {
		case 'local':
			return INTUITION_API_URL_LOCAL;
		case 'testnet':
			return INTUITION_API_URL_TESTNET;
		case 'mainnet':
			return INTUITION_API_URL_MAINNET;
	}
}

const ATOM_FIELDS = `
	term_id
	label
	data
	image
	emoji
	type
`;

const GET_ATOM_QUERY = `
	query GetSdkAtom($id: String!) {
		atom(term_id: $id) {
			${ATOM_FIELDS}
		}
	}
`;

const GET_ATOMS_BY_LABEL_QUERY = `
	query GetSdkAtomsByLabel($label: String!, $limit: Int!) {
		atoms(where: { label: { _eq: $label } }, limit: $limit) {
			${ATOM_FIELDS}
		}
	}
`;

const GET_ATOM_BY_DATA_QUERY = `
	query GetSdkAtomByData($data: String!, $limit: Int!) {
		atoms(where: { data: { _eq: $data } }, limit: $limit) {
			${ATOM_FIELDS}
		}
	}
`;

const TERM_REFERENCE_FIELDS = `
	term_id
	label
	image
	type
`;

const GET_TRIPLE_QUERY = `
	query GetSdkTriple($id: String!) {
		triple(term_id: $id) {
			term_id
			subject {
				${TERM_REFERENCE_FIELDS}
			}
			predicate {
				${TERM_REFERENCE_FIELDS}
			}
			object {
				${TERM_REFERENCE_FIELDS}
			}
		}
	}
`;

function buildHeaders(config: IntuitionApiClientConfig): FetchHeaders {
	const headers: FetchHeaders = {
		'Content-Type': 'application/json',
		...config.headers,
	};

	if (!config.auth) {
		return headers;
	}

	if (config.auth.kind === 'bearer') {
		headers.Authorization = `Bearer ${config.auth.token}`;
		return headers;
	}

	headers[config.auth.headerName ?? 'x-api-key'] = config.auth.value;
	return headers;
}

function resolveBaseUrl(baseUrl?: string): string {
	return baseUrl ?? INTUITION_API_URL_MAINNET;
}

function resolveFetch(fetcher?: FetchLike): FetchLike {
	if (fetcher) {
		return fetcher;
	}

	const candidate = (globalThis as { fetch?: FetchLike }).fetch;
	if (candidate) {
		return candidate;
	}

	throw new Error('A fetch implementation is required.');
}

function normalizeAtom(atom: {
	term_id: string;
	label?: string | null;
	data?: string | null;
	image?: string | null;
	emoji?: string | null;
	type?: string | null;
}): IntuitionApiAtom {
	return {
		termId: atom.term_id,
		label: atom.label ?? null,
		data: atom.data ?? null,
		image: atom.image ?? null,
		emoji: atom.emoji ?? null,
		type: atom.type ?? null,
	};
}

function normalizeTermReference(term: {
	term_id: string;
	label?: string | null;
	image?: string | null;
	type?: string | null;
}): IntuitionApiTermReference {
	return {
		termId: term.term_id,
		label: term.label ?? null,
		image: term.image ?? null,
		type: term.type ?? null,
	};
}

async function executeGraphql<TData, TVariables>(
	config: IntuitionApiClientConfig,
	query: string,
	variables: TVariables
): Promise<TData> {
	const response = await resolveFetch(config.fetch)(resolveBaseUrl(config.baseUrl), {
		method: 'POST',
		headers: buildHeaders(config),
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Intuition API request failed with status ${response.status}: ${body}`);
	}

	const payload = (await response.json()) as GraphqlSuccess<TData>;
	if (payload.errors?.length) {
		throw new Error(payload.errors[0]?.message ?? 'Intuition API request failed.');
	}

	if (!payload.data) {
		throw new Error('Intuition API response did not include data.');
	}

	return payload.data;
}

export function createIntuitionApiClient(config: IntuitionApiClientConfig): IntuitionApiClient {
	return {
		atoms: {
			async getById({ termId }) {
				if (!termId) {
					throw new Error('termId is required.');
				}

				const response = await executeGraphql<
					{
						atom: {
							term_id: string;
							label?: string | null;
							data?: string | null;
							image?: string | null;
							emoji?: string | null;
							type?: string | null;
						} | null;
					},
					{ id: string }
				>(config, GET_ATOM_QUERY, { id: termId });

				return response.atom ? normalizeAtom(response.atom) : null;
			},
			async getByLabel({ label }) {
				if (!label) {
					throw new Error('label is required.');
				}

				const response = await executeGraphql<
					{
						atoms: Array<{
							term_id: string;
							label?: string | null;
							data?: string | null;
							image?: string | null;
							emoji?: string | null;
							type?: string | null;
						}>;
					},
					{ label: string; limit: number }
				>(config, GET_ATOMS_BY_LABEL_QUERY, { label, limit: 1 });

				const atom = response.atoms[0];
				return atom ? normalizeAtom(atom) : null;
			},
			async getByData({ data }) {
				if (!data) {
					throw new Error('data is required.');
				}

				const response = await executeGraphql<
					{
						atoms: Array<{
							term_id: string;
							label?: string | null;
							data?: string | null;
							image?: string | null;
							emoji?: string | null;
							type?: string | null;
						}>;
					},
					{ data: string; limit: number }
				>(config, GET_ATOM_BY_DATA_QUERY, { data, limit: 1 });

				const atom = response.atoms[0];
				return atom ? normalizeAtom(atom) : null;
			},
		},
		triples: {
			async getById({ termId }) {
				if (!termId) {
					throw new Error('termId is required.');
				}

				const response = await executeGraphql<
					{
						triple: {
							term_id: string;
							subject: {
								term_id: string;
								label?: string | null;
								image?: string | null;
								type?: string | null;
							};
							predicate: {
								term_id: string;
								label?: string | null;
								image?: string | null;
								type?: string | null;
							};
							object: {
								term_id: string;
								label?: string | null;
								image?: string | null;
								type?: string | null;
							};
						} | null;
					},
					{ id: string }
				>(config, GET_TRIPLE_QUERY, { id: termId });

				if (!response.triple) {
					return null;
				}

				return {
					termId: response.triple.term_id,
					subject: normalizeTermReference(response.triple.subject),
					predicate: normalizeTermReference(response.triple.predicate),
					object: normalizeTermReference(response.triple.object),
				};
			},
		},
	};
}
