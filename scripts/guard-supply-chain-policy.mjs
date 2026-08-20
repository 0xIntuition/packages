#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), '..');
const minReleaseAgeSeconds = 1_209_600;
const exceptionPolicyPath = path.join(repoRoot, 'supply-chain-exceptions.json');
const failures = [];

const dependencySections = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
	'catalog',
	'overrides',
	'resolutions',
];

const ignoredDirectories = new Set([
	'.git',
	'.next',
	'.turbo',
	'.vercel',
	'build',
	'coverage',
	'dist',
	'node_modules',
	'out',
	'target',
]);

const incidentIocs = [
	'router_init.js',
	'router_runtime.js',
	'tanstack_runner.js',
	'@tanstack/setup',
	'79ac49eedf774dd4b0cfa308722bc463cfe5885c',
	'ab4fcadaec49c03278063dd269ea5eef82d24f2124a8e15d7b90f2fa8601266c',
	'filev2.getsession',
	'seed1.getsession',
	'seed2.getsession',
	'seed3.getsession',
	'litter.catbox.moe',
	'zblgg',
	'voicproducoes',
];

const dependencyGitPattern =
	/^(?:git(?:\+ssh|\+https)?:|github:|https:\/\/github\.com\/|git:\/\/|ssh:\/\/git@)/i;
const pagesWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'deploy-schema.yml');

const toRelativePath = (filePath) => path.relative(repoRoot, filePath) || '.';

const addFailure = (filePath, message) => {
	failures.push(`${toRelativePath(filePath)}: ${message}`);
};

const readTextFile = (filePath) => fs.readFileSync(filePath, 'utf8');

let cachedExceptionPolicy;

const readExceptionPolicy = () => {
	if (cachedExceptionPolicy) {
		return cachedExceptionPolicy;
	}

	if (!fs.existsSync(exceptionPolicyPath)) {
		cachedExceptionPolicy = { schemaVersion: 1, minimumReleaseAge: [] };
		return cachedExceptionPolicy;
	}

	try {
		cachedExceptionPolicy = JSON.parse(readTextFile(exceptionPolicyPath));
	} catch {
		addFailure(exceptionPolicyPath, 'must contain valid JSON');
		cachedExceptionPolicy = { schemaVersion: 1, minimumReleaseAge: [] };
	}

	return cachedExceptionPolicy;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listFiles = (startPath, predicate) => {
	if (!fs.existsSync(startPath)) {
		return [];
	}

	const entries = fs.readdirSync(startPath, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(startPath, entry.name);

		if (entry.isDirectory()) {
			if (!ignoredDirectories.has(entry.name)) {
				files.push(...listFiles(entryPath, predicate));
			}
			continue;
		}

		if (entry.isFile() && predicate(entryPath)) {
			files.push(entryPath);
		}
	}

	return files;
};

const packageJsonFiles = listFiles(
	repoRoot,
	(filePath) => path.basename(filePath) === 'package.json'
);

const checkBunPolicy = () => {
	const bunfigPath = path.join(repoRoot, 'bunfig.toml');

	if (!fs.existsSync(bunfigPath)) {
		addFailure(bunfigPath, 'missing Bun install policy file');
		return;
	}

	const bunfig = readTextFile(bunfigPath);
	const ageMatch = bunfig.match(/^\s*minimumReleaseAge\s*=\s*(\d+)/m);

	if (!ageMatch) {
		addFailure(bunfigPath, 'missing minimumReleaseAge');
	} else if (Number(ageMatch[1]) < minReleaseAgeSeconds) {
		addFailure(bunfigPath, `minimumReleaseAge must be at least ${minReleaseAgeSeconds} seconds`);
	}

	const excludesMatch = bunfig.match(/^\s*minimumReleaseAgeExcludes\s*=\s*(\[[^\]]*\])/m);
	let configuredExcludes = [];
	if (excludesMatch) {
		try {
			configuredExcludes = JSON.parse(excludesMatch[1]);
		} catch {
			addFailure(bunfigPath, 'minimumReleaseAgeExcludes must be a single-line string array');
		}
	}

	if (!fs.existsSync(exceptionPolicyPath)) {
		if (configuredExcludes.length > 0) {
			addFailure(exceptionPolicyPath, 'missing exception manifest for minimumReleaseAgeExcludes');
		}
		return;
	}

	const policy = readExceptionPolicy();

	if (policy.schemaVersion !== 1 || !Array.isArray(policy.minimumReleaseAge)) {
		addFailure(exceptionPolicyPath, 'must use schemaVersion 1 with a minimumReleaseAge array');
		return;
	}

	const approvedNames = policy.minimumReleaseAge.map((entry) => entry.package);
	if (new Set(configuredExcludes).size !== configuredExcludes.length) {
		addFailure(bunfigPath, 'minimumReleaseAgeExcludes contains duplicate package names');
	}
	if (new Set(approvedNames).size !== approvedNames.length) {
		addFailure(exceptionPolicyPath, 'contains duplicate package exceptions');
	}
	if (
		configuredExcludes.length !== approvedNames.length ||
		configuredExcludes.some((name) => !approvedNames.includes(name))
	) {
		addFailure(
			bunfigPath,
			'minimumReleaseAgeExcludes must exactly match supply-chain-exceptions.json'
		);
	}

	for (const entry of policy.minimumReleaseAge) {
		if (
			typeof entry.package !== 'string' ||
			typeof entry.version !== 'string' ||
			!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(entry.version) ||
			typeof entry.integrity !== 'string' ||
			!entry.integrity.startsWith('sha512-') ||
			Number.isNaN(Date.parse(entry.publishedAt)) ||
			Number.isNaN(Date.parse(entry.removeAfter)) ||
			typeof entry.reason !== 'string' ||
			entry.reason.trim().length === 0
		) {
			addFailure(exceptionPolicyPath, `invalid exception record for ${entry.package ?? 'unknown'}`);
			continue;
		}

		const expectedRemoval = Date.parse(entry.publishedAt) + minReleaseAgeSeconds * 1_000;
		if (Date.parse(entry.removeAfter) !== expectedRemoval) {
			addFailure(
				exceptionPolicyPath,
				`${entry.package}@${entry.version} removeAfter must equal publishedAt + minimumReleaseAge`
			);
		}
		if (Date.now() >= Date.parse(entry.removeAfter)) {
			addFailure(
				exceptionPolicyPath,
				`${entry.package}@${entry.version} is now old enough; remove its release-age exception`
			);
		}
	}
};

