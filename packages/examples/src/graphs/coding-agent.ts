import type { ExampleFlow } from '../types';

/**
 * A coding agent as one node.
 *
 * `agent:chat` plans first — it turns the graph's one input into the instruction
 * the coding run is given — and `agent:code_task` is the resource node that does
 * the work: it clones the repository, runs the agent inside the clone with the
 * thread as its UI, then commits, pushes and opens a pull request. The plan step
 * is optional in the sense that the coding node accepts the raw request just as
 * well; it is here because it is what makes the graph legible — the prompt the
 * agent was actually given is a value on an edge, not something buried in a Job.
 *
 * The resource node is long-running: the worker creates a Kubernetes Job and the
 * graph waits for the node gateway to be settled, so the run may pause for a
 * human approval in the thread without the execution timing out.
 */
export const codingAgent: ExampleFlow = {
  id: 'coding-agent',
  name: 'Coding agent (plan → code_task)',
  description:
    'Plan a change, then let the coding agent clone the repo, make it, and open a pull request.',
  runtime: 'server',
  requiresFunctions: ['agent:chat', 'agent:code_task'],
  graph: {
    name: 'coding-agent',
    nodes: [
      {
        name: 'graphInput1',
        type: 'graphInput',
        meta: { x: 80, y: 200 },
        props: [{ name: 'portName', type: 'string', value: 'request' }],
      },
      {
        name: 'string1',
        type: 'const:string',
        meta: { x: 80, y: 60 },
        props: [
          {
            name: 'value',
            type: 'string',
            value:
              'Restate the request as a single instruction for a coding agent working in a git clone. One paragraph, no preamble.',
          },
        ],
      },
      {
        name: 'string2',
        type: 'const:string',
        meta: { x: 80, y: 360 },
        props: [{ name: 'value', type: 'string', value: 'constructive-io/constructive-db' }],
      },
      {
        name: 'string3',
        type: 'const:string',
        meta: { x: 80, y: 460 },
        props: [{ name: 'value', type: 'string', value: 'main' }],
      },
      { name: 'plan1', type: 'agent:chat', meta: { x: 470, y: 120 } },
      { name: 'code1', type: 'agent:code_task', meta: { x: 860, y: 280 } },
      { name: 'object1', type: 'json:object', meta: { x: 1240, y: 280 } },
      {
        name: 'graphOutput1',
        type: 'graphOutput',
        meta: { x: 1560, y: 280 },
        props: [{ name: 'portName', type: 'string', value: 'result' }],
      },
    ],
    edges: [
      { src: { node: 'string1', port: 'value' }, dst: { node: 'plan1', port: 'system' } },
      { src: { node: 'graphInput1', port: 'value' }, dst: { node: 'plan1', port: 'prompt' } },
      { src: { node: 'plan1', port: 'content' }, dst: { node: 'code1', port: 'prompt' } },
      { src: { node: 'string2', port: 'value' }, dst: { node: 'code1', port: 'repo' } },
      { src: { node: 'string3', port: 'value' }, dst: { node: 'code1', port: 'base_branch' } },
      { src: { node: 'code1', port: 'pull_request_url' }, dst: { node: 'object1', port: 'pullRequest' } },
      { src: { node: 'code1', port: 'branch' }, dst: { node: 'object1', port: 'branch' } },
      { src: { node: 'code1', port: 'summary' }, dst: { node: 'object1', port: 'summary' } },
      { src: { node: 'code1', port: 'thread_id' }, dst: { node: 'object1', port: 'thread' } },
      { src: { node: 'object1', port: 'value' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    inputs: [{ name: 'request', type: 'string' }],
    outputs: [{ name: 'result', type: 'json' }],
  },
};
