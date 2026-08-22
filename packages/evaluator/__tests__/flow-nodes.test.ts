import type { Graph } from '@fbp/types';

import type { NodeDefinitionWithImpl } from '../src/types';
import { coreDefinitions, flowBranchDef, flowFilterDef, flowForEachDef, flowGuardDef, flowMergeDef, flowSwitchDef } from '../src/definitions/core';
import { graphInputDef, graphOutputDef } from '../src/definitions/ui';
import { evaluate } from '../src/evaluate';

/**
 * The flow nodes are tested against `src/definitions/core` rather than the
 * fixture copy the older suites use, because what is under test here is the
 * definition the editor actually loads: which port a branch emits is the
 * behaviour, and a fixture cannot answer for it.
 */
describe('flow nodes', () => {
  describe('guard', () => {
    it('emits only the pass arm', () => {
      expect(flowGuardDef.impl!({ ok: true, error: null }, {})).toEqual({ pass: true });
    });

    it('emits only the fail arm, with the error', () => {
      expect(flowGuardDef.impl!({ ok: false, error: { message: 'bad' } }, {})).toEqual({
        fail: true, error: { message: 'bad' },
      });
    });
  });

  describe('branch', () => {
    it('emits the taken port and omits the other', () => {
      expect(flowBranchDef.impl!({ value: 3 }, { operator: 'gt', expected: 2 })).toEqual({ matched: true, true: 3 });
      expect(flowBranchDef.impl!({ value: 1 }, { operator: 'gt', expected: 2 })).toEqual({ matched: false, false: 1 });
    });

    it('takes its expected value from an input when one is wired', () => {
      expect(flowBranchDef.impl!({ value: 'a', expected: 'a' }, { operator: 'eq', expected: 'b' }))
        .toEqual({ matched: true, true: 'a' });
    });

    it('rejects an unknown operator rather than silently not matching', () => {
      expect(() => flowBranchDef.impl!({ value: 1 }, { operator: 'regex' })).toThrow(/unknown operator "regex"/);
    });
  });

  describe('switch', () => {
    it('routes to the first matching case', () => {
      const cases = [{ expected: 'approved' }, { expected: 'changes_requested' }];
      expect(flowSwitchDef.impl!({ value: 'changes_requested' }, { cases }))
        .toEqual({ matched_case: '1', case_1: 'changes_requested' });
    });

    it('routes to default when nothing matched', () => {
      expect(flowSwitchDef.impl!({ value: 'commented' }, { cases: [{ expected: 'approved' }] }))
        .toEqual({ matched_case: 'default', default: 'commented' });
    });

    it('declares a port for every case it accepts', () => {
      const cases = Array.from({ length: 6 }, (_, i) => ({ expected: i }));
      const declared = new Set((flowSwitchDef.outputs ?? []).map((port) => port.name));
      for (let i = 0; i < cases.length; i++) {
        expect(declared).toContain(`case_${i}`);
      }
      expect(() => flowSwitchDef.impl!({ value: 0 }, { cases: [...cases, { expected: 6 }] }))
        .toThrow(/declared case ports/);
    });
  });

  describe('merge', () => {
    it('passes through whichever arm produced a value', () => {
      expect(flowMergeDef.impl!({ b: 'fixed' }, {})).toEqual({ value: 'fixed', source: 'b' });
    });

    it('refuses to invent a value when no arm arrived', () => {
      expect(() => flowMergeDef.impl!({}, {})).toThrow(/neither input arrived/);
    });
  });

  describe('filter', () => {
    it('keeps the matching items and reports both counts', () => {
      expect(flowFilterDef.impl!({ items: [1, 0, 2] }, {})).toEqual({
        kept_count: 2, dropped_count: 1, items: [1, 2], dropped: [0],
      });
    });

    it('compares a declared field of each item', () => {
      const items = [{ conclusion: 'success' }, { conclusion: 'failure' }];
      expect(flowFilterDef.impl!({ items }, { path: 'conclusion', operator: 'eq', expected: 'failure' }))
        .toEqual({ kept_count: 1, dropped_count: 1, items: [items[1]], dropped: [items[0]] });
    });

    it('emits empty instead of an empty items port', () => {
      expect(flowFilterDef.impl!({ items: [] }, {})).toEqual({
        kept_count: 0, dropped_count: 0, empty: true,
      });
    });

    it('declares every port it can emit', () => {
      const declared = new Set((flowFilterDef.outputs ?? []).map((port) => port.name));
      for (const port of ['items', 'dropped', 'empty', 'kept_count', 'dropped_count']) {
        expect(declared).toContain(port);
      }
    });

    it('rejects a non-array collection and an unknown operator', () => {
      expect(() => flowFilterDef.impl!({ items: 'nope' }, {})).toThrow(/items must be an array/);
      expect(() => flowFilterDef.impl!({ items: [1] }, { operator: 'regex' })).toThrow(/unknown operator "regex"/);
    });
  });

  describe('for_each', () => {
    it('plans one keyed shard per item', () => {
      expect(flowForEachDef.impl!({ items: ['a'] }, {})).toEqual({
        total: 1,
        shards: [{ index: 0, total: 1, item: 'a', key: '0' }],
      });
    });

    it('keys shards off a declared field', () => {
      const items = [{ target: 'amd64' }, { target: 'arm64' }];
      expect(flowForEachDef.impl!({ items }, { key: 'target' })).toEqual({
        total: 2,
        shards: [
          { index: 0, total: 2, item: items[0], key: 'amd64' },
          { index: 1, total: 2, item: items[1], key: 'arm64' },
        ],
      });
    });

    it('emits empty instead of an empty shards port', () => {
      expect(flowForEachDef.impl!({ items: [] }, {})).toEqual({ total: 0, empty: true });
    });

    it('declares every port it can emit', () => {
      const declared = new Set((flowForEachDef.outputs ?? []).map((port) => port.name));
      for (const port of ['shards', 'empty', 'total']) {
        expect(declared).toContain(port);
      }
    });

    it('refuses a plan it cannot key or bound', () => {
      expect(() => flowForEachDef.impl!({ items: [1, 2] }, { max_shards: 1 })).toThrow(/exceeds max_shards 1/);
      expect(() => flowForEachDef.impl!({ items: [{}] }, { key: 'target' })).toThrow(/no value at key path "target"/);
      expect(() => flowForEachDef.impl!({ items: [{ a: 1 }, { a: 1 }] }, { key: 'a' })).toThrow(/appears more than once/);
    });
  });

  it('filter feeds for_each a plan of only the items that survived', async () => {
    const graph: Graph = {
      name: 'filter-for-each',
      context: 'js',
      nodes: [
        {
          name: 'input1',
          type: 'graphInput',
          props: [{ name: 'portName', type: 'string', value: 'checks' }],
        },
        {
          name: 'filter1',
          type: 'flow:filter',
          props: [
            { name: 'path', type: 'string', value: 'conclusion' },
            { name: 'operator', type: 'string', value: 'eq' },
            { name: 'expected', type: 'string', value: 'failure' },
          ],
        },
        {
          name: 'foreach1',
          type: 'flow:for_each',
          props: [{ name: 'key', type: 'string', value: 'name' }],
        },
        {
          name: 'output1',
          type: 'graphOutput',
          props: [{ name: 'portName', type: 'string', value: 'value' }],
        },
      ],
      edges: [
        { src: { node: 'input1', port: 'value' }, dst: { node: 'filter1', port: 'items' } },
        { src: { node: 'filter1', port: 'items' }, dst: { node: 'foreach1', port: 'items' } },
        { src: { node: 'foreach1', port: 'shards' }, dst: { node: 'output1', port: 'value' } },
      ],
    };

    const checks = [
      { name: 'lint', conclusion: 'success' },
      { name: 'test', conclusion: 'failure' },
    ];

    await expect(evaluate(graph, {
      definitions: [...coreDefinitions, graphInputDef, graphOutputDef],
      outputNode: 'output1',
      outputPort: 'value',
      inputs: { checks },
    })).resolves.toEqual([{ index: 0, total: 1, item: checks[1], key: 'test' }]);
  });

  it('does not run the fan-out arm when the filter kept nothing', async () => {
    let forEachCalls = 0;
    const countingForEach: NodeDefinitionWithImpl = {
      ...flowForEachDef,
      impl: (inputs, props) => {
        forEachCalls += 1;
        return flowForEachDef.impl!(inputs, props);
      },
    };

    const graph: Graph = {
      name: 'filter-empty-arm',
      context: 'js',
      nodes: [
        {
          name: 'input1',
          type: 'graphInput',
          props: [{ name: 'portName', type: 'string', value: 'checks' }],
        },
        {
          name: 'filter1',
          type: 'flow:filter',
          props: [
            { name: 'path', type: 'string', value: 'conclusion' },
            { name: 'operator', type: 'string', value: 'eq' },
            { name: 'expected', type: 'string', value: 'failure' },
          ],
        },
        {
          name: 'foreach1',
          type: 'flow:for_each',
          props: [{ name: 'key', type: 'string', value: 'name' }],
        },
        { name: 'merge1', type: 'flow:merge' },
        {
          name: 'output1',
          type: 'graphOutput',
          props: [{ name: 'portName', type: 'string', value: 'value' }],
        },
      ],
      edges: [
        { src: { node: 'input1', port: 'value' }, dst: { node: 'filter1', port: 'items' } },
        { src: { node: 'filter1', port: 'items' }, dst: { node: 'foreach1', port: 'items' } },
        { src: { node: 'foreach1', port: 'shards' }, dst: { node: 'merge1', port: 'a' } },
        { src: { node: 'filter1', port: 'empty' }, dst: { node: 'merge1', port: 'b' } },
        { src: { node: 'merge1', port: 'source' }, dst: { node: 'output1', port: 'value' } },
      ],
    };

    const run = (checks: unknown[]) =>
      evaluate(graph, {
        definitions: [
          ...coreDefinitions.filter((def) => def !== flowForEachDef),
          countingForEach,
          graphInputDef,
          graphOutputDef,
        ],
        outputNode: 'output1',
        outputPort: 'value',
        inputs: { checks },
      });

    // Every check passed: `items` is absent, so the fan-out node never runs at all.
    await expect(run([{ name: 'lint', conclusion: 'success' }])).resolves.toBe('b');
    expect(forEachCalls).toBe(0);

    await expect(run([{ name: 'lint', conclusion: 'failure' }])).resolves.toBe('a');
    expect(forEachCalls).toBe(1);
  });

  it('branch and merge rejoin a graph on the arm that was taken', async () => {
    const graph: Graph = {
      name: 'branch-merge',
      context: 'js',
      nodes: [
        {
          name: 'input1',
          type: 'graphInput',
          props: [{ name: 'portName', type: 'string', value: 'verdict' }],
        },
        {
          name: 'branch1',
          type: 'flow:branch',
          props: [
            { name: 'operator', type: 'string', value: 'eq' },
            { name: 'expected', type: 'string', value: 'approved' },
          ],
        },
        { name: 'merge1', type: 'flow:merge' },
        {
          name: 'output1',
          type: 'graphOutput',
          props: [{ name: 'portName', type: 'string', value: 'value' }],
        },
      ],
      edges: [
        { src: { node: 'input1', port: 'value' }, dst: { node: 'branch1', port: 'value' } },
        { src: { node: 'branch1', port: 'true' }, dst: { node: 'merge1', port: 'a' } },
        { src: { node: 'branch1', port: 'false' }, dst: { node: 'merge1', port: 'b' } },
        { src: { node: 'merge1', port: 'value' }, dst: { node: 'output1', port: 'value' } },
      ],
    };

    const run = (verdict: string) =>
      evaluate(graph, {
        definitions: [...coreDefinitions, graphInputDef, graphOutputDef],
        outputNode: 'output1',
        outputPort: 'value',
        inputs: { verdict },
      });

    await expect(run('approved')).resolves.toBe('approved');
    await expect(run('changes_requested')).resolves.toBe('changes_requested');
  });
});
