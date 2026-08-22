# @fbp/core

Flow-based programming core primitives, shared by every `@fbp/*` node adapter and by the constructive-db compute worker.

Exports:

- `InlineRegistry` — in-process dispatch: index node implementations by `taskIdentifier` and resolve them at runtime.
- `InlineAdapter` / `InlineNode` / `InlineImplFn` — the types adapters implement.

```ts
import { InlineRegistry } from '@fbp/core';
import { mathAdapter } from '@fbp/math';

const registry = new InlineRegistry();
registry.register(mathAdapter);
```

This package is intentionally generic: it contains no constructive-, job-queue-, or database-specific code. Job-queue payload glue (graph dispatch envelopes, etc.) lives in the runtime that consumes the registry (e.g. `compute-worker`), not here.
