export interface KnownDivergence {
	id: string;
	side: string;
	reason: string;
	removeWhen: string;
	detail?: string;
	actualHash: string;
	expectedHash: string;
}

/** Exact normalized output fingerprints pin both sides; agreement or drift fails. */
export const knownDivergences: readonly KnownDivergence[] = [
	{
		id: 'iid_uppercase_prefix_scheme',
		side: 'ruling: lenient ingest parse in the reference vs the strict corpus grammar in the public parser',
		reason:
			'namespace and scheme are case-sensitive in the corpus; the reference parser contract canonicalizes uppercase input',
		removeWhen:
			'the ruling lands: the reference moves lenient ingest behind an explicit helper and parses strictly, or the public parser adopts the lenient shape',
		actualHash: 'b3e7ace536446be29d4baf11a31b918f002994c56f729e11706d60175b683bbf',
		expectedHash: 'a5805e8d03b1d2253d62501496e6cb63d24f6129e5b840e0a94517ac36b8b12d',
	},
	{
		id: 'anchor:harvested: empty options object equals no options (gen1 person)',
		side: "reference adopts the train's builder",
		reason: 'identity-field order: recipe order vs sorted by key',
		removeWhen: 'reference regenerated after it adopts the public builder',
		actualHash: '67cb277d0814c86a0836fbe3fb3683ef039605ff2793cd54921bd4dcaa4f4058',
		expectedHash: '58d786ddd60dd6ff7ae8645ac30232986c77b42bc550269bd6834525d8876de4',
	},
	{
		id: 'anchor:harvested: gen1 person r4 recipe evidence (two identity fields, recipe order)',
		side: "reference adopts the train's builder",
		reason: 'identity-field order: recipe order vs sorted by key',
		removeWhen: 'reference regenerated after it adopts the public builder',
		actualHash: '67cb277d0814c86a0836fbe3fb3683ef039605ff2793cd54921bd4dcaa4f4058',
		expectedHash: '58d786ddd60dd6ff7ae8645ac30232986c77b42bc550269bd6834525d8876de4',
	},
	{
		id: 'anchor:synthetic: job-posting gen1 r2 title + datePosted (recipe order differs from sorted)',
		side: "reference adopts the train's builder",
		reason: 'identity-field order: recipe order vs sorted by key',
		removeWhen: 'reference regenerated after it adopts the public builder',
		actualHash: '3e3bfc12246c5321b9092342225fbf67ee7fd9529c40059cac0966ac26b89d61',
		expectedHash: '4131e70df64ff668861e61d01d8a072bd1249de912debe759e6c11c5b5527d37',
	},
	{
		id: 'anchor:synthetic: news-article gen1 r2 headline + datePublished (recipe order differs from sorted)',
		side: "reference adopts the train's builder",
		reason: 'identity-field order: recipe order vs sorted by key',
		removeWhen: 'reference regenerated after it adopts the public builder',
		actualHash: '4e9b1a5515bfe4c973d14c79d8bff9845ec2bf45075c52fea35ec20e22888954',
		expectedHash: '820c44249b48279f598798d5c60f003277e52d0a0e88e99b76c333c4b9fa806f',
	},
	{
		id: 'anchor:synthetic: person gen1 r4 with extra undeclared field ignored (identity path skips validation)',
		side: "reference adopts the train's builder",
		reason: 'identity-field order: recipe order vs sorted by key',
		removeWhen: 'reference regenerated after it adopts the public builder',
		actualHash: '67cb277d0814c86a0836fbe3fb3683ef039605ff2793cd54921bd4dcaa4f4058',
		expectedHash: '58d786ddd60dd6ff7ae8645ac30232986c77b42bc550269bd6834525d8876de4',
	},
	{
		id: 'anchor:synthetic: podcast-episode gen1 r3 name + datePublished (recipe order differs from sorted)',
		side: "reference adopts the train's builder",
		reason: 'identity-field order: recipe order vs sorted by key',
		removeWhen: 'reference regenerated after it adopts the public builder',
		actualHash: '1e9d45e413de2205c0bcb701c4d443e87f02252e70782c85c8c78f627794f848',
		expectedHash: 'e5bff920b82e414d13b8166b2dabff68255cdfa0918709bd3c9c18d846517aa0',
	},
	{
		id: 'parse-009',
		side: 'ruling: lenient ingest parse in the reference vs the strict corpus grammar in the public parser',
		reason: 'reference parser accepts value characters outside the corpus grammar %x21-7E',
		removeWhen:
			'the ruling lands: the reference moves lenient ingest behind an explicit helper and parses strictly, or the public parser adopts the lenient shape',
		actualHash: '865442c2f478f235e6f9e3e441f6dc59a99d39dfe2af46c560947288fee82336',
		expectedHash: '96733aa9457d6308d8644720cfec54340dfd8930412ee52f60a6aaa67f03e1cd',
	},
	{
		id: 'parse-010',
		side: 'ruling: lenient ingest parse in the reference vs the strict corpus grammar in the public parser',
		reason: 'reference parser accepts value characters outside the corpus grammar %x21-7E',
		removeWhen:
			'the ruling lands: the reference moves lenient ingest behind an explicit helper and parses strictly, or the public parser adopts the lenient shape',
		actualHash: '49d9143c4d5cb03301aefd67062a0028a04fa13f73e4858a2465d2635dc7670c',
		expectedHash: '96733aa9457d6308d8644720cfec54340dfd8930412ee52f60a6aaa67f03e1cd',
	},
];
