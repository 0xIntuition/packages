import { type Address, type Hex, type PublicClient, toHex, zeroAddress } from 'viem';
import { base } from 'viem/chains';

const TRUST_ADDRESS: Address = '0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3';
const WETH_ADDRESS: Address = '0x4200000000000000000000000000000000000006';
const USDC_ADDRESS: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const DEFAULT_SLIPSTREAM_FACTORY_ADDRESS: Address = '0xaDe65c38CD4849aDBA595a4323a8C7DdfE89716a';
const DEFAULT_SLIPSTREAM_QUOTER_ADDRESS: Address = '0x3d4C22254F86f64B7eC90ab8F7aeC1FBFD271c6C';

const TICK_SPACINGS = [1, 10, 50, 100, 200, 2000] as const;

const CL_FACTORY_ABI = [
	{
		type: 'function',
		name: 'getPool',
		stateMutability: 'view',
		inputs: [
			{ name: 'tokenA', type: 'address' },
			{ name: 'tokenB', type: 'address' },
			{ name: 'tickSpacing', type: 'int24' },
		],
		outputs: [{ name: 'pool', type: 'address' }],
	},
] as const;

const CL_QUOTER_ABI = [
	{
		type: 'function',
		name: 'quoteExactInput',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'path', type: 'bytes' },
			{ name: 'amountIn', type: 'uint256' },
		],
		outputs: [
			{ name: 'amountOut', type: 'uint256' },
			{ name: 'sqrtPriceX96AfterList', type: 'uint160[]' },
			{ name: 'initializedTicksCrossedList', type: 'uint32[]' },
			{ name: 'gasEstimate', type: 'uint256' },
		],
	},
] as const;

type PoolInfo = {
	tickSpacing: number;
	pool: Address;
};

export type TrustSwapAndBridgeRouterFindBestRouteConfig = {
	publicClient: PublicClient;
	factoryAddress?: Address;
	quoterAddress?: Address;
};

export type TrustSwapAndBridgeRouterFindBestRouteInputs = {
	tokenIn: Address;
	amountIn: bigint;
};

export type TrustSwapAndBridgeRouterQuotedRoute = {
	path: Hex;
	tokens: Address[];
	tickSpacings: number[];
	quote: bigint;
};

function sameAddress(left: Address, right: Address): boolean {
	return left.toLowerCase() === right.toLowerCase();
}

function assertBaseChain(publicClient: PublicClient): void {
	const chainId = publicClient.chain?.id;
	if (chainId !== undefined && chainId !== base.id) {
		throw new Error(
			`TrustSwapAndBridgeRouter route finding is Base-only. Expected chain ID ${base.id}, got ${chainId}.`
		);
	}
}

function encodePath(tokens: Address[], tickSpacings: number[]): Hex {
	if (tokens.length !== tickSpacings.length + 1) {
		throw new Error('Invalid Slipstream path inputs: tokens and tickSpacings length mismatch.');
	}

	let encoded = '0x';

	for (const [index, token] of tokens.entries()) {
		encoded += token.slice(2).toLowerCase();

		const tickSpacing = tickSpacings[index];
		if (tickSpacing !== undefined) {
			encoded += toHex(tickSpacing, { size: 3 }).slice(2);
		}
	}

	return encoded as Hex;
}

async function findExistingPools(
	publicClient: PublicClient,
	factoryAddress: Address,
	tokenA: Address,
	tokenB: Address
): Promise<PoolInfo[]> {
	const pools = await Promise.all(
		TICK_SPACINGS.map(async (tickSpacing): Promise<PoolInfo | null> => {
			try {
				const pool = await publicClient.readContract({
					address: factoryAddress,
					abi: CL_FACTORY_ABI,
					functionName: 'getPool',
					args: [tokenA, tokenB, tickSpacing],
				});

				if (pool === zeroAddress) {
					return null;
				}

				return { tickSpacing, pool };
			} catch {
				return null;
			}
		})
	);

	return pools.filter((pool): pool is PoolInfo => pool !== null);
}

async function quoteRoute(
	publicClient: PublicClient,
	quoterAddress: Address,
	tokens: Address[],
	tickSpacings: number[],
	amountIn: bigint
): Promise<TrustSwapAndBridgeRouterQuotedRoute | null> {
	const path = encodePath(tokens, tickSpacings);

	try {
		const { result } = await publicClient.simulateContract({
			account: zeroAddress,
			address: quoterAddress,
			abi: CL_QUOTER_ABI,
			functionName: 'quoteExactInput',
			args: [path, amountIn],
		});

		const [quote] = result;

		if (quote > 0n) {
			return {
				path,
				tokens,
				tickSpacings,
				quote,
			};
		}
	} catch {
		// Candidate path is invalid or has insufficient liquidity.
	}

	return null;
}

/**
 * Finds the highest-output Slipstream route from `tokenIn` to TRUST on Base.
 * Mirrors routing behavior from `contracts/periphery/script/utils/getSwapPath.ts`.
 * @param config Public client with optional factory/quoter overrides.
 * @param inputs Token in address and input amount.
 * @returns Best quoted route for swap path construction.
 */
