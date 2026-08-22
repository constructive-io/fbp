# @fbp/string

Inline node adapter for the constructive-db compute worker.

Exports `stringAdapter` (an `InlineAdapter`) providing the inline node implementations for `string:template`, `string:concat`.

Register it with an `InlineRegistry` at the service layer:

```ts
import { InlineRegistry } from '@fbp/core';
import { stringAdapter } from '@fbp/string';

const registry = new InlineRegistry();
registry.register(stringAdapter);
```
