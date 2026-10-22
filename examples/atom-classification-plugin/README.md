# @0xintuition/atom-classification-example-plugin

Private external plugin example for `@0xintuition/atom-classification`.
This example is not published to npm; copy its source into your own project.
From this directory, run `bun run typecheck` after installing and building the
workspace. Its dependency pins the public classification package version.

## What it does

- Classifies inputs that start with `idea:`
- Resolves them into a deterministic `DefinedTerm` atom

Example:

`idea: semantic grounding` -> `example-term:semantic-grounding`

## Usage

```ts
import {
	createServerEngine,
	defaultClassificationPreset,
} from '@0xintuition/atom-classification';
import { createExampleLexicalSignalPlugin } from './src/index';

const engine = createServerEngine({
	plugins: [...defaultClassificationPreset(), createExampleLexicalSignalPlugin()],
});

const result = await engine.classify({
	input: 'idea: semantic grounding',
	mode: 'progressive',
	classificationSessionId: 'demo-session',
});
```
