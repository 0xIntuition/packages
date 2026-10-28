import type { DomainHtmlResolveHostname } from '../../src/plugins/shared/domain-html/fetch';

export const resolvePublicTestHostname: DomainHtmlResolveHostname = async () => [
	{ address: '93.184.216.34', family: 4 },
];
