#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync as fsReadFileSync, writeFileSync as fsWriteFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';

const EXPECTED_PACKAGE = '@0xintuition/contracts-v2';
const EXPECTED_VERSION = '1.1.0-alpha.0';
const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const protocolRoot = resolve(repoRoot, 'packages/protocol');
const artifactPaths = ['dist/abis/index.js', 'dist/bytecodes/index.js'];

// One I/O seam for hermetic tests, including supplied modules and registry input.
export async function syncProtocolArtifacts({
	args = process.argv.slice(2),
	env = process.env,
	readFileSync = fsReadFileSync,
	writeFileSync = fsWriteFileSync,
	loadArtifact = (path) => import(pathToFileURL(path).href),
	fetch = globalThis.fetch,
	readTarball: tarballReader = readTarball,
	now = () => new Date(),
	log = (message) => console.log(message),
} = {}) {
	const checkOnly = args.includes('--check');
	const verifyRegistry = args.includes('--verify-registry');
	const acceptIntegrityChange = args.includes('--accept-integrity-change');
	const sourceArgument = args.find((argument) => argument.startsWith('--source='));
	const suppliedSource =
		sourceArgument?.slice('--source='.length) ?? env.INTUITION_CONTRACTS_V2_ROOT;
	const source = suppliedSource === undefined ? 'registry' : 'supplied';
	const integrityArgument = args.find((argument) => argument.startsWith('--integrity='));
	const suppliedIntegrity = integrityArgument?.slice('--integrity='.length) ?? null;
	if (suppliedIntegrity !== null && !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(suppliedIntegrity)) {
		throw new Error('Supplied integrity must be a sha512- base64 value');
	}
	if (verifyRegistry && source !== 'registry') {
		throw new Error('--verify-registry requires the registry source');
	}
	if (acceptIntegrityChange)
		log('Using --accept-integrity-change (explicit integrity change acceptance).');
	const sourceRoot = resolve(
		suppliedSource ?? resolve(repoRoot, 'node_modules/@0xintuition/contracts-v2')
	);
	const sourceManifest = JSON.parse(readFileSync(resolve(sourceRoot, 'package.json'), 'utf8'));
	if (
		sourceManifest.name !== EXPECTED_PACKAGE ||
		typeof sourceManifest.version !== 'string' ||
		(source === 'registry' && sourceManifest.version !== EXPECTED_VERSION)
	) {
		throw new Error(
			`Expected ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}, found ${sourceManifest.name}@${sourceManifest.version}`
		);
	}

	const provenancePath = resolve(protocolRoot, 'src/contracts/contracts-v2-provenance.ts');
	const committed = readCommittedProvenance(provenancePath, readFileSync);
	if (checkOnly && (source === 'supplied' || committed?.source === 'supplied')) {
		throw new Error('Committed protocol provenance must describe the registry artifact');
	}
	const locked = source === 'registry' ? lockedResolution(readFileSync) : null;
	const integrity = locked?.integrity ?? suppliedIntegrity;
	if (
		source === 'registry' &&
		committed?.version === EXPECTED_VERSION &&
		committed.integrity !== integrity &&
		!acceptIntegrityChange
	) {
		throw new Error(
			`Integrity changed for ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}; pass --accept-integrity-change to accept it explicitly.`
		);
	}

	if (verifyRegistry) {
		const url = registryTarballUrl(locked.url);
		let archive;
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			archive = Buffer.from(await response.arrayBuffer());
		} catch (error) {
			throw new Error(`Registry verification fetch failed for ${url}: ${error.message}`, {
				cause: error,
			});
		}
		if (`sha512-${createHash('sha512').update(archive).digest('base64')}` !== integrity) {
			throw new Error(
				`Registry tarball SHA-512 mismatch for ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}`
			);
		}
		let entries;
		try {
			entries = await tarballReader(archive);
		} catch (error) {
			throw new Error(`Registry tarball could not be read: ${error.message}`, { cause: error });
		}
		// The installed entry modules re-export bundled chunks. Bind every local
		// static import as well, so unchanged wrappers cannot verify a mutated ABI.
		const modulePaths = new Set(artifactPaths);
		for (const path of modulePaths) {
			const published = entries.get(`package/${path}`);
			if (!published || !Buffer.from(published).equals(readFileSync(resolve(sourceRoot, path)))) {
				throw new Error(`Registry artifact mismatch: ${path}`);
			}
			for (const match of Buffer.from(published)
				.toString('utf8')
				.matchAll(
					/^\s*(?:import|export)\s+(?:\{[^}]*\}\s+from\s*|[^'"\n]*?\s+from\s*)?['"]([^'"]+)['"]/gm
				)) {
				const dependency = posix.normalize(posix.join(posix.dirname(path), match[1]));
				if (
					!match[1].startsWith('.') ||
					!dependency.startsWith('dist/') ||
					!dependency.endsWith('.js')
				) {
					throw new Error(`Unsupported registry artifact import in ${path}: ${match[1]}`);
				}
				modulePaths.add(dependency);
			}
		}
		log(
			`Verified registry tarball SHA-512 and installed ABI/bytecode modules for ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}.`
		);
	}

	const abiModule = await loadArtifact(resolve(sourceRoot, artifactPaths[0]));
	const bytecodeModule = await loadArtifact(resolve(sourceRoot, artifactPaths[1]));
	const artifacts = {
		'MultiVault-abi.ts': renderAbi('MultiVaultAbi', abiModule.MultiVaultAbi),
		'MultiVault-bytecode.ts': renderBytecode(
			'MultiVaultBytecode',
			bytecodeModule.MultiVaultBytecode
		),
		'MultiVaultMigrationMode-abi.ts': renderAbi(
			'MultiVaultMigrationModeAbi',
			abiModule.MultiVaultMigrationModeAbi
		),
		'MultiVaultMigrationMode-bytecode.ts': renderBytecode(
			'MultiVaultMigrationModeBytecode',
			bytecodeModule.MultiVaultMigrationModeBytecode
		),
	};
	// Check never changes an existing verification timestamp. Offline check can
	// validate a previously verified record without performing a network request;
	// ordinary offline sync always emits verified:false and no verifiedAt.
	const verified = verifyRegistry || (checkOnly && committed?.verified === true);
	const verifiedAt = verified
		? checkOnly && committed?.verified === true
			? committed.verifiedAt
			: now().toISOString()
		: undefined;
	if (
		verified &&
		(typeof verifiedAt !== 'string' || new Date(verifiedAt).toISOString() !== verifiedAt)
	) {
		throw new Error('Committed verified provenance must have an ISO verifiedAt date');
	}
	const provenance = {
		package: EXPECTED_PACKAGE,
		version: sourceManifest.version,
		source,
		integrity,
		verified,
		...(verified ? { verifiedAt } : {}),
		abiFingerprint: sha256(abiModule.MultiVaultAbi),
		migrationModeAbiFingerprint: sha256(abiModule.MultiVaultMigrationModeAbi),
		bytecodeFingerprint: sha256(bytecodeModule.MultiVaultBytecode),
		migrationModeBytecodeFingerprint: sha256(bytecodeModule.MultiVaultMigrationModeBytecode),
	};
	artifacts['contracts-v2-provenance.ts'] =
		`/** Generated by scripts/sync-protocol-artifacts.mjs. */\n` +
		`export const contractsV2Provenance = ${JSON.stringify(provenance, null, '\t')} as const;\n`;

	const formattedArtifacts = Object.entries(artifacts).map(([filename, content]) => {
		const destination =
			filename === 'contracts-v2-provenance.ts'
				? resolve(protocolRoot, 'src/contracts', filename)
				: resolve(
						repoRoot,
						'packages/deployments/src',
						filename.endsWith('-abi.ts') ? 'abis' : 'bytecode',
						filename
					);
		return { filename, destination, content: formatTypeScript(content, destination) };
	});
	// Preflight every ABI/bytecode before writing anything. Artifact changes need
	// a separate ruling; sync may only update provenance in this lane.
	const changedArtifacts = formattedArtifacts.filter(
		({ filename, destination, content }) =>
			filename !== 'contracts-v2-provenance.ts' &&
			artifactLiteral(readFileSync(destination, 'utf8')) !== artifactLiteral(content)
	);
	if (changedArtifacts.length > 0) {
		throw new Error(
			`Generated ABI/bytecode would change: ${changedArtifacts.map(({ filename }) => filename).join(', ')}`
		);
	}
	for (const { filename, destination, content } of formattedArtifacts) {
		if (filename !== 'contracts-v2-provenance.ts') {
			log(`byte-identical packages/deployments/src/${filename}`);
		} else if (checkOnly) {
			if (readFileSync(destination, 'utf8') !== content) {
				throw new Error(`Protocol artifacts are stale: ${filename}`);
			}
		} else {
			writeFileSync(destination, content);
			log(`wrote packages/protocol/src/contracts/${filename}`);
		}
	}
	if (checkOnly) log(`Protocol artifacts match ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}.`);
}

