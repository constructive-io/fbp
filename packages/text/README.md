# @fbp/text

Inline node adapter for the constructive-db compute worker.

Exports `textAdapter` (an `InlineAdapter`) providing the inline node implementations for `text:chunk`, `text:join`.

`text:chunk` is the pure half of the embedding shape — a passage in, bounded chunks out, no database round-trip. Chunking a *record* (read a row, chunk a column, write the chunks back) is a record worker, not this node.

```ts
import { InlineRegistry } from '@fbp/core';
import { textAdapter } from '@fbp/text';

const registry = new InlineRegistry();
registry.register(textAdapter);
```
