import { expect, test } from 'bun:test';
import { createPinAwareFetch } from '../__shared__/http';
import { fetchOpenGraphMetadata } from './fetch';

test('OpenGraph pins the admitted address when DNS rebinds at the dial, on every hop', async () => {
	let privateDials = 0;
	let calls = 0;
	let dialPhase = false;
	const resolveHostname = async (_hostname: string) => [
		{ address: dialPhase ? '10.0.0.5' : '8.8.8.8', family: 4 as const },
	];
	const output = await fetchOpenGraphMetadata('https://rebind.example/', {
		perHostSpacingMs: 0,
		// Repeated policy checks stay public. A fresh dial lookup rebinds.
		resolveHostname,
		fetch: createPinAwareFetch(async (url, init) => {
			const hostname = new URL(url).hostname;
			dialPhase = true;
			const address = init?.connection?.address ?? (await resolveHostname(hostname))[0]!.address;
			dialPhase = false;
			if (address === '10.0.0.5') privateDials++;
			expect(init?.redirect).toBe('manual');
			return ++calls === 1
				? new Response(null, { status: 302, headers: { location: 'https://second.example/' } })
				: new Response(
						`<head><title>${address === '8.8.8.8' ? 'public' : 'private'}</title></head>`
					);
		}),
	});
	expect(privateDials).toBe(0);
	expect(output.metadata.title).toBe('public');
	expect(calls).toBe(2);
});

test.each([
	'127.0.0.1',
	'[::1]',
])('OpenGraph admits and pins an explicitly enabled loopback fixture: %s', async (hostname) => {
	const output = await fetchOpenGraphMetadata(`http://${hostname}:43210/`, {
		allowLoopbackFixtures: true,
		perHostSpacingMs: 0,
		fetch: createPinAwareFetch(async (_url, init) => {
			expect(init?.connection).toEqual({
				hostname: hostname.replace(/^\[|\]$/g, ''),
				address: hostname.replace(/^\[|\]$/g, ''),
				family: hostname === '[::1]' ? 6 : 4,
			});
			return new Response('<head><title>Fixture</title></head>');
		}),
	});
	expect(output.status).toBe('fetched');
	expect(output.metadata.title).toBe('Fixture');
});

test.each([
	'http://10.0.0.5/',
	'http://169.254.169.254/',
	'http://[fd00::1]/',
	'http://public.example/',
])('OpenGraph keeps rejecting private targets with loopback enabled: %s', async (url) => {
	let dials = 0;
	const output = await fetchOpenGraphMetadata(url, {
		allowLoopbackFixtures: true,
		resolveHostname: async () => [{ address: '10.0.0.5', family: 4 }],
		fetch: createPinAwareFetch(async () => {
			dials += 1;
			return new Response('unexpected');
		}),
	});
	expect(output).toMatchObject({ status: 'blocked', reason: 'private_address' });
	expect(dials).toBe(0);
});

test('OpenGraph rejects loopback by default and private redirects with the allowance', async () => {
	expect(await fetchOpenGraphMetadata('http://127.0.0.1:43210/')).toMatchObject({
		status: 'blocked',
		reason: 'private_address',
	});
	let dials = 0;
	const output = await fetchOpenGraphMetadata('http://127.0.0.1:43210/', {
		allowLoopbackFixtures: true,
		perHostSpacingMs: 0,
		fetch: createPinAwareFetch(async () => {
			dials += 1;
			return new Response(null, {
				status: 302,
				headers: { location: 'http://169.254.169.254/' },
			});
		}),
	});
	expect(output).toMatchObject({ status: 'blocked', reason: 'redirect_private_address' });
	expect(dials).toBe(1);
});

test('OpenGraph retains its existing explicit private-network seed policy', async () => {
	const output = await fetchOpenGraphMetadata('http://10.0.0.5/', {
		allowPrivateNetwork: true,
		perHostSpacingMs: 0,
		fetch: createPinAwareFetch(async (_url, init) => {
			expect(init?.connection?.address).toBe('10.0.0.5');
			return new Response('<head><title>Seed</title></head>');
		}),
	});
	expect(output.status).toBe('fetched');
});
