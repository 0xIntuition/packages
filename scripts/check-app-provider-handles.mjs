#!/usr/bin/env bun
/** Run the app's original test bodies against built dist, without writing to the app. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const app = resolve(process.argv[2] ?? process.cwd());
const repo = fileURLToPath(new URL('..', import.meta.url));
const dist = pathToFileURL(join(repo, 'packages/iid-ladder/dist/index.js')).href;
const source = readFileSync(
	join(app, 'packages/provider-handles/tests/provider-handles.test.ts'),
	'utf8'
);
const scratch = mkdtempSync(join(tmpdir(), 'provider-handles-dist-'));
try {
	const test = source
		.replace("from '@0xintuition/iid-ladder'", `from '${dist}'`)
		.replace(
			"import { iidForIdentityRung, projectIdentifierLadder } from '../src/index';",
			`import { createLadder } from '${dist}';\nconst { iidForIdentityRung, projectIdentifierLadder } = createLadder({ providerLocalHandles: 'mint' });`
		);
	if (test === source || test.includes("from '../src/index'"))
		throw new Error('App test import layout changed');
	const file = join(scratch, 'provider-handles.test.ts');
	writeFileSync(file, test);
	execFileSync('bun', ['test', file], { cwd: app, stdio: 'inherit' });
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
