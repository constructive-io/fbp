# @fbp/examples

The example flow graphs the platform ships: the catalog the Flows panel offers
under **Examples**, and the same objects a suite loads when it wants a known
graph rather than a fixture file it has to keep in step by hand.

```ts
import { exampleFlows, getExampleFlow } from '@fbp/examples';

getExampleFlow('math-pipeline').graph; // → Graph
```

Each entry carries what it needs to run:

| id | runtime | needs |
|---|---|---|
| `hello-string` | `local` | nothing — inline nodes only |
| `math-pipeline` | `local` | nothing — inline nodes only |
| `agentic-embed` | `server` | `embedding:generate_embedding` |
| `agentic-kit` | `server` | `agent:chat`, `embedding:generate_embedding` |
| `email-send` | `server` | `email:send` |

`runtime: 'local'` means every node is an inline node, so the editor's
**Preview Locally** evaluates the whole graph in the browser; those two are the
examples the tests evaluate and assert an exact value for. A `server` example
addresses registered cloud functions and only runs through **Run on Server**.

The agentic examples address functions in [`functions/`](../../functions):
`embedding:generate_embedding` and `agent:chat`, both of which reach a provider
through the runtime's metered `ctx.agent`. Run them on a platform those feature
images are registered on — and on the Kubernetes lane, one brought up with the
agentic pair, which is opt-in:

```bash
fun up --with agentic     # the metered gateway + a local Ollama
```

Without it a function pod has no gateway to reach (compute-service's in-process
one binds localhost inside the worker pod), and both agentic examples fail with
`agent context not available`.
