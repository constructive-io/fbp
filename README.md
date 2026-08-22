# fbp

<p align="center" width="100%">
  <img height="250" src="https://raw.githubusercontent.com/constructive-io/constructive/refs/heads/main/assets/outline-logo.svg" />
</p>

Flow-Based Programming TypeScript utilities for the Interweb

<p align="center" width="100%">
  <a href="https://github.com/constructive-io/fbp/actions/workflows/run-tests.yaml">
    <img height="20" src="https://github.com/constructive-io/fbp/actions/workflows/run-tests.yaml/badge.svg" />
  </a>
</p>

## Packages

The format, the engine that runs it, and the editor that draws it:

- [`@fbp/types`](./packages/types)  
  Graph types and definitions — the JSON a flow *is*
- [`@fbp/spec`](./packages/spec)  
  Specification language and renderer for graph definitions
- [`@fbp/evaluator`](./packages/evaluator)  
  Lazy graph evaluator — pulls a node's inputs only when its output is demanded
- [`@fbp/graph-editor`](./packages/graph-editor)  
  React graph editor — canvas, node palette, execution state
- [`@fbp/examples`](./packages/examples)  
  Example graphs, each asserted to evaluate to its documented output

The runtime a host embeds: a registry of inline node adapters, addressed by
task identifier (`math:add`, `json:parse`), plus the adapters themselves.

- [`@fbp/core`](./packages/core)  
  Inline node registry and the adapter/implementation contracts
- [`@fbp/graph`](./packages/graph)  
  Graph-execution payload shapes, guards, and inline argument preparation
- [`@fbp/nodes`](./packages/nodes)  
  The default adapter set — one registry with every adapter below registered
- [`@fbp/const`](./packages/const) · [`@fbp/ctx`](./packages/ctx) · [`@fbp/flow`](./packages/flow) · [`@fbp/json`](./packages/json) · [`@fbp/math`](./packages/math) · [`@fbp/string`](./packages/string) · [`@fbp/text`](./packages/text) · [`@fbp/deploy`](./packages/deploy)  
  Adapters: literals, invocation context, control flow, JSON, arithmetic,
  strings, chunk/join, and deployment planning

## Credits

**🛠 Built by the [Constructive](https://constructive.io) team — creators of modular Postgres tooling for secure, composable backends. If you like our work, contribute on [GitHub](https://github.com/constructive-io).**

## Disclaimer

AS DESCRIBED IN THE LICENSES, THE SOFTWARE IS PROVIDED "AS IS", AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND.

No developer or entity involved in creating this software will be liable for any claims or damages whatsoever associated with your use, inability to use, or your interaction with other users of the code, including any direct, indirect, incidental, special, exemplary, punitive or consequential damages, or loss of profits, cryptocurrencies, tokens, or anything else of value.
