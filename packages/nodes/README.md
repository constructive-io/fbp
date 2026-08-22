# @fbp/nodes

Default inline node adapter bundle for the constructive-db compute worker.

Aggregates the built-in `@fbp/*` adapters (`math`, `json`, `flow`, `const`, `string`) and exposes a factory that builds a ready-to-use `InlineRegistry`.

```ts
import { createDefaultInlineRegistry } from '@fbp/nodes';

// all default inline nodes registered
const inlineRegistry = createDefaultInlineRegistry();

// or extend/override with additional adapters
const inlineRegistry = createDefaultInlineRegistry([myCustomAdapter]);
```

`defaultInlineAdapters` is also exported for callers that want to compose the registry themselves.