export async function trustSwapAndBridgeRouterFindBestRoute(
	config: TrustSwapAndBridgeRouterFindBestRouteConfig,
	inputs: TrustSwapAndBridgeRouterFindBestRouteInputs
): Promise<TrustSwapAndBridgeRouterQuotedRoute> {
	const { publicClient } = config;
	const {
		factoryAddress = DEFAULT_SLIPSTREAM_FACTORY_ADDRESS,
		quoterAddress = DEFAULT_SLIPSTREAM_QUOTER_ADDRESS,
	} = config;
	const { tokenIn, amountIn } = inputs;

	assertBaseChain(publicClient);

	if (sameAddress(tokenIn, TRUST_ADDRESS)) {
		throw new Error('Cannot quote swap route when tokenIn is already TRUST.');
	}

	const candidates: Array<Promise<TrustSwapAndBridgeRouterQuotedRoute | null>> = [];

	if (sameAddress(tokenIn, USDC_ADDRESS)) {
		const usdcTrustPools = await findExistingPools(
			publicClient,
			factoryAddress,
			USDC_ADDRESS,
			TRUST_ADDRESS
		);

		for (const pool of usdcTrustPools) {
			candidates.push(
				quoteRoute(
					publicClient,
					quoterAddress,
					[USDC_ADDRESS, TRUST_ADDRESS],
					[pool.tickSpacing],
					amountIn
				)
			);
		}
	} else if (sameAddress(tokenIn, WETH_ADDRESS)) {
		const wethUsdcPools = await findExistingPools(
			publicClient,
			factoryAddress,
			WETH_ADDRESS,
			USDC_ADDRESS
		);
		const usdcTrustPools = await findExistingPools(
			publicClient,
			factoryAddress,
			USDC_ADDRESS,
			TRUST_ADDRESS
		);
		const wethTrustPools = await findExistingPools(
			publicClient,
			factoryAddress,
			WETH_ADDRESS,
			TRUST_ADDRESS
		);

		for (const wethUsdcPool of wethUsdcPools) {
			for (const usdcTrustPool of usdcTrustPools) {
				candidates.push(
					quoteRoute(
						publicClient,
						quoterAddress,
						[WETH_ADDRESS, USDC_ADDRESS, TRUST_ADDRESS],
						[wethUsdcPool.tickSpacing, usdcTrustPool.tickSpacing],
						amountIn
					)
				);
			}
		}

		for (const wethTrustPool of wethTrustPools) {
			candidates.push(
				quoteRoute(
					publicClient,
					quoterAddress,
					[WETH_ADDRESS, TRUST_ADDRESS],
					[wethTrustPool.tickSpacing],
					amountIn
				)
			);
		}
	} else {
		const tokenUsdcPools = await findExistingPools(
			publicClient,
			factoryAddress,
			tokenIn,
			USDC_ADDRESS
		);
		const tokenWethPools = await findExistingPools(
			publicClient,
			factoryAddress,
			tokenIn,
			WETH_ADDRESS
		);
		const wethUsdcPools = await findExistingPools(
			publicClient,
			factoryAddress,
			WETH_ADDRESS,
			USDC_ADDRESS
		);
		const usdcTrustPools = await findExistingPools(
			publicClient,
			factoryAddress,
			USDC_ADDRESS,
			TRUST_ADDRESS
		);

		for (const tokenUsdcPool of tokenUsdcPools) {
			for (const usdcTrustPool of usdcTrustPools) {
				candidates.push(
					quoteRoute(
						publicClient,
						quoterAddress,
						[tokenIn, USDC_ADDRESS, TRUST_ADDRESS],
						[tokenUsdcPool.tickSpacing, usdcTrustPool.tickSpacing],
						amountIn
					)
				);
			}
		}

		for (const tokenWethPool of tokenWethPools) {
			for (const wethUsdcPool of wethUsdcPools) {
				for (const usdcTrustPool of usdcTrustPools) {
					candidates.push(
						quoteRoute(
							publicClient,
							quoterAddress,
							[tokenIn, WETH_ADDRESS, USDC_ADDRESS, TRUST_ADDRESS],
							[tokenWethPool.tickSpacing, wethUsdcPool.tickSpacing, usdcTrustPool.tickSpacing],
							amountIn
						)
					);
				}
			}
		}
	}

	const routes = (await Promise.all(candidates)).filter(
		(route): route is TrustSwapAndBridgeRouterQuotedRoute => route !== null
	);

	if (routes.length === 0) {
		throw new Error('No viable Slipstream route found for tokenIn -> TRUST on Base.');
	}

	routes.sort((left, right) => {
		if (right.quote > left.quote) return 1;
		if (right.quote < left.quote) return -1;
		return 0;
	});

	const bestRoute = routes[0];
	if (!bestRoute) {
		throw new Error('No viable Slipstream route found for tokenIn -> TRUST on Base.');
	}

	return bestRoute;
}
