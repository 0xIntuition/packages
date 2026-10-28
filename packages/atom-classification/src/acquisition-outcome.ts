export type AcquisitionOutcome = {
	status: 'unavailable' | 'degraded' | 'blocked';
	terminal: boolean;
	stage?: string;
	reason?: string;
};
