import type { ExampleFlow } from '../types';

/**
 * A resumable coding session as one node.
 *
 * The sibling of `coding-agent`, kept beside it rather than replacing it: both
 * dispatch `agent:code_task`, and what differs is the harness the node asks for.
 * That graph leaves it to the deployment's default; this one names `pi`, where the
 * `agent_run` row is the session and the Job is one attached compute lifetime —
 * the working tree comes back from git and the transcript from the append-only run
 * log, so the same run can be picked up again by a later execution.
 *
 * `park` is what makes that visible from the graph: with it set, the node finishes
 * by leaving the run `idle` — branch and commit recorded, no compute attached —
 * and the next dispatch of the same run continues the session instead of starting
 * a new one. The graph asks for no repository, because a database has one named
 * after its id the way it has its own storage bucket.
 */
export const codingSession: ExampleFlow = {
  id: 'coding-session',
  name: 'Coding session (resumable run)',
  description:
    'Run a durable coding session in a disposable Job: git carries the workspace, the run log carries the transcript.',
  runtime: 'server',
  requiresFunctions: ['agent:code_task'],
  graph: {
    name: 'coding-session',
    nodes: [
      {
        name: 'graphInput1',
        type: 'graphInput',
        meta: { x: 80, y: 200 },
        props: [{ name: 'portName', type: 'string', value: 'request' }],
      },
      {
        name: 'boolean1',
        type: 'const:boolean',
        meta: { x: 80, y: 340 },
        props: [{ name: 'value', type: 'boolean', value: true }],
      },
      // The harness is a value on an edge for the same reason the prompt is: which
      // kernel ran the session is legible from the graph rather than buried in a
      // Job's environment.
      {
        name: 'string1',
        type: 'const:string',
        meta: { x: 80, y: 480 },
        props: [{ name: 'value', type: 'string', value: 'pi' }],
      },
      { name: 'session1', type: 'agent:code_task', meta: { x: 470, y: 240 } },
      { name: 'object1', type: 'json:object', meta: { x: 880, y: 240 } },
      {
        name: 'graphOutput1',
        type: 'graphOutput',
        meta: { x: 1200, y: 240 },
        props: [{ name: 'portName', type: 'string', value: 'result' }],
      },
    ],
    edges: [
      { src: { node: 'graphInput1', port: 'value' }, dst: { node: 'session1', port: 'prompt' } },
      { src: { node: 'boolean1', port: 'value' }, dst: { node: 'session1', port: 'park' } },
      { src: { node: 'string1', port: 'value' }, dst: { node: 'session1', port: 'harness' } },
      { src: { node: 'session1', port: 'run_id' }, dst: { node: 'object1', port: 'run' } },
      { src: { node: 'session1', port: 'branch' }, dst: { node: 'object1', port: 'branch' } },
      { src: { node: 'session1', port: 'commit' }, dst: { node: 'object1', port: 'commit' } },
      { src: { node: 'session1', port: 'resumed' }, dst: { node: 'object1', port: 'resumed' } },
      { src: { node: 'session1', port: 'summary' }, dst: { node: 'object1', port: 'summary' } },
      { src: { node: 'object1', port: 'value' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    inputs: [{ name: 'request', type: 'string' }],
    outputs: [{ name: 'result', type: 'json' }],
  },
};
