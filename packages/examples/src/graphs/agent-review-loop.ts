import type { ExampleFlow } from '../types';

/**
 * A review loop as a graph: code → review → branch → fix → re-review → merge.
 *
 * This is the graph the flow nodes exist for. `agent:code_task` makes the
 * change, `agent:chat` reviews the run's own summary, and `flow:branch` decides
 * what happens next by a declared predicate — approved goes straight to the
 * output, anything else goes to a second coding run that continues the *same*
 * `agent_run` (its `run_id` is an edge), followed by a second review.
 *
 * `flow:merge` is what makes the two arms one graph again. A branch emits only
 * the port it took, so the arm not taken never completes and every edge out of
 * it is unsatisfiable forever; the merge node declares both of its inputs
 * optional, which is the graph saying "run me on whichever arm arrives". The
 * result is a diamond rather than two graphs: one output port, and `source`
 * recording which path produced it — `a` when the first review approved, `b`
 * when it took a fix and a re-review to get there.
 *
 * The predicate is `contains 'approved'` rather than an exact match because the
 * value being judged is a sentence from a model; asking for equality against
 * prose is how a loop like this silently always takes the same arm.
 */
export const agentReviewLoop: ExampleFlow = {
  id: 'agent-review-loop',
  name: 'Agent review loop (code → review → fix → re-review)',
  description:
    'Let an agent make a change, review it, and only fix and re-review when the review asked for changes.',
  runtime: 'server',
  requiresFunctions: ['agent:chat', 'agent:code_task'],
  graph: {
    name: 'agent-review-loop',
    nodes: [
      {
        name: 'graphInput1',
        type: 'graphInput',
        meta: { x: 80, y: 240 },
        props: [{ name: 'portName', type: 'string', value: 'request' }],
      },
      {
        name: 'string1',
        type: 'const:string',
        meta: { x: 80, y: 360 },
        props: [{ name: 'value', type: 'string', value: 'constructive-io/constructive-db' }],
      },
      {
        name: 'string2',
        type: 'const:string',
        meta: { x: 80, y: 60 },
        props: [
          {
            name: 'value',
            type: 'string',
            value:
              'You are reviewing a coding agent\'s account of a change it just made. Answer with one word — "approved" if the change is sound and complete, "changes_requested" if it is not — then one paragraph saying why, and what to change.',
          },
        ],
      },
      { name: 'code1', type: 'agent:code_task', meta: { x: 470, y: 280 } },
      { name: 'review1', type: 'agent:chat', meta: { x: 860, y: 140 } },
      {
        name: 'branch1',
        type: 'flow:branch',
        meta: { x: 1220, y: 140 },
        props: [
          { name: 'operator', type: 'string', value: 'contains' },
          { name: 'expected', type: 'string', value: 'approved' },
        ],
      },
      {
        name: 'template1',
        type: 'string:template',
        meta: { x: 1220, y: 420 },
        props: [
          {
            name: 'template',
            type: 'string',
            value: 'The review asked for changes. Address this feedback in the same run:\n\n{{review}}',
          },
        ],
      },
      { name: 'fix1', type: 'agent:code_task', meta: { x: 1560, y: 420 } },
      { name: 'review2', type: 'agent:chat', meta: { x: 1900, y: 420 } },
      { name: 'merge1', type: 'flow:merge', meta: { x: 2240, y: 260 } },
      { name: 'object1', type: 'json:object', meta: { x: 2560, y: 260 } },
      {
        name: 'graphOutput1',
        type: 'graphOutput',
        meta: { x: 2880, y: 260 },
        props: [{ name: 'portName', type: 'string', value: 'result' }],
      },
    ],
    edges: [
      { src: { node: 'graphInput1', port: 'value' }, dst: { node: 'code1', port: 'prompt' } },
      { src: { node: 'string1', port: 'value' }, dst: { node: 'code1', port: 'repo' } },

      // The review judges the run's own account of what it did.
      { src: { node: 'string2', port: 'value' }, dst: { node: 'review1', port: 'system' } },
      { src: { node: 'code1', port: 'summary' }, dst: { node: 'review1', port: 'prompt' } },
      { src: { node: 'review1', port: 'content' }, dst: { node: 'branch1', port: 'value' } },

      // Approved: the review text is the result, and the fix arm never runs.
      { src: { node: 'branch1', port: 'true' }, dst: { node: 'merge1', port: 'a' } },

      // Changes requested: the review text becomes the next run's prompt, and
      // `run_id` continues the same session rather than starting a new one.
      { src: { node: 'branch1', port: 'false' }, dst: { node: 'template1', port: 'review' } },
      { src: { node: 'template1', port: 'value' }, dst: { node: 'fix1', port: 'prompt' } },
      { src: { node: 'string1', port: 'value' }, dst: { node: 'fix1', port: 'repo' } },
      { src: { node: 'code1', port: 'run_id' }, dst: { node: 'fix1', port: 'run_id' } },
      { src: { node: 'string2', port: 'value' }, dst: { node: 'review2', port: 'system' } },
      { src: { node: 'fix1', port: 'summary' }, dst: { node: 'review2', port: 'prompt' } },
      { src: { node: 'review2', port: 'content' }, dst: { node: 'merge1', port: 'b' } },

      // One output either way, and `source` says which arm produced it.
      { src: { node: 'merge1', port: 'value' }, dst: { node: 'object1', port: 'review' } },
      { src: { node: 'merge1', port: 'source' }, dst: { node: 'object1', port: 'arm' } },
      { src: { node: 'code1', port: 'pull_request_url' }, dst: { node: 'object1', port: 'pullRequest' } },
      { src: { node: 'code1', port: 'branch' }, dst: { node: 'object1', port: 'branch' } },
      { src: { node: 'object1', port: 'value' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    inputs: [{ name: 'request', type: 'string' }],
    outputs: [{ name: 'result', type: 'json' }],
  },
};
