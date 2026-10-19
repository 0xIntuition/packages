export type CoreEncoderContract =
	| 'multivault'
	| 'trust'
	| 'trustbonding'
	| 'wrapped-trust'
	| 'base-emissions-controller'
	| 'satellite-emissions-controller'
	| 'dynamic-fee-flat-price-curve'
	| 'atom-warden';

export type CoreEncoderKind = 'read' | 'write';

export type CoreEncoderManifestEntry = {
	contract: CoreEncoderContract;
	kind: CoreEncoderKind;
	encoderName: string;
	abiName: string;
	functionName: string;
	stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
	sourceWrapper: string;
	sourceFile: string;
};
