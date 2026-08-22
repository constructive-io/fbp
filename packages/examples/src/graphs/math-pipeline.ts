import type { ExampleFlow } from '../types';

/**
 * (2 + 3) * 4 — a two-stage inline pipeline. Small enough to assert on
 * exactly, so it is the graph a suite uses to prove that loading an example
 * and evaluating it end to end produces the one right number.
 */
export const mathPipeline: ExampleFlow = {
  id: 'math-pipeline',
  name: 'Math pipeline (2 + 3) × 4',
  description: 'Add then multiply with inline math nodes — runs entirely in the local preview.',
  runtime: 'local',
  requiresFunctions: [],
  graph: {
    name: 'math-pipeline',
    nodes: [
      {
        name: 'number1',
        type: 'const:number',
        meta: { x: 80, y: 100 },
        props: [{ name: 'value', type: 'number', value: 2 }],
      },
      {
        name: 'number2',
        type: 'const:number',
        meta: { x: 80, y: 240 },
        props: [{ name: 'value', type: 'number', value: 3 }],
      },
      {
        name: 'number3',
        type: 'const:number',
        meta: { x: 80, y: 380 },
        props: [{ name: 'value', type: 'number', value: 4 }],
      },
      { name: 'add1', type: 'math:add', meta: { x: 400, y: 160 } },
      { name: 'multiply1', type: 'math:multiply', meta: { x: 700, y: 260 } },
      {
        name: 'graphOutput1',
        type: 'graphOutput',
        meta: { x: 1000, y: 260 },
        props: [{ name: 'portName', type: 'string', value: 'total' }],
      },
    ],
    edges: [
      { src: { node: 'number1', port: 'value' }, dst: { node: 'add1', port: 'a' } },
      { src: { node: 'number2', port: 'value' }, dst: { node: 'add1', port: 'b' } },
      { src: { node: 'add1', port: 'sum' }, dst: { node: 'multiply1', port: 'a' } },
      { src: { node: 'number3', port: 'value' }, dst: { node: 'multiply1', port: 'b' } },
      { src: { node: 'multiply1', port: 'product' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    outputs: [{ name: 'total', type: 'number' }],
  },
};

/** What `graphOutput1.value` holds once the graph is evaluated. */
export const mathPipelineExpectedOutput = 20;
