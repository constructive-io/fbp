import type { ExampleFlow } from '../types';

/**
 * Fan-out as a graph: a list of checks → the failures → one keyed shard each.
 *
 * `flow:filter` narrows the collection by the same declared predicate a branch
 * uses, applied to a field of each row (`conclusion eq failure`), and
 * `flow:for_each` turns what survived into an ordered plan — one
 * `{ index, total, item, key }` descriptor per failure, keyed by the check's
 * name so a re-run addresses the same shard rather than a position in a list
 * that may have moved.
 *
 * The point of the wiring is which node does *not* run: `flow:filter` emits
 * `items` only when something survived and `empty` only when nothing did, so on
 * an all-green batch the fan-out arm never becomes runnable and the graph
 * reconverges through `flow:merge` on the `empty` arm instead. A graph that
 * emitted an empty collection would have run the whole downstream arm to
 * discover there was nothing in it.
 *
 * Every node here is inline, so the editor's local preview runs the whole thing
 * with no platform.
 */
export const failedCheckFanout: ExampleFlow = {
  id: 'failed-check-fanout',
  name: 'Fan out over failed checks (filter → for_each)',
  description:
    'Narrow a batch of checks to the failures and plan one keyed shard each — and take the empty path when every check passed.',
  runtime: 'local',
  requiresFunctions: [],
  graph: {
    name: 'failed-check-fanout',
    nodes: [
      {
        name: 'graphInput1',
        type: 'graphInput',
        meta: { x: 80, y: 200 },
        props: [{ name: 'portName', type: 'string', value: 'checks' }],
      },
      {
        name: 'filter1',
        type: 'flow:filter',
        meta: { x: 440, y: 200 },
        props: [
          { name: 'path', type: 'string', value: 'conclusion' },
          { name: 'operator', type: 'string', value: 'eq' },
          { name: 'expected', type: 'string', value: 'failure' },
        ],
      },
      {
        name: 'foreach1',
        type: 'flow:for_each',
        meta: { x: 800, y: 100 },
        props: [{ name: 'key', type: 'string', value: 'name' }],
      },
      { name: 'merge1', type: 'flow:merge', meta: { x: 1160, y: 220 } },
      { name: 'object1', type: 'json:object', meta: { x: 1500, y: 220 } },
      {
        name: 'graphOutput1',
        type: 'graphOutput',
        meta: { x: 1840, y: 220 },
        props: [{ name: 'portName', type: 'string', value: 'plan' }],
      },
    ],
    edges: [
      { src: { node: 'graphInput1', port: 'value' }, dst: { node: 'filter1', port: 'items' } },

      // Something failed: plan a shard per failure, and that plan is the result.
      { src: { node: 'filter1', port: 'items' }, dst: { node: 'foreach1', port: 'items' } },
      { src: { node: 'foreach1', port: 'shards' }, dst: { node: 'merge1', port: 'a' } },

      // Everything passed: the fan-out arm never runs, and `empty` carries the graph.
      { src: { node: 'filter1', port: 'empty' }, dst: { node: 'merge1', port: 'b' } },

      // One output either way, with the counts alongside it.
      { src: { node: 'merge1', port: 'value' }, dst: { node: 'object1', port: 'shards' } },
      { src: { node: 'merge1', port: 'source' }, dst: { node: 'object1', port: 'arm' } },
      { src: { node: 'filter1', port: 'kept_count' }, dst: { node: 'object1', port: 'failed' } },
      { src: { node: 'filter1', port: 'dropped_count' }, dst: { node: 'object1', port: 'passed' } },
      { src: { node: 'object1', port: 'value' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    inputs: [{ name: 'checks', type: 'json' }],
    outputs: [{ name: 'plan', type: 'json' }],
  },
};
