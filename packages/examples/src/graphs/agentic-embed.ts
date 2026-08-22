import type { ExampleFlow } from '../types';

/**
 * Embeddings only, on the one model the suites already run locally
 * (`nomic-embed-text` on Ollama). It reports the vector's width rather than the
 * vector, so a run has a small deterministic assertion — 768 dimensions — that
 * says the whole path worked: worker → knative → runtime `ctx.agent` → agentic
 * server → local provider.
 *
 * The node is the embedding feature's own function, published by
 * constructive-functions — the platform provides `ctx.agent`, features provide
 * the nodes that call it.
 */
export const agenticEmbed: ExampleFlow = {
  id: 'agentic-embed',
  name: 'Agentic embed (nomic-embed-text)',
  description: 'Embed a passage locally and report the vector width — the CI-safe agentic flow.',
  runtime: 'server',
  requiresFunctions: ['embedding:generate_embedding'],
  graph: {
    name: 'agentic-embed',
    nodes: [
      {
        name: 'string1',
        type: 'const:string',
        meta: { x: 80, y: 140 },
        props: [
          {
            name: 'value',
            type: 'string',
            value: 'A flow graph is a set of nodes wired port to port.',
          },
        ],
      },
      {
        name: 'string2',
        type: 'const:string',
        meta: { x: 80, y: 320 },
        props: [{ name: 'value', type: 'string', value: 'nomic-embed-text' }],
      },
      { name: 'embed1', type: 'embedding:generate_embedding', meta: { x: 460, y: 200 } },
      { name: 'object1', type: 'json:object', meta: { x: 820, y: 200 } },
      {
        name: 'graphOutput1',
        type: 'graphOutput',
        meta: { x: 1140, y: 200 },
        props: [{ name: 'portName', type: 'string', value: 'result' }],
      },
    ],
    edges: [
      { src: { node: 'string1', port: 'value' }, dst: { node: 'embed1', port: 'text' } },
      { src: { node: 'string2', port: 'value' }, dst: { node: 'embed1', port: 'model' } },
      { src: { node: 'embed1', port: 'dimensions' }, dst: { node: 'object1', port: 'dimensions' } },
      { src: { node: 'embed1', port: 'model' }, dst: { node: 'object1', port: 'model' } },
      { src: { node: 'object1', port: 'value' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    outputs: [{ name: 'result', type: 'json' }],
  },
};
