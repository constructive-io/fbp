# @fbp/json

Inline node adapter for the constructive-db compute worker.

Exports `jsonAdapter` (an `InlineAdapter`) providing the inline node implementations for `json:select`, `json:object`, `json:merge`, `json:split`.

Register it with an `InlineRegistry` at the service layer:

```ts
import { InlineRegistry } from '@fbp/core';
import { jsonAdapter } from '@fbp/json';

const registry = new InlineRegistry();
registry.register(jsonAdapter);
```