const checkRootInstallPolicy = () => {
	const rootPackagePath = path.join(repoRoot, 'package.json');
	const nvmrcPath = path.join(repoRoot, '.nvmrc');

	if (!fs.existsSync(nvmrcPath) || readTextFile(nvmrcPath).trim().length === 0) {
		addFailure(nvmrcPath, 'missing non-empty Node version pin');
	}

	for (const lockfile of ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']) {
		const lockfilePath = path.join(repoRoot, lockfile);
		if (fs.existsSync(lockfilePath)) {
			addFailure(lockfilePath, 'alternate package-manager lockfile is not allowed');
		}
	}

	const packageJson = JSON.parse(readTextFile(rootPackagePath));
	const exceptionPolicy = readExceptionPolicy();

	if (!packageJson.packageManager?.startsWith('bun@')) {
		addFailure(rootPackagePath, 'packageManager must pin Bun');
	}

	if (packageJson.scripts?.preinstall !== 'node scripts/enforce-bun-install.mjs') {
		addFailure(rootPackagePath, 'preinstall must enforce Bun-only installs');
	}

	if (!fs.existsSync(path.join(repoRoot, 'scripts/enforce-bun-install.mjs'))) {
		addFailure(rootPackagePath, 'missing scripts/enforce-bun-install.mjs');
	}

	for (const entry of exceptionPolicy.minimumReleaseAge ?? []) {
		if (packageJson.devDependencies?.[entry.package] !== entry.version) {
			addFailure(
				rootPackagePath,
				`devDependencies.${entry.package} must pin approved exception version ${entry.version}`
			);
		}
	}
};

const getDependencyEntries = (manifest, sectionName) => {
	const section = manifest[sectionName];

	if (!section || typeof section !== 'object' || Array.isArray(section)) {
		return [];
	}

	return Object.entries(section).flatMap(([name, value]) => {
		if (typeof value === 'string') {
			return [[name, value]];
		}

		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return Object.entries(value)
				.filter(([, nestedValue]) => typeof nestedValue === 'string')
				.map(([nestedName, nestedValue]) => [`${name}.${nestedName}`, nestedValue]);
		}

		return [];
	});
};

const checkPackageManifests = () => {
	const exceptionPolicy = readExceptionPolicy();
	const approvedVersions = new Map(
		(exceptionPolicy.minimumReleaseAge ?? []).map((entry) => [entry.package, entry.version])
	);
	const seenApprovedDependencies = new Set();

	for (const packagePath of packageJsonFiles) {
		const manifest = JSON.parse(readTextFile(packagePath));

		if ('trustedDependencies' in manifest) {
			addFailure(packagePath, 'trustedDependencies requires explicit review');
		}

		for (const sectionName of dependencySections) {
			for (const [name, version] of getDependencyEntries(manifest, sectionName)) {
				if (approvedVersions.has(name)) {
					seenApprovedDependencies.add(name);
					if (version !== approvedVersions.get(name)) {
						addFailure(
							packagePath,
							`${sectionName}.${name} must equal approved exception version ${approvedVersions.get(name)}`
						);
					}
				}
				if (dependencyGitPattern.test(version)) {
					addFailure(packagePath, `${sectionName}.${name} uses a Git dependency (${version})`);
				}
			}
		}
	}

	for (const packageName of approvedVersions.keys()) {
		if (!seenApprovedDependencies.has(packageName)) {
			addFailure(exceptionPolicyPath, `${packageName} exception has no exact manifest dependency`);
		}
	}
};

