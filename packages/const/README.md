# @fbp/const

Inline node adapter for the constructive-db compute worker.

Exports `constAdapter` (an `InlineAdapter`) providing the inline node implementations for `const:number`, `const:string`, `const:boolean`.

Register it with an `InlineRegistry` at the service layer:

```ts
import { InlineRegistry } from '@fbp/core';
import { constAdapter } from '@fbp/const';

const registry = new InlineRegistry();
registry.register(constAdapter);
```
