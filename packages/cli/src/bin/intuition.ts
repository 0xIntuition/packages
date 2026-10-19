import { runCli } from '../cli/runtime';

process.exitCode = await runCli(process.argv.slice(2));
