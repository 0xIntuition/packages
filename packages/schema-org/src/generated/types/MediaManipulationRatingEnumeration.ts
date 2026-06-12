import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMediaManipulationRatingEnumeration = {
	id: 'schema:MediaManipulationRatingEnumeration',
	name: 'MediaManipulationRatingEnumeration',
	label: 'MediaManipulationRatingEnumeration',
	comment:
		" Codes for use with the [[mediaAuthenticityCategory]] property, indicating the authenticity of a media object (in the context of how it was published or shared). In general these codes are not mutually exclusive, although some combinations (such as 'original' versus 'transformed', 'edited' and 'staged') would be contradictory if applied in the same [[MediaReview]]. Note that the application of these codes is with regard to a piece of media shared or published in a particular context.",
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMediaManipulationRatingEnumeration;
export const MediaManipulationRatingEnumeration = schemaOrgMediaManipulationRatingEnumeration;

export default schemaOrgMediaManipulationRatingEnumeration;
