import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const bunExecutable = process.versions.bun ? process.execPath : 'bun';

describe('encoder help runtime', () => {
	it('prints the summary catalog without runtime import errors', () => {
		const output = execFileSync(bunExecutable, ['run', 'help:encoders', '--', '--summary'], {
			cwd: packageRoot,
			encoding: 'utf8',
		});

		expect(output).toContain('Core encoder catalog');
		expect(output).toContain('Periphery encoder catalog');
	});
});
