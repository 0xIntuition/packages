import { getClassification } from './classifications.js';
import type {
	ClassificationFieldSpec,
	ClassificationValidationIssue,
	ClassificationValueMap,
	FieldType,
} from './types.js';

export function buildAtomData(slug: string, values: ClassificationValueMap): string {
	return JSON.stringify(buildAtomDataObject(slug, values));
}

export function buildAtomDataObject(
	slug: string,
	values: ClassificationValueMap
): Record<string, unknown> {
	const spec = requireClassification(slug);
	const issues = validateClassificationValues(slug, values);

	if (issues.length > 0) {
		throw new Error(formatValidationIssues(slug, issues));
	}

	const dataEntries: Array<[string, unknown]> = [];

	if (spec.schema) {
		dataEntries.push(['@context', spec.schema.context], ['@type', spec.type]);
	}

	for (const field of spec.fields) {
		const value = values[field.key];

		if (value === undefined) {
			continue;
		}

		dataEntries.push([field.key, normalizeFieldValue(field.fieldType, value)]);
	}

	return Object.fromEntries(dataEntries);
}

export function validateClassificationValues(
	slug: string,
	values: ClassificationValueMap
): ClassificationValidationIssue[] {
	const spec = requireClassification(slug);
	const allowedKeys = new Set(spec.fields.map((field) => field.key));
	const issues: ClassificationValidationIssue[] = [];

	if (!isPlainRecord(values)) {
		return [{ message: 'Expected a plain object of classification field values.' }];
	}

	for (const key of Object.keys(values)) {
		if (!allowedKeys.has(key)) {
			issues.push({
				field: key,
				message: `Unknown field "${key}" for classification "${slug}".`,
			});
		}
	}

	for (const field of spec.fields) {
		const value = values[field.key];

		if (value === undefined) {
			if (field.required) {
				issues.push({
					field: field.key,
					message: `Missing required field "${field.key}".`,
				});
			}

			continue;
		}

		const message = validateFieldValue(field, value);

		if (message) {
			issues.push({
				field: field.key,
				message,
			});
		}
	}

	return issues;
}

function requireClassification(slug: string) {
	const spec = getClassification(slug);

	if (!spec) {
		throw new Error(`Unknown classification "${slug}".`);
	}

	return spec;
}

function validateFieldValue(field: ClassificationFieldSpec, value: unknown): string | undefined {
	switch (field.fieldType) {
		case 'string':
			return isNonEmptyString(value)
				? undefined
				: `Field "${field.key}" must be a non-empty string.`;
		case 'url':
			return isValidUrlValue(value)
				? undefined
				: `Field "${field.key}" must be a valid URL string.`;
		case 'address':
			return isValidAddressValue(value)
				? undefined
				: `Field "${field.key}" must be a valid Ethereum address.`;
		case 'number':
			return isFiniteNumberLike(value)
				? undefined
				: `Field "${field.key}" must be a finite number or numeric string.`;
		case 'integer':
			return isIntegerLike(value)
				? undefined
				: `Field "${field.key}" must be an integer or integer string.`;
		case 'string[]':
			return isStringArray(value)
				? undefined
				: `Field "${field.key}" must be an array of non-empty strings.`;
		case 'iso-date':
			return isIsoDateValue(value)
				? undefined
				: `Field "${field.key}" must be an ISO date string (YYYY-MM-DD).`;
		case 'iso-datetime':
			return isIsoDateTimeValue(value)
				? undefined
				: `Field "${field.key}" must be an ISO datetime string.`;
		default:
			return exhaustivenessError(field.fieldType);
	}
}

function normalizeFieldValue(fieldType: FieldType, value: unknown): unknown {
	if (fieldType === 'string[]') {
		return [...(value as string[])];
	}

	return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((entry) => isNonEmptyString(entry));
}

function isValidUrlValue(value: unknown): value is string {
	if (!isNonEmptyString(value)) {
		return false;
	}

	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

function isValidAddressValue(value: unknown): value is `0x${string}` {
	return isNonEmptyString(value) && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isFiniteNumberLike(value: unknown): boolean {
	if (typeof value === 'number') {
		return Number.isFinite(value);
	}

	return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value));
}

function isIntegerLike(value: unknown): boolean {
	if (typeof value === 'number') {
		return Number.isInteger(value);
	}

	if (typeof value !== 'string' || value.trim().length === 0) {
		return false;
	}

	return /^-?\d+$/.test(value);
}

function isIsoDateValue(value: unknown): value is string {
	return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoDateTimeValue(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function formatValidationIssues(
	slug: string,
	issues: readonly ClassificationValidationIssue[]
): string {
	return `Invalid values for classification "${slug}": ${issues.map((issue) => issue.message).join(' ')}`;
}

function exhaustivenessError(value: never): never {
	throw new Error(`Unhandled field type: ${value satisfies never}`);
}
