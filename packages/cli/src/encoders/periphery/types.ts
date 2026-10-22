export type PeripheryEncoderContract = 'trust-swap-and-bridge-router' | 'meta-bridge' | 'fee-proxy';

export type PeripheryEncoderKind = 'read' | 'write';

export type PeripheryEncoderManifestEntry = {
	contract: PeripheryEncoderContract;
	kind: PeripheryEncoderKind;
	encoderName: string;
	abiName: string;
	functionName: string;
	stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
	sourceWrapper: string;
	sourceFile: string;
};
