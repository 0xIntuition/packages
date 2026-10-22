import { fileURLToPath } from 'node:url';

/** Resolve names through public exports, always to built dist, never source.
 * Bun's isolated install links consumers locally rather than linking the root.
 * Try root resolution first; otherwise use the package's self-referencing public
 * exports from its existing manifest. viem resolves from the protocol consumer.
 * This creates no links, dependencies, or files.
 */
async function publicPackage(name: string) {
	let resolved: string;
	try {
		resolved = import.meta.resolve(name);
	} catch {
		const slug = name === 'viem' ? 'protocol' : name.replace('@0xintuition/', '');
		const manifest = new URL(`../../packages/${slug}/package.json`, import.meta.url);
		resolved = import.meta.resolve(name, fileURLToPath(manifest));
	}
	if (name !== 'viem' && !resolved.includes('/dist/')) {
		throw new Error(`Public package ${name} must resolve to built dist`);
	}
	return import(resolved);
}

export const [iid, registry, classifications, primitives, ids, protocol, viem] = await Promise.all([
	publicPackage('@0xintuition/iid'),
	publicPackage('@0xintuition/iid-registry'),
	publicPackage('@0xintuition/classifications'),
	publicPackage('@0xintuition/primitives'),
	publicPackage('@0xintuition/ids'),
	publicPackage('@0xintuition/protocol'),
	publicPackage('viem'),
]);
