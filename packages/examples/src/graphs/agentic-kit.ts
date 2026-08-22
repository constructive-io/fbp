import type { ExampleFlow } from '../types';

/**
 * The agentic-kit round trip as a graph: one piece of text fans out to an
 * embedding call and a chat call, and both results land in a single JSON object
 * so one output node carries the whole answer.
 *
 * Both nodes reach the agentic server through the runtime's `ctx.agent`, so what
 * this really exercises is the identity-carrying path from the worker to the
 * gateway to the local provider — with `nomic-embed-text` on Ollama as the
 * embedding model that is already proven in CI.
 *
 * Both nodes are features' own functions, published by constructive-functions:
 * the platform provides `ctx.agent`, features provide the nodes that call it.
 *
 * Both models are named explicitly rather than left to the gateway's default,
 * because that default is an embedding model (`DEFAULT_MODEL` in
 * `compute/docker-compose.yml`) and would refuse the chat call. The chat model
 * is the small one the local stack pulls, so this graph runs where CI runs.
 */
export const agenticKit: ExampleFlow = {
  id: 'agentic-kit',
  name: 'Agentic kit (embed + chat)',
  description: 'Embed a passage and ask a model about it, merging both into one output.',
  runtime: 'server',
  requiresFunctions: ['agent:chat', 'embedding:generate_embedding'],
  graph: {
    name: 'agentic-kit',
    nodes: [
      {
        name: 'string1',
        type: 'const:string',
        meta: { x: 80, y: 120 },
        props: [
          {
            name: 'value',
            type: 'string',
            value:
              'Constructive turns database metadata into provisioned schemas, row level security policies and typed SDKs.',
          },
        ],
      },
      {
        name: 'string2',
        type: 'const:string',
        meta: { x: 80, y: 300 },
        props: [{ name: 'value', type: 'string', value: 'nomic-embed-text' }],
      },
      {
        name: 'string3',
        type: 'const:string',
        meta: { x: 80, y: 440 },
        props: [
          {
            name: 'value',
            type: 'string',
            value: 'Answer in one short sentence.',
          },
        ],
      },
      {
        name: 'string4',
        type: 'const:string',
        meta: { x: 80, y: 560 },
        props: [{ name: 'value', type: 'string', value: 'qwen2.5:0.5b' }],
      },
      { name: 'embed1', type: 'embedding:generate_embedding', meta: { x: 460, y: 140 } },
      { name: 'chat1', type: 'agent:chat', meta: { x: 460, y: 420 } },
      {
        name: 'select1',
        type: 'json:select',
        meta: { x: 800, y: 60 },
        props: [{ name: 'path', type: 'string', value: '0' }],
      },
      { name: 'object1', type: 'json:object', meta: { x: 1100, y: 300 } },
      {
        name: 'graphOutput1',
        type: 'graphOutput',
        meta: { x: 1420, y: 300 },
        props: [{ name: 'portName', type: 'string', value: 'result' }],
      },
    ],
    edges: [
      { src: { node: 'string1', port: 'value' }, dst: { node: 'embed1', port: 'text' } },
      { src: { node: 'string2', port: 'value' }, dst: { node: 'embed1', port: 'model' } },
      { src: { node: 'string1', port: 'value' }, dst: { node: 'chat1', port: 'prompt' } },
      { src: { node: 'string3', port: 'value' }, dst: { node: 'chat1', port: 'system' } },
      { src: { node: 'string4', port: 'value' }, dst: { node: 'chat1', port: 'model' } },
      { src: { node: 'embed1', port: 'embedding' }, dst: { node: 'select1', port: 'obj' } },
      { src: { node: 'select1', port: 'value' }, dst: { node: 'object1', port: 'firstDimension' } },
      { src: { node: 'embed1', port: 'dimensions' }, dst: { node: 'object1', port: 'dimensions' } },
      { src: { node: 'chat1', port: 'content' }, dst: { node: 'object1', port: 'answer' } },
      { src: { node: 'object1', port: 'value' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    outputs: [{ name: 'result', type: 'json' }],
  },
};
