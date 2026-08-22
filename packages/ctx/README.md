# @fbp/ctx

Inline node adapter for the constructive-db compute worker.

Exports `ctxAdapter` (an `InlineAdapter`) providing `ctx:request` — the head of a graph that is not a constant. It projects the invocation context the runtime already carries (database, namespace, entity, organization, actor, principal, scope, execution) into typed output ports, and performs no I/O.

A runtime that does not know the context — the editor's local preview — passes none, and every port is null rather than a fabricated value.

```ts
import { InlineRegistry } from '@fbp/core';
import { ctxAdapter } from '@fbp/ctx';

const registry = new InlineRegistry();
registry.register(ctxAdapter);
```