function readCommittedProvenance(path, readFileSync) {
	let content;
	try {
		content = readFileSync(path, 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') return null;
		throw error;
	}
	// Read generated literals without executing the committed TypeScript.
	const literal = (name) => content.match(new RegExp(`\\b${name}:\\s*['"]([^'"]*)['"]`))?.[1];
	return {
		version: literal('version'),
		source: literal('source'),
		integrity: literal('integrity') ?? null,
		verified: /\bverified:\s*true\b/.test(content),
		verifiedAt: literal('verifiedAt'),
	};
}

function lockedResolution(readFileSync) {
	const resolution = `${EXPECTED_PACKAGE}@${EXPECTED_VERSION}`;
	// Bun's text lockfile has trailing commas; each registry tuple is JSON.
	const lockfile = readFileSync(resolve(repoRoot, 'bun.lock'), 'utf8');
	for (const line of lockfile.split('\n')) {
		const match = line.match(/^\s*"[^"]+":\s*(\[.*\]),?\s*$/);
		if (!match) continue;
		const entry = JSON.parse(match[1]);
		if (entry[0] !== resolution) continue;
		const integrity = entry.at(-1);
		if (typeof integrity !== 'string' || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(integrity)) {
			throw new Error(`Invalid lockfile integrity for ${resolution}`);
		}
		return { integrity, url: entry[1] };
	}
	throw new Error(`Missing lockfile integrity for ${resolution} in bun.lock`);
}

function registryTarballUrl(lockedUrl) {
	const url =
		lockedUrl ||
		`https://registry.npmjs.org/${EXPECTED_PACKAGE}/-/contracts-v2-${EXPECTED_VERSION}.tgz`;
	try {
		const parsed = new URL(url);
		if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Expected HTTP(S)');
	} catch {
		throw new Error(`Invalid registry tarball URL for ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}`);
	}
	return url;
}

// Read regular files from a gzipped tar in memory; never extract onto disk.
export function readTarball(archive) {
	const tar = gunzipSync(archive);
	const entries = new Map();
	for (let offset = 0; offset + 512 <= tar.length; ) {
		const header = tar.subarray(offset, offset + 512);
		if (header.every((byte) => byte === 0)) return entries;
		const text = (start, end) => header.subarray(start, end).toString('utf8').split('\0')[0];
		const sizeText = text(124, 136).trim();
		if (!/^[0-7]+$/.test(sizeText)) throw new Error('Invalid tar entry size');
		const size = Number.parseInt(sizeText, 8);
		const checksum = Number.parseInt(text(148, 156).trim(), 8);
		const actualChecksum = header.reduce(
			(sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte),
			0
		);
		if (checksum !== actualChecksum) throw new Error('Invalid tar header checksum');
		const start = offset + 512;
		const end = start + size;
		if (!Number.isSafeInteger(size) || end > tar.length) throw new Error('Truncated tar entry');
		const prefix = text(345, 500);
		const name = `${prefix ? `${prefix}/` : ''}${text(0, 100)}`;
		if (header[156] === 0 || header[156] === 48) {
			if (entries.has(name)) throw new Error(`Duplicate tar entry: ${name}`);
			entries.set(name, tar.subarray(start, end));
		}
		offset = start + Math.ceil(size / 512) * 512;
	}
	throw new Error('Truncated tar archive');
}

function renderAbi(name, abi) {
	return `/** Generated by scripts/sync-protocol-artifacts.mjs. */\nexport const ${name} = ${JSON.stringify(abi, null, '\t')} as const;\n`;
}

function renderBytecode(name, bytecode) {
	if (typeof bytecode !== 'string' || !bytecode.startsWith('0x')) {
		throw new Error(`${name} is not hex bytecode`);
	}
	return `/** Generated by scripts/sync-protocol-artifacts.mjs. */\nimport type { Hex } from 'viem';\n\nexport const ${name}: Hex = '${bytecode}';\n`;
}

function sha256(value) {
	return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function formatTypeScript(content, destination) {
	const result = spawnSync(
		resolve(repoRoot, 'node_modules/.bin/biome'),
		['format', '--stdin-file-path', destination],
		{ input: content, encoding: 'utf8' }
	);
	if (result.status !== 0) {
		throw new Error(`Biome could not format ${destination}: ${result.stderr}`);
	}
	return result.stdout;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await syncProtocolArtifacts();
}

function artifactLiteral(content) {
	// Formatting and generator comments are not artifact differences. Keep all
	// literal contents and declarations intact; never execute candidate source.
	const normalized = content.replace(/^\/\*\*[\s\S]*?\*\/\s*/, '');
	try {
		return formatTypeScript(normalized, 'artifact.ts').trim();
	} catch {
		return normalized;
	}
}
