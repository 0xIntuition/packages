import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgClaim = {
	id: 'schema:Claim',
	name: 'Claim',
	label: 'Claim',
	comment:
		'A [[Claim]] in Schema.org represents a specific, factually-oriented claim that could be the [[itemReviewed]] in a [[ClaimReview]]. The content of a claim can be summarized with the [[text]] property. Variations on well known claims can have their common identity indicated via [[sameAs]] links, and summarized with a [[name]]. Ideally, a [[Claim]] description includes enough contextual information to minimize the risk of ambiguity or inclarity. In practice, many claims are better understood in the context in which they appear or the interpretations provided by claim reviews.\n\n  Beyond [[ClaimReview]], the Claim type can be associated with related creative works - for example a [[ScholarlyArticle]] or [[Question]] might be [[about]] some [[Claim]].\n\n  At this time, Schema.org does not define any types of relationship between claims. This is a natural area for future exploration.\n  ',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:appearance',
			name: 'appearance',
			label: 'appearance',
			comment: 'Indicates an occurrence of a [[Claim]] in some [[CreativeWork]].',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:claimInterpreter',
			name: 'claimInterpreter',
			label: 'claimInterpreter',
			comment:
				'For a [[Claim]] interpreted from [[MediaObject]] content, the [[interpretedAsClaim]] property can be used to indicate a claim contained, implied or refined from the content of a [[MediaObject]].',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:firstAppearance',
			name: 'firstAppearance',
			label: 'firstAppearance',
			comment: 'Indicates the first known occurrence of a [[Claim]] in some [[CreativeWork]].',
			rangeIncludes: ['CreativeWork'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgClaim;
export const Claim = schemaOrgClaim;

export default schemaOrgClaim;
