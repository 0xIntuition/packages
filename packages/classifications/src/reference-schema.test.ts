import { getPropertiesFor, getType } from '@0xintuition/schema-org';
import { describe, expect, it } from 'vitest';
import { buildAtomData } from './atom-data.js';
import { CLASSIFICATION_SPECS, getClassification } from './classifications.js';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';

/**
 * Specs that declare the schema.org context but reference a type the pinned
 * vocabulary does not define. Amendment 1 requires the reference context/type
 * bytes, including this known drift. Keep the exception exact; a future
 * context migration needs a separate ruling because it changes atom bytes.
 */
const KNOWN_CONTEXT_DRIFT = new Set(['social-media-account']);

describe('classification schema.org references', () => {
	it('builds Intuition schema-backed atom data for blockchain classifications', () => {
		expect(
			buildAtomData('ethereum-account', {
				address: '0x0000000000000000000000000000000000000001',
			})
		).toBe(
			'{"@context":"https://schemas.intuition.systems/v1","@type":"EthereumAccount","address":"0x0000000000000000000000000000000000000001"}'
		);
		expect(
			buildAtomData('ethereum-erc20', {
				chainId: '1',
				address: '0x0000000000000000000000000000000000000001',
				name: 'Ether',
				symbol: 'ETH',
				decimals: '18',
			})
		).toBe(
			'{"@context":"https://schemas.intuition.systems/v1","@type":"EthereumERC20","chainId":"1","address":"0x0000000000000000000000000000000000000001","name":"Ether","symbol":"ETH","decimals":"18"}'
		);
		expect(
			buildAtomData('ethereum-smart-contract', {
				chainId: '1',
				address: '0x0000000000000000000000000000000000000002',
			})
		).toBe(
			'{"@context":"https://schemas.intuition.systems/v1","@type":"EthereumSmartContract","chainId":"1","address":"0x0000000000000000000000000000000000000002"}'
		);
	});
	it('resolves every schema.org-backed spec to a pinned vocabulary type', () => {
		const issues: string[] = [];

		for (const spec of CLASSIFICATION_SPECS) {
			if (spec.schema?.context !== SCHEMA_ORG_CONTEXT) {
				continue;
			}

			if (KNOWN_CONTEXT_DRIFT.has(spec.slug)) {
				continue;
			}

			if (!getType(spec.schema.type)) {
				issues.push(`${spec.slug}: unknown schema.org type "${spec.schema.type}"`);
			}
		}

		expect(issues).toEqual([]);
	});

	it('keeps the known-drift allowlist exact (entries must resolve as drifted)', () => {
		for (const slug of KNOWN_CONTEXT_DRIFT) {
			const spec = getClassification(slug);
			expect(spec, `${slug}: allowlisted spec no longer exists`).toBeDefined();
			expect(
				spec?.schema?.context === SCHEMA_ORG_CONTEXT && !getType(spec.schema.type),
				`${slug}: no longer drifted — remove it from KNOWN_CONTEXT_DRIFT`
			).toBe(true);
		}
	});

	it('resolves schema.org-backed fields through inherited schema.org properties', () => {
		const issues: string[] = [];

		for (const spec of CLASSIFICATION_SPECS) {
			if (spec.schema?.context !== SCHEMA_ORG_CONTEXT || KNOWN_CONTEXT_DRIFT.has(spec.slug)) {
				continue;
			}

			const schemaPropertyNames = new Set(
				getPropertiesFor(spec.schema.type).map((property) => property.name)
			);

			for (const field of spec.fields) {
				// Fields without a schemaProperty are Intuition extension
				// fields (e.g. Podcasting 2.0 GUIDs, purl coordinates) and
				// carry no schema.org provenance.
				if (!field.schemaProperty) {
					continue;
				}

				if (!schemaPropertyNames.has(field.schemaProperty)) {
					issues.push(
						`${spec.slug}.${field.key}: unknown schema.org property "${field.schemaProperty}" for ${spec.schema.type}`
					);
				}
			}
		}

		expect(issues).toEqual([]);
	});

	it('keeps schema.org provenance intact for Book fields', () => {
		const properties = getPropertiesFor('Book');
		const name = properties.find((property) => property.name === 'name');
		const isbn = properties.find((property) => property.name === 'isbn');

		expect(name?.originType).toBe('Thing');
		expect(isbn?.originType).toBe('Book');
	});
});
