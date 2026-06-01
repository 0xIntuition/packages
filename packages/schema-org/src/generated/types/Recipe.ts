import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRecipe = {
	id: 'schema:Recipe',
	name: 'Recipe',
	label: 'Recipe',
	comment:
		'A recipe. For dietary restrictions covered by the recipe, a few common restrictions are enumerated via [[suitableForDiet]]. The [[keywords]] property can also be used to add more detail.',
	subClassOf: ['HowTo', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:cookTime',
			name: 'cookTime',
			label: 'cookTime',
			comment:
				'The time it takes to actually cook the dish, in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:cookingMethod',
			name: 'cookingMethod',
			label: 'cookingMethod',
			comment: 'The method of cooking, such as Frying, Steaming, ...',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:ingredients',
			name: 'ingredients',
			label: 'ingredients',
			comment: 'A single ingredient used in the recipe, e.g. sugar, flour or garlic.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:nutrition',
			name: 'nutrition',
			label: 'nutrition',
			comment: 'Nutrition information about the recipe or menu item.',
			rangeIncludes: ['NutritionInformation'],
		},
		{
			id: 'schema:recipeCategory',
			name: 'recipeCategory',
			label: 'recipeCategory',
			comment: 'The category of the recipe—for example, appetizer, entree, etc.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:recipeCuisine',
			name: 'recipeCuisine',
			label: 'recipeCuisine',
			comment: 'The cuisine of the recipe (for example, French or Ethiopian).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:recipeIngredient',
			name: 'recipeIngredient',
			label: 'recipeIngredient',
			comment:
				'An ingredient or ordered list of ingredients and potentially quantities used in the recipe, e.g. 1 cup of sugar, flour or garlic.  The ingredients can be represented as free text or more structured values.',
			rangeIncludes: ['ItemList', 'PropertyValue', 'Text'],
		},
		{
			id: 'schema:recipeInstructions',
			name: 'recipeInstructions',
			label: 'recipeInstructions',
			comment:
				'A step in making the recipe, in the form of a single item (document, video, etc.) or an ordered list with HowToStep and/or HowToSection items.',
			rangeIncludes: ['CreativeWork', 'ItemList', 'Text'],
		},
		{
			id: 'schema:recipeYield',
			name: 'recipeYield',
			label: 'recipeYield',
			comment:
				'The quantity produced by the recipe (for example, number of people served, number of servings, etc).',
			rangeIncludes: ['QuantitativeValue', 'Text'],
		},
		{
			id: 'schema:suitableForDiet',
			name: 'suitableForDiet',
			label: 'suitableForDiet',
			comment:
				'Indicates a dietary restriction or guideline for which this recipe or menu item is suitable, e.g. diabetic, halal etc.',
			rangeIncludes: ['Diet', 'RestrictedDiet'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRecipe;
export const Recipe = schemaOrgRecipe;

export default schemaOrgRecipe;
