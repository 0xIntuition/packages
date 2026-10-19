export const TrustSwapAndBridgeRouterAbi = [
	{
		type: 'receive',
		stateMutability: 'payable',
	},
	{
		type: 'function',
		name: 'TRUST_ADDRESS',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'WETH_ADDRESS',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'bridgeGasLimit',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'bridgeTrust',
		inputs: [
			{
				name: 'trustAmount',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'recipient',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: 'transferId',
				type: 'bytes32',
				internalType: 'bytes32',
			},
		],
		stateMutability: 'payable',
	},
	{
		type: 'function',
		name: 'finalityState',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint8',
				internalType: 'enum FinalityState',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'metaERC20Hub',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'contract IMetaERC20Hub',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'quoteBridgeFee',
		inputs: [
			{
				name: 'trustAmount',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'recipient',
				type: 'address',
				internalType: 'address',
			},
		],
		outputs: [
			{
				name: 'bridgeFee',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'quoteExactInput',
		inputs: [
			{
				name: 'path',
				type: 'bytes',
				internalType: 'bytes',
			},
			{
				name: 'amountIn',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: 'amountOut',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'success',
				type: 'bool',
				internalType: 'bool',
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'recipientDomain',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint32',
				internalType: 'uint32',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'slipstreamFactory',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'contract ICLFactory',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'slipstreamQuoter',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'slipstreamSwapRouter',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'swapAndBridgeWithERC20',
		inputs: [
			{
				name: 'tokenIn',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'amountIn',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'path',
				type: 'bytes',
				internalType: 'bytes',
			},
			{
				name: 'minTrustOut',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'recipient',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'deadline',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: 'amountOut',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'transferId',
				type: 'bytes32',
				internalType: 'bytes32',
			},
		],
		stateMutability: 'payable',
	},
	{
		type: 'function',
		name: 'swapAndBridgeWithETH',
		inputs: [
			{
				name: 'path',
				type: 'bytes',
				internalType: 'bytes',
			},
			{
				name: 'minTrustOut',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'recipient',
				type: 'address',
				internalType: 'address',
			},
			{
				name: 'deadline',
				type: 'uint256',
				internalType: 'uint256',
			},
		],
		outputs: [
			{
				name: 'amountOut',
				type: 'uint256',
				internalType: 'uint256',
			},
			{
				name: 'transferId',
				type: 'bytes32',
				internalType: 'bytes32',
			},
		],
		stateMutability: 'payable',
	},
	{
		type: 'function',
		name: 'trustToken',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'contract IERC20',
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'event',
		name: 'SwappedAndBridgedFromERC20',
		inputs: [
			{
				name: 'user',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'tokenIn',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'amountIn',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
			{
				name: 'trustOut',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
			{
				name: 'recipientAddress',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32',
			},
			{
				name: 'transferId',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'SwappedAndBridgedFromETH',
		inputs: [
			{
				name: 'user',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'ethSwapped',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
			{
				name: 'trustOut',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
			{
				name: 'recipientAddress',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32',
			},
			{
				name: 'transferId',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32',
			},
		],
		anonymous: false,
	},
	{
		type: 'event',
		name: 'TrustBridged',
		inputs: [
			{
				name: 'user',
				type: 'address',
				indexed: true,
				internalType: 'address',
			},
			{
				name: 'trustAmount',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256',
			},
			{
				name: 'recipientAddress',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32',
			},
			{
				name: 'transferId',
				type: 'bytes32',
				indexed: false,
				internalType: 'bytes32',
			},
		],
		anonymous: false,
	},
	{
		type: 'error',
		name: 'ReentrancyGuardReentrantCall',
		inputs: [],
	},
	{
		type: 'error',
		name: 'SafeERC20FailedOperation',
		inputs: [
			{
				name: 'token',
				type: 'address',
				internalType: 'address',
			},
		],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_AmountInZero',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_DeadlineExpired',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_ETHRefundFailed',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_InsufficientBridgeFee',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_InsufficientETH',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_InvalidAddress',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_InvalidPath',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_InvalidRecipient',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_InvalidToken',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_MinTrustOutZero',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_PathDoesNotEndWithTRUST',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_PathDoesNotStartWithToken',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_PathDoesNotStartWithWETH',
		inputs: [],
	},
	{
		type: 'error',
		name: 'TrustSwapAndBridgeRouter_PoolDoesNotExist',
		inputs: [],
	},
] as const;
