import type { ExampleFlow } from '../types';

/**
 * The smallest graph that produces a value: two constants into a template,
 * the template into the graph's output. Every node is inline, so it evaluates
 * in the browser — the example to reach for when checking that the editor,
 * the evaluator and the output selector are wired to each other at all.
 */
export const helloString: ExampleFlow = {
  id: 'hello-string',
  name: 'Hello (string template)',
  description: 'Two constants into a string template — runs entirely in the local preview.',
  runtime: 'local',
  requiresFunctions: [],
  graph: {
    name: 'hello-string',
    nodes: [
      {
        name: 'string1',
        type: 'const:string',
        meta: { x: 80, y: 120 },
        props: [{ name: 'value', type: 'string', value: 'Constructive' }],
      },
      {
        name: 'string2',
        type: 'const:string',
        meta: { x: 80, y: 260 },
        props: [{ name: 'value', type: 'string', value: 'flows' }],
      },
      {
        name: 'template1',
        type: 'string:template',
        meta: { x: 400, y: 180 },
        props: [{ name: 'template', type: 'string', value: 'hello {{who}}, welcome to {{what}}' }],
      },
      {
        name: 'graphOutput1',
        type: 'graphOutput',
        meta: { x: 720, y: 180 },
        props: [{ name: 'portName', type: 'string', value: 'greeting' }],
      },
    ],
    edges: [
      { src: { node: 'string1', port: 'value' }, dst: { node: 'template1', port: 'who' } },
      { src: { node: 'string2', port: 'value' }, dst: { node: 'template1', port: 'what' } },
      { src: { node: 'template1', port: 'value' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    outputs: [{ name: 'greeting', type: 'string' }],
  },
};

/** What `graphOutput1.value` holds once the graph is evaluated. */
export const helloStringExpectedOutput = 'hello Constructive, welcome to flows';
