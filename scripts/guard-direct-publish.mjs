#!/usr/bin/env node

console.error(
	'Direct npm publish from workspace package roots is disabled. Use the staged release tarball flow (`bun run pack:release`) after formal team review.'
);

process.exit(1);
