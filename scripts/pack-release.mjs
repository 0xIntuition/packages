#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const outputJson = args.has('--json');
const distEntrypoints = args.has('--dist-entrypoints');
const rewriteWorkspaceDeps = args.has('--rewrite-workspace-deps');
const packageRoot = process.cwd();
const repoRoot = resolve(packageRoot, '..', '..');
const packageJsonPath = resolve(packageRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const stageRoot = mkdtempSync(join(tmpdir(), 'intuition-release-pack-'));
const stagePackageRoot = resolve(stageRoot, 'package');
const npmCacheRoot = process.env.NPM_CONFIG_CACHE ?? resolve(stageRoot, '.npm-cache');
const licenseFileNames = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
let workspacePackageVersions;

function normalizePackageRelativePath(packagePath) {
	if (typeof packagePath !== 'string' || packagePath.length === 0) {
		return null;
	}

	const relativePath = packagePath.startsWith('./') ? packagePath.slice(2) : packagePath;
	const pathSegments = relativePath.split(/[\\/]/);

	if (relativePath.startsWith('/') || pathSegments.includes('..') || relativePath.length === 0) {
		throw new Error(`Unsupported package entrypoint path "${packagePath}".`);
	}

	return relativePath;
}

function addPackageEntrypoint(entrypoints, packagePath) {
	const relativePath = normalizePackageRelativePath(packagePath);

	if (relativePath) {
		entrypoints.add(relativePath);
	}
}

function addExportEntrypoints(entrypoints, exportTarget) {
	if (typeof exportTarget === 'string') {
		addPackageEntrypoint(entrypoints, exportTarget);
		return;
	}

	if (Array.isArray(exportTarget)) {
		for (const nestedTarget of exportTarget) {
			addExportEntrypoints(entrypoints, nestedTarget);
		}
		return;
	}

	if (exportTarget && typeof exportTarget === 'object') {
		for (const nestedTarget of Object.values(exportTarget)) {
			addExportEntrypoints(entrypoints, nestedTarget);
		}
	}
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function walkPackageRelativeFiles(directory = packageRoot, baseDirectory = packageRoot) {
	const files = [];

	for (const entry of readdirSync(directory)) {
		const entryPath = resolve(directory, entry);
		const relativePath = entryPath.slice(baseDirectory.length + 1).replace(/\\/g, '/');

		if (statSync(entryPath).isDirectory()) {
			if (!['.cache', '.git', '.turbo', 'node_modules'].includes(entry)) {
				files.push(...walkPackageRelativeFiles(entryPath, baseDirectory));
			}
			continue;
		}

		files.push(relativePath);
	}

	return files;
}

function patternToRegExp(relativePattern) {
	const pattern = relativePattern.split('*').map(escapeRegExp).join('.*');
	return new RegExp(`^${pattern}$`);
}

function packageEntrypointExists(relativePath) {
	if (!relativePath.includes('*')) {
		return existsSync(resolve(packageRoot, relativePath));
	}

	const pattern = patternToRegExp(relativePath);
	return walkPackageRelativeFiles().some((candidatePath) => pattern.test(candidatePath));
}

function collectPackageEntrypoints(stagedPackageJson) {
	const entrypoints = new Set();

	addPackageEntrypoint(entrypoints, stagedPackageJson.main);
	addPackageEntrypoint(entrypoints, stagedPackageJson.types);
	addPackageEntrypoint(entrypoints, stagedPackageJson.typings);

	if (typeof stagedPackageJson.bin === 'string') {
		addPackageEntrypoint(entrypoints, stagedPackageJson.bin);
	} else if (stagedPackageJson.bin && typeof stagedPackageJson.bin === 'object') {
		for (const binTarget of Object.values(stagedPackageJson.bin)) {
			addPackageEntrypoint(entrypoints, binTarget);
		}
	}

	addExportEntrypoints(entrypoints, stagedPackageJson.exports);

	return [...entrypoints].sort();
}

function requirePackageEntrypoints(stagedPackageJson) {
	const missingEntrypoints = collectPackageEntrypoints(stagedPackageJson).filter(
		(relativePath) => !packageEntrypointExists(relativePath)
	);

	if (missingEntrypoints.length > 0) {
		throw new Error(
			`Missing required release artifact(s): ${missingEntrypoints
				.map((entrypoint) => `"${entrypoint}"`)
				.join(', ')}. Run the package build first.`
		);
	}
}

function copyEntry(relativePath) {
	const sourcePath = resolve(packageRoot, relativePath);
	if (!existsSync(sourcePath)) {
		return;
	}

	const targetPath = resolve(stagePackageRoot, relativePath);
	mkdirSync(dirname(targetPath), { recursive: true });
	cpSync(sourcePath, targetPath, { force: true, recursive: true });
}

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function isPackageJsonEntrypoint(packagePath) {
	return normalizePackageRelativePath(packagePath) === 'package.json';
}

function mapEntrypointToDist(packagePath, extension) {
	const relativePath = normalizePackageRelativePath(packagePath);

	if (!relativePath || relativePath === 'package.json') {
		return packagePath;
	}

	const entrypointPath = relativePath.startsWith('src/')
		? relativePath.slice('src/'.length)
		: relativePath.startsWith('dist/')
			? relativePath.slice('dist/'.length)
			: relativePath;
	const withoutExtension = entrypointPath.replace(/\.d\.ts$/, '').replace(/\.[cm]?[tj]sx?$/, '');

	return `./dist/${withoutExtension}${extension}`;
}

function isTypesCondition(conditionName) {
	return conditionName === 'types' || conditionName === 'typings';
}

function mapExportConditionToDist(exportTarget, conditionName) {
	if (typeof exportTarget === 'string') {
		if (isPackageJsonEntrypoint(exportTarget)) {
			return exportTarget;
		}

		return mapEntrypointToDist(exportTarget, isTypesCondition(conditionName) ? '.d.ts' : '.js');
	}

	if (Array.isArray(exportTarget)) {
		return exportTarget.map((nestedTarget) =>
			mapExportConditionToDist(nestedTarget, conditionName)
		);
	}

	if (exportTarget && typeof exportTarget === 'object') {
		return Object.fromEntries(
			Object.entries(exportTarget).map(([nestedConditionName, nestedTarget]) => [
				nestedConditionName,
				mapExportConditionToDist(nestedTarget, nestedConditionName),
			])
		);
	}

	return exportTarget;
}

function mapSubpathExportToDist(exportTarget) {
	if (typeof exportTarget === 'string') {
		if (isPackageJsonEntrypoint(exportTarget)) {
			return exportTarget;
		}

		return {
			types: mapEntrypointToDist(exportTarget, '.d.ts'),
			import: mapEntrypointToDist(exportTarget, '.js'),
		};
	}

	return mapExportConditionToDist(exportTarget);
}

function mapExportsToDist(exportsField) {
	if (typeof exportsField === 'string') {
		return mapSubpathExportToDist(exportsField);
	}

	if (!exportsField || typeof exportsField !== 'object' || Array.isArray(exportsField)) {
		return exportsField;
	}

	const hasSubpathExports = Object.keys(exportsField).some((exportKey) =>
		exportKey.startsWith('.')
	);

	if (!hasSubpathExports) {
		return mapExportConditionToDist(exportsField);
	}

	return Object.fromEntries(
		Object.entries(exportsField).map(([exportPath, exportTarget]) => [
			exportPath,
			exportPath === './package.json' ? exportTarget : mapSubpathExportToDist(exportTarget),
		])
	);
}

function loadWorkspacePackageVersions() {
	if (workspacePackageVersions) {
		return workspacePackageVersions;
	}

	workspacePackageVersions = new Map();

	const rootPackageJson = readJson(resolve(repoRoot, 'package.json'));
	for (const pattern of rootPackageJson.workspaces ?? []) {
		if (typeof pattern !== 'string' || !pattern.endsWith('/*')) {
			continue;
		}

		const workspaceRoot = resolve(repoRoot, pattern.slice(0, -2));
		if (!existsSync(workspaceRoot)) {
			continue;
		}

		for (const entry of readdirSync(workspaceRoot)) {
			const candidateRoot = resolve(workspaceRoot, entry);
			if (!statSync(candidateRoot).isDirectory()) {
				continue;
			}

			const candidatePackageJsonPath = resolve(candidateRoot, 'package.json');
			if (!existsSync(candidatePackageJsonPath)) {
				continue;
			}

			const candidatePackageJson = readJson(candidatePackageJsonPath);
			if (
				typeof candidatePackageJson.name === 'string' &&
				typeof candidatePackageJson.version === 'string'
			) {
				workspacePackageVersions.set(candidatePackageJson.name, candidatePackageJson.version);
			}
		}
	}

	return workspacePackageVersions;
}

function rewriteWorkspaceDependencySpecs(stagedPackageJson) {
	for (const fieldName of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
		const dependencies = stagedPackageJson[fieldName];
		if (!dependencies || typeof dependencies !== 'object') {
			continue;
		}

		for (const [dependencyName, versionRange] of Object.entries(dependencies)) {
			if (typeof versionRange !== 'string' || !versionRange.startsWith('workspace:')) {
				continue;
			}

			const workspaceVersion = loadWorkspacePackageVersions().get(dependencyName);
			if (!workspaceVersion) {
				throw new Error(
					`Cannot rewrite ${fieldName}.${dependencyName}: workspace package version not found.`
				);
			}

			dependencies[dependencyName] = workspaceVersion;
		}
	}
}

function createStagedPackageJson() {
	const stagedPackageJson = { ...packageJson };

	if (distEntrypoints) {
		stagedPackageJson.main = './dist/index.js';
		stagedPackageJson.types = './dist/index.d.ts';
		stagedPackageJson.files = ['dist', 'README.md'];
		stagedPackageJson.exports = mapExportsToDist(packageJson.exports);
	}

	if (rewriteWorkspaceDeps) {
		rewriteWorkspaceDependencySpecs(stagedPackageJson);
	}

	delete stagedPackageJson.devDependencies;

	if (stagedPackageJson.scripts) {
		stagedPackageJson.scripts = Object.fromEntries(
			Object.entries(stagedPackageJson.scripts).filter(
				([name]) => !['pack:release', 'pack:dry-run', 'prepublishOnly'].includes(name)
			)
		);

		if (Object.keys(stagedPackageJson.scripts).length === 0) {
			delete stagedPackageJson.scripts;
		}
	}

	return stagedPackageJson;
}

function stagePackageJson(stagedPackageJson) {
	writeFileSync(
		resolve(stagePackageRoot, 'package.json'),
		`${JSON.stringify(stagedPackageJson, null, 2)}\n`
	);
}

function stageLicenseFallback() {
	const stagedLicenseExists = licenseFileNames.some((licenseFile) =>
		existsSync(resolve(stagePackageRoot, licenseFile))
	);

	if (stagedLicenseExists) {
		return;
	}

	for (const licenseFile of licenseFileNames) {
		const rootLicensePath = resolve(repoRoot, licenseFile);
		if (existsSync(rootLicensePath)) {
			cpSync(rootLicensePath, resolve(stagePackageRoot, licenseFile), { force: true });
			return;
		}
	}
}

try {
	mkdirSync(stagePackageRoot, { recursive: true });

	const stagedPackageJson = createStagedPackageJson();
	requirePackageEntrypoints(stagedPackageJson);

	const stageEntries = new Set(stagedPackageJson.files ?? packageJson.files ?? []);
	stageEntries.add('README.md');

	for (const licenseFile of licenseFileNames) {
		if (existsSync(resolve(packageRoot, licenseFile))) {
			stageEntries.add(licenseFile);
		}
	}

	for (const entry of stageEntries) {
		copyEntry(entry);
	}

	stageLicenseFallback();
	stagePackageJson(stagedPackageJson);

	const rawManifest = execFileSync(
		'npm',
		['pack', '--ignore-scripts', '--json', ...(dryRun ? ['--dry-run'] : [])],
		{
			cwd: stagePackageRoot,
			encoding: 'utf8',
			env: {
				...process.env,
				NPM_CONFIG_CACHE: npmCacheRoot,
			},
		}
	);

	if (dryRun) {
		writeFileSync(1, rawManifest);
		process.exit(0);
	}

	const manifest = JSON.parse(rawManifest);
	const tarballName = manifest[0]?.filename;

	if (!tarballName) {
		throw new Error('npm pack did not return a tarball filename.');
	}

	const stagedTarballPath = resolve(stagePackageRoot, tarballName);
	const targetTarballPath = resolve(packageRoot, tarballName);

	rmSync(targetTarballPath, { force: true });
	cpSync(stagedTarballPath, targetTarballPath, { force: true });

	if (outputJson) {
		writeFileSync(
			1,
			`${JSON.stringify([{ ...manifest[0], tarballPath: targetTarballPath }], null, 2)}\n`
		);
		process.exit(0);
	}

	process.stdout.write(`${targetTarballPath}\n`);
} finally {
	rmSync(stageRoot, { force: true, recursive: true });
}
