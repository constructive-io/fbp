import { InlineRegistry } from '@fbp/core';

import { mathAdapter } from '../src/index';

const impl = (taskIdentifier: string) => {
  const node = mathAdapter.nodes.find((n) => n.taskIdentifier === taskIdentifier);
  if (!node) throw new Error(`no node ${taskIdentifier}`);
  return node.impl;
};

describe('mathAdapter', () => {
  it('has the expected name and nodes', () => {
    expect(mathAdapter.name).toBe('@fbp/math');
    expect(mathAdapter.nodes.map((n) => n.taskIdentifier)).toEqual([
      'math:add', 'math:multiply', 'math:subtract',
    ]);
  });

  it('add sums two inputs and defaults missing to 0', () => {
    expect(impl('math:add')({ a: 3, b: 7 }, {})).toEqual({ sum: 10 });
    expect(impl('math:add')({}, {})).toEqual({ sum: 0 });
  });

  it('multiply produces product', () => {
    expect(impl('math:multiply')({ a: 4, b: 5 }, {})).toEqual({ product: 20 });
  });

  it('subtract produces difference', () => {
    expect(impl('math:subtract')({ a: 10, b: 4 }, {})).toEqual({ difference: 6 });
  });

  it('registers into an InlineRegistry', () => {
    const registry = new InlineRegistry();
    registry.register(mathAdapter);
    expect(registry.resolve('math:add')).toBeDefined();
    expect(registry.list()).toContain('math:multiply');
  });
});
