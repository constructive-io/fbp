import { InlineRegistry } from '@fbp/core';

import { flowAdapter } from '../src/index';

const impl = (taskIdentifier: string) => {
  const node = flowAdapter.nodes.find((n) => n.taskIdentifier === taskIdentifier);
  if (!node) throw new Error(`no node ${taskIdentifier}`);
  return node.impl;
};

describe('flowAdapter', () => {
  it('has the expected name and nodes', () => {
    expect(flowAdapter.name).toBe('@fbp/flow');
    expect(flowAdapter.nodes.map((n) => n.taskIdentifier)).toEqual([
      'flow:guard', 'flow:coerce', 'flow:branch', 'flow:switch', 'flow:merge',
      'flow:filter', 'flow:for_each',
    ]);
  });

  it('guard emits only the pass port when ok is true', async () => {
    const result = await impl('flow:guard')({ ok: true, error: null }, {});
    expect(result).toEqual({ pass: true });
  });

  it('guard emits only the fail port when ok is false', async () => {
    const result = await impl('flow:guard')({ ok: false, error: { message: 'bad' } }, {});
    expect(result).toEqual({ fail: true, error: { message: 'bad' } });
  });

  it('coerce converts to the target type', () => {
    expect(impl('flow:coerce')({ value: '42' }, { type: 'number' })).toEqual({ value: 42 });
    expect(impl('flow:coerce')({ value: 1 }, { type: 'boolean' })).toEqual({ value: true });
    expect(impl('flow:coerce')({ value: 5 }, { type: 'string' })).toEqual({ value: '5' });
    expect(impl('flow:coerce')({ value: '{"a":1}' }, { type: 'json' })).toEqual({ value: { a: 1 } });
  });

  it('branch routes a matching value down the true port', () => {
    expect(impl('flow:branch')({ value: 5 }, { operator: 'gt', expected: 3 })).toEqual({
      matched: true, true: 5,
    });
  });

  it('branch routes a non-matching value down the false port', () => {
    expect(impl('flow:branch')({ value: 1 }, { operator: 'gt', expected: 3 })).toEqual({
      matched: false, false: 1,
    });
  });

  it('branch takes the expected value from an input port when one is wired', () => {
    expect(impl('flow:branch')({ value: 'a', expected: 'a' }, { operator: 'eq', expected: 'b' }))
      .toEqual({ matched: true, true: 'a' });
  });

  it('branch defaults to a truthiness test', () => {
    expect(impl('flow:branch')({ value: '' }, {})).toEqual({
      matched: false, false: '',
    });
  });

  it('branch treats an absent, empty string, array or object as empty', () => {
    const empty = (value: unknown) =>
      (impl('flow:branch')({ value }, { operator: 'empty' }) as Record<string, unknown>).matched;
    expect(empty(null)).toBe(true);
    expect(empty('')).toBe(true);
    expect(empty([])).toBe(true);
    expect(empty({})).toBe(true);
    expect(empty([1])).toBe(false);
    expect(empty(0)).toBe(false);
  });

  it('branch tests membership for an array and substring for a string', () => {
    expect((impl('flow:branch')({ value: ['a'] }, { operator: 'contains', expected: 'a' }) as Record<string, unknown>).matched).toBe(true);
    expect((impl('flow:branch')({ value: 'abc' }, { operator: 'contains', expected: 'b' }) as Record<string, unknown>).matched).toBe(true);
  });

  it('branch omits the untaken port, which is what makes it a branch', () => {
    const taken = impl('flow:branch')({ value: null }, { operator: 'empty' }) as Record<string, unknown>;
    expect(taken).toHaveProperty('true');
    expect(taken).not.toHaveProperty('false');
    expect(taken.matched).toBe(true);

    const notTaken = impl('flow:branch')({ value: 1 }, { operator: 'empty' }) as Record<string, unknown>;
    expect(notTaken).toHaveProperty('false');
    expect(notTaken).not.toHaveProperty('true');
  });

  it('branch emits a taken port carrying null, which an absent port is not', () => {
    const result = impl('flow:branch')({ value: null }, { operator: 'empty' }) as Record<string, unknown>;
    expect(result.true).toBeNull();
    expect(Object.keys(result).sort()).toEqual(['matched', 'true']);
  });

  it('branch rejects an unknown operator rather than silently not matching', () => {
    expect(() => impl('flow:branch')({ value: 1 }, { operator: 'regex' })).toThrow(
      /unknown operator "regex"/
    );
  });

  it('switch emits the first matching case and nothing else', () => {
    const cases = [{ expected: 'approved' }, { expected: 'changes_requested' }];
    const result = impl('flow:switch')({ value: 'changes_requested' }, { cases }) as Record<string, unknown>;
    expect(result).toEqual({ matched_case: '1', case_1: 'changes_requested' });
  });

  it('switch resolves overlapping cases by position', () => {
    const cases = [{ operator: 'gt', expected: 0 }, { operator: 'gt', expected: 10 }];
    const result = impl('flow:switch')({ value: 50 }, { cases }) as Record<string, unknown>;
    expect(result.matched_case).toBe('0');
  });

  it('switch falls to default when nothing matched', () => {
    const cases = [{ expected: 'approved' }];
    expect(impl('flow:switch')({ value: 'commented' }, { cases })).toEqual({
      matched_case: 'default', default: 'commented',
    });
  });

  it('switch with no cases goes straight to default', () => {
    expect(impl('flow:switch')({ value: 1 }, {})).toEqual({ matched_case: 'default', default: 1 });
  });

  it('switch takes its operator per case, falling back to the node-level one', () => {
    const cases = [{ operator: 'empty' }, { expected: 7 }];
    expect((impl('flow:switch')({ value: [] }, { cases }) as Record<string, unknown>).matched_case).toBe('0');
    expect((impl('flow:switch')({ value: 7 }, { cases }) as Record<string, unknown>).matched_case).toBe('1');
  });

  it('switch refuses more cases than it has declared ports', () => {
    const cases = Array.from({ length: 7 }, (_, i) => ({ expected: i }));
    expect(() => impl('flow:switch')({ value: 99 }, { cases })).toThrow(/declared case ports/);
  });

  it('switch rejects a malformed cases prop rather than routing to default', () => {
    expect(() => impl('flow:switch')({ value: 1 }, { cases: 'approved' })).toThrow(/must be an array/);
    expect(() => impl('flow:switch')({ value: 1 }, { cases: ['approved'] })).toThrow(/must be an object/);
  });

  it('switch rejects an unknown operator', () => {
    expect(() => impl('flow:switch')({ value: 1 }, { cases: [{ operator: 'regex', expected: 'x' }] }))
      .toThrow(/unknown operator "regex"/);
  });

  it('merge passes through whichever arm arrived', () => {
    expect(impl('flow:merge')({ a: 'left' }, {})).toEqual({ value: 'left', source: 'a' });
    expect(impl('flow:merge')({ b: 'right' }, {})).toEqual({ value: 'right', source: 'b' });
  });

  it('merge carries a null an arm actually produced', () => {
    expect(impl('flow:merge')({ b: null }, {})).toEqual({ value: null, source: 'b' });
  });

  it('merge prefers a when both arrived', () => {
    expect(impl('flow:merge')({ a: 1, b: 2 }, {})).toEqual({ value: 1, source: 'a' });
  });

  it('merge refuses to invent a value when no arm arrived', () => {
    expect(() => impl('flow:merge')({}, {})).toThrow(/neither input arrived/);
  });

  it('filter keeps the matching items and reports both counts', () => {
    expect(impl('flow:filter')({ items: [1, 0, 2, null, 3] }, {})).toEqual({
      kept_count: 3, dropped_count: 2, items: [1, 2, 3], dropped: [0, null],
    });
  });

  it('filter compares a declared field of each item', () => {
    const items = [
      { name: 'lint', conclusion: 'success' },
      { name: 'test', conclusion: 'failure' },
    ];
    expect(impl('flow:filter')(
      { items },
      { path: 'conclusion', operator: 'eq', expected: 'success' },
    )).toEqual({
      kept_count: 1,
      dropped_count: 1,
      items: [items[0]],
      dropped: [items[1]],
    });
  });

  it('filter takes expected from the input port over the prop', () => {
    expect(impl('flow:filter')(
      { items: [1, 2, 3], expected: 2 },
      { operator: 'gt', expected: 0 },
    )).toEqual({ kept_count: 1, dropped_count: 2, items: [3], dropped: [1, 2] });
  });

  it('filter emits empty instead of an empty items port', () => {
    expect(impl('flow:filter')({ items: [0, false] }, {})).toEqual({
      kept_count: 0, dropped_count: 2, empty: true, dropped: [0, false],
    });
    expect(impl('flow:filter')({ items: [] }, {})).toEqual({
      kept_count: 0, dropped_count: 0, empty: true,
    });
  });

  it('filter omits the dropped port when nothing was dropped', () => {
    const result = impl('flow:filter')({ items: [1, 2] }, {}) as Record<string, unknown>;
    expect('dropped' in result).toBe(false);
  });

  it('filter rejects a non-array collection and an unknown operator', () => {
    expect(() => impl('flow:filter')({ items: 'nope' }, {})).toThrow(/items must be an array/);
    expect(() => impl('flow:filter')({ items: [1] }, { operator: 'regex' })).toThrow(/unknown operator "regex"/);
  });

  it('for_each plans one keyed shard per item', () => {
    expect(impl('flow:for_each')({ items: ['a', 'b'] }, {})).toEqual({
      total: 2,
      shards: [
        { index: 0, total: 2, item: 'a', key: '0' },
        { index: 1, total: 2, item: 'b', key: '1' },
      ],
    });
  });

  it('for_each keys shards off a declared field', () => {
    const items = [{ target: 'linux/amd64' }, { target: 'linux/arm64' }];
    expect(impl('flow:for_each')({ items }, { key: 'target' })).toEqual({
      total: 2,
      shards: [
        { index: 0, total: 2, item: items[0], key: 'linux/amd64' },
        { index: 1, total: 2, item: items[1], key: 'linux/arm64' },
      ],
    });
  });

  it('for_each emits empty instead of an empty shards port', () => {
    expect(impl('flow:for_each')({ items: [] }, {})).toEqual({ total: 0, empty: true });
  });

  it('for_each refuses a plan it cannot key or bound', () => {
    expect(() => impl('flow:for_each')({ items: {} }, {})).toThrow(/items must be an array/);
    expect(() => impl('flow:for_each')({ items: [1, 2, 3] }, { max_shards: 2 }))
      .toThrow(/exceeds max_shards 2/);
    expect(() => impl('flow:for_each')({ items: [{ a: 1 }] }, { key: 'target' }))
      .toThrow(/no value at key path "target"/);
    expect(() => impl('flow:for_each')({ items: [{ a: 1 }, { a: 1 }] }, { key: 'a' }))
      .toThrow(/appears more than once/);
    expect(() => impl('flow:for_each')({ items: [1] }, { max_shards: 0 }))
      .toThrow(/max_shards must be a positive number/);
  });

  it('registers into an InlineRegistry', () => {
    const registry = new InlineRegistry();
    registry.register(flowAdapter);
    expect(registry.has('flow:coerce')).toBe(true);
  });
});
