import { createDefaultClassificationRegistry } from '@0xintuition/atom-enrichment';
import {
	createMockArtifact,
	createMockPlugin,
	createMockRequest,
	runPluginConformanceSuite,
} from '@0xintuition/atom-enrichment/testing';

runPluginConformanceSuite(
	createMockPlugin({ mockArtifacts: [createMockArtifact()] }),
	[
		{
			name: 'public ESM testing export',
			request: createMockRequest(),
			expectedSupports: true,
			expectedClassifications: ['opengraph'],
		},
	],
	createDefaultClassificationRegistry()
);
