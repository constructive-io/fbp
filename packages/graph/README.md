# @fbp/graph

Flow-based programming graph-execution payload helpers — the bridge between a job/queue payload and an FBP graph-node execution.

Exports:

- `GraphJobPayload` / `GraphNodePayload` — payload shapes for a graph-node dispatch.
- `isGraphJob` / `isGraphNodePayload` — type guards distinguishing a graph dispatch from a direct invocation.
- `extractNodeProps` — flatten a node's props (array of `{name, value}` or a plain object) into a key-value map.
- `prepareInlineArgs` — turn a payload into the `(inputs, props)` pair an inline node implementation receives.

```ts
import { isGraphNodePayload, prepareInlineArgs } from '@fbp/graph';
import type { InlineImplFn } from '@fbp/core';

const graphNode = isGraphNodePayload(payload);
const { inputs, props } = prepareInlineArgs(payload, graphNode);
const outputs = await (impl as InlineImplFn)(inputs, props);
```

This package is intentionally generic: it contains no queue, database, or constructive-specific code, so any worker (in-process, k8s, …) can reuse it. Queue plumbing lives in the runtime that consumes it (e.g. `compute-worker`), not here.
