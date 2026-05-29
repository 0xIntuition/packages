import { I_SUBJECT_DATA } from './i-atom';
import { getPredicateByName } from './predicates';
import type {
	PredicateForm,
	PredicateLocaleBundle,
	PredicateLocaleForms,
	TextDirection,
} from './types';

export type SubjectContext = 'first-person' | 'singular' | 'plural';
export type PredicateRenderForm = Exclude<PredicateForm, 'thirdPerson'>;

export interface DetectSubjectContextOptions {
	isPlural?: boolean;
	pluralValues?: readonly string[];
}

export interface CreatePredicateLocaleBundleOptions {
	displayName?: string;
	direction?: TextDirection;
	forms?: Partial<PredicateLocaleForms>;
	templates?: Record<string, string>;
	version?: number;
}

export interface LocalizedPredicateRenderOptions {
	form?: PredicateRenderForm;
	subjectContext?: SubjectContext;
	localeBundle?: PredicateLocaleBundle | null;
}

function capitalize(value: string) {
	if (!value) {
		return value;
	}

	return value.charAt(0).toUpperCase() + value.slice(1);
}

export function renderPredicate(predicateName: string, subjectContext: SubjectContext) {
	const predicate = getPredicateByName(predicateName);

	if (
		subjectContext === 'singular' &&
		predicate?.conjugates &&
		typeof predicate.thirdPerson === 'string'
	) {
		return predicate.thirdPerson;
	}

	return predicateName;
}

export function getPredicateDisplayName(predicateName: string) {
	return capitalize(predicateName);
}

export function createPredicateLocaleBundle(
	predicateAtomId: string,
	canonicalName: string,
	locale: string,
	options: CreatePredicateLocaleBundleOptions = {}
): PredicateLocaleBundle {
	return {
		predicateAtomId,
		canonicalName,
		locale,
		version: options.version ?? 1,
		displayName: options.displayName ?? getPredicateDisplayName(canonicalName),
		forms: {
			base: options.forms?.base ?? canonicalName,
			thirdPerson: options.forms?.thirdPerson,
			pastParticiple: options.forms?.pastParticiple,
		},
		templates: options.templates,
		meta:
			options.direction !== undefined
				? {
						direction: options.direction,
					}
				: undefined,
	};
}

export function renderLocalizedPredicate(
	predicateName: string,
	options: LocalizedPredicateRenderOptions = {}
) {
	const subjectContext = options.subjectContext ?? 'first-person';
	const form = options.form ?? 'base';
	const localeBundle = options.localeBundle ?? undefined;

	if (form === 'displayName') {
		return localeBundle?.displayName ?? getPredicateDisplayName(predicateName);
	}

	if (form === 'pastParticiple') {
		return localeBundle?.forms?.pastParticiple ?? renderPredicate(predicateName, subjectContext);
	}

	if (
		subjectContext === 'singular' &&
		localeBundle?.forms?.thirdPerson &&
		localeBundle.meta?.conjugates !== false
	) {
		return localeBundle.forms.thirdPerson;
	}

	if (localeBundle?.forms?.base) {
		return localeBundle.forms.base;
	}

	return renderPredicate(predicateName, subjectContext);
}

export const renderPredicateLocalized = renderLocalizedPredicate;

export function detectSubjectContext(
	subjectAtomData: string,
	options: DetectSubjectContextOptions = {}
): SubjectContext {
	const normalized = subjectAtomData.trim();

	if (normalized === I_SUBJECT_DATA) {
		return 'first-person';
	}

	if (options.isPlural) {
		return 'plural';
	}

	if (
		options.pluralValues?.some(
			(value) => value.trim().toLocaleLowerCase() === normalized.toLocaleLowerCase()
		)
	) {
		return 'plural';
	}

	return 'singular';
}

export { createPredicateAtomData } from '@0xintuition/ids';
