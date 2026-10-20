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