const checkExceptionLockfile = () => {
	const lockfilePath = path.join(repoRoot, 'bun.lock');
	if (!fs.existsSync(lockfilePath)) {
		addFailure(lockfilePath, 'missing Bun lockfile');
		return;
	}

	const lockfile = readTextFile(lockfilePath);
	for (const entry of readExceptionPolicy().minimumReleaseAge ?? []) {
		const packageKey = `"${entry.package}"`;
		const resolution = `"${entry.package}@${entry.version}"`;
		if (!lockfile.includes(packageKey) || !lockfile.includes(resolution)) {
			addFailure(
				lockfilePath,
				`missing exact exception resolution ${entry.package}@${entry.version}`
			);
		}

		const tuplePattern = new RegExp(
			`${escapeRegExp(packageKey)}:\\s*\\[${escapeRegExp(resolution)}[\\s\\S]{0,4000}${escapeRegExp(`"${entry.integrity}"`)}\\]`
		);
		if (!tuplePattern.test(lockfile)) {
			addFailure(
				lockfilePath,
				`${entry.package}@${entry.version} lock entry must match approved registry integrity`
			);
		}
	}
};

const checkWorkflowPolicy = () => {
	const workflowFiles = listFiles(path.join(repoRoot, '.github', 'workflows'), (filePath) =>
		/\.ya?ml$/i.test(filePath)
	);
	const sharedSetupPath = path.join(repoRoot, 'tooling/github/setup/action.yml');
	const filesToCheck = fs.existsSync(sharedSetupPath)
		? [...workflowFiles, sharedSetupPath]
		: workflowFiles;

	for (const workflowPath of filesToCheck) {
		const workflow = readTextFile(workflowPath);
		const lines = workflow.split(/\r?\n/);

		if (/\bpull_request_target\b/.test(workflow)) {
			addFailure(workflowPath, 'pull_request_target is not allowed');
		}

		if (/^\s*id-token:\s*write\b/m.test(workflow) && workflowPath !== pagesWorkflowPath) {
			addFailure(workflowPath, 'id-token: write requires explicit publish-job review');
		}

		if (workflowPath === pagesWorkflowPath) {
			if (!/^\s*pages:\s*write\b/m.test(workflow)) {
				addFailure(workflowPath, 'schema Pages workflow must declare pages: write');
			}

			if (!/actions\/upload-pages-artifact@v3/.test(workflow)) {
				addFailure(workflowPath, 'schema Pages workflow must upload a Pages artifact');
			}

			if (!/path:\s*schema\b/.test(workflow)) {
				addFailure(workflowPath, 'schema Pages workflow must upload schema/ as artifact root');
			}

			if (!/actions\/deploy-pages@v4/.test(workflow)) {
				addFailure(workflowPath, 'schema Pages workflow must deploy with actions/deploy-pages');
			}
		}

		lines.forEach((line, index) => {
			const trimmedLine = line.trim();

			if (trimmedLine.startsWith('#')) {
				return;
			}

			if (/(^|[\s;&|])bun\s+install\b(?![^\n]*--frozen-lockfile)/.test(line)) {
				addFailure(workflowPath, `line ${index + 1}: bun install must use --frozen-lockfile`);
			}

			if (/(^|[\s;&|])(?:npm|pnpm|yarn)\s+(?:install|i|ci)\b/.test(line)) {
				addFailure(workflowPath, `line ${index + 1}: workflow dependency installs must use Bun`);
			}

			if (/(^|[\s;&|])bun\s+install\b[^\n]*--minimum-release-age=0/.test(line)) {
				addFailure(workflowPath, `line ${index + 1}: minimum release age bypass`);
			}
		});
	}
};

const checkIncidentIocs = () => {
	const scanRoots = [
		path.join(repoRoot, '.github'),
		path.join(repoRoot, 'scripts'),
		path.join(repoRoot, 'tooling'),
		path.join(repoRoot, 'bun.lock'),
		path.join(repoRoot, 'bunfig.toml'),
		path.join(repoRoot, 'supply-chain-exceptions.json'),
		path.join(repoRoot, 'package.json'),
	];
	const filesToScan = scanRoots.flatMap((scanRoot) => {
		if (!fs.existsSync(scanRoot)) {
			return [];
		}

		if (fs.statSync(scanRoot).isFile()) {
			return [scanRoot];
		}

		return listFiles(scanRoot, () => true);
	});

	for (const filePath of filesToScan) {
		if (filePath === scriptPath) {
			continue;
		}

		const stats = fs.statSync(filePath);
		if (stats.size > 10 * 1024 * 1024) {
			continue;
		}

		const content = readTextFile(filePath);
		for (const ioc of incidentIocs) {
			if (content.includes(ioc)) {
				addFailure(filePath, `matched incident IOC: ${ioc}`);
			}
		}
	}
};

checkBunPolicy();
checkRootInstallPolicy();
checkPackageManifests();
checkExceptionLockfile();
checkWorkflowPolicy();
checkIncidentIocs();

if (failures.length > 0) {
	console.error('Supply-chain policy guard failed:\n');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log('Supply-chain policy guard passed.');
