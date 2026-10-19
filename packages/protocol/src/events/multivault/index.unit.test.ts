import { describe, expect, it } from 'vitest';

import {
	associateAtomCreationContext,
	eventParseAtomContextRegistered,
	eventParseAtomUriConfigUpdated,
} from './index.js';

describe('events/multivault URI exports', () => {
	it.each([
		['eventParseAtomContextRegistered', eventParseAtomContextRegistered],
		['eventParseAtomUriConfigUpdated', eventParseAtomUriConfigUpdated],
		['associateAtomCreationContext', associateAtomCreationContext],
	] as const)('exports %s', (_name, helper) => {
		expect(helper).toBeTypeOf('function');
	});
});
