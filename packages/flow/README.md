# @fbp/flow

Inline node adapter for the constructive-db compute worker.

Exports `flowAdapter` (an `InlineAdapter`) providing the inline node implementations for `flow:guard`, `flow:coerce`.

Register it with an `InlineRegistry` at the service layer:

```ts
import { InlineRegistry } from '@fbp/core';
import { flowAdapter } from '@fbp/flow';

const registry = new InlineRegistry();
registry.register(flowAdapter);
```
