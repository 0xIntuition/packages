import { describe, expect, it } from 'vitest';
import { assertArtifactFingerprints, fingerprint } from './check-candidate-artifacts';

describe('candidate artifact drift guard', () => {
	const artifacts = {
		ExampleAbi: [{ type: 'function', name: 'preview', inputs: [] }],
		ExampleBytecode: '0x1234',
	};
	const expected = Object.fromEntries(
		Object.entries(artifacts).map(([name, value]) => [name, fingerprint(value)])
	);
	it('accepts the recorded values', () =>
		expect(() => assertArtifactFingerprints(artifacts, expected)).not.toThrow());
	it('rejects ABI or bytecode drift', () => {
		expect(() => assertArtifactFingerprints({ ...artifacts, ExampleAbi: [] }, expected)).toThrow();
		expect(() =>
			assertArtifactFingerprints({ ...artifacts, ExampleBytecode: '0x1235' }, expected)
		).toThrow();
	});
	it('rejects added or removed exports', () => {
		expect(() => assertArtifactFingerprints({ ...artifacts, AddedAbi: [] }, expected)).toThrow();
		expect(() =>
			assertArtifactFingerprints({ ExampleAbi: artifacts.ExampleAbi }, expected)
		).toThrow();
	});
});
