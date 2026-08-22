# @fbp/math

Inline node adapter for the constructive-db compute worker.

Exports `mathAdapter` (an `InlineAdapter`) providing the inline node implementations for `math:add`, `math:multiply`, `math:subtract`.

Register it with an `InlineRegistry` at the service layer:

```ts
import { InlineRegistry } from '@fbp/core';
import { mathAdapter } from '@fbp/math';

const registry = new InlineRegistry();
registry.register(mathAdapter);
```
