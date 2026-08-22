import { InlineRegistry } from '@fbp/core';

import { jsonAdapter } from '../src/index';

const impl = (taskIdentifier: string) => {
  const node = jsonAdapter.nodes.find((n) => n.taskIdentifier === taskIdentifier);
  if (!node) throw new Error(`no node ${taskIdentifier}`);
  return node.impl;
};

describe('jsonAdapter', () => {
  it('has the expected name and nodes', () => {
    expect(jsonAdapter.name).toBe('@fbp/json');
    expect(jsonAdapter.nodes.map((n) => n.taskIdentifier)).toEqual([
      'json:select', 'json:object', 'json:merge', 'json:split',
    ]);
  });

  it('select extracts nested value by dot-path', () => {
    const obj = { user: { email: 'a@b.com' } };
    expect(impl('json:select')({ obj }, { path: 'user.email' })).toEqual({ value: 'a@b.com' });
    expect(impl('json:select')({ obj: { a: 1 } }, { path: 'b.c' })).toEqual({ value: undefined });
  });

  it('select indexes into arrays', () => {
    const obj = { items: ['x', 'y', 'z'] };
    expect(impl('json:select')({ obj }, { path: 'items.1' })).toEqual({ value: 'y' });
  });

  it('object merges all inputs into a json object', () => {
    expect(impl('json:object')({ name: 'Dan', age: 30 }, {})).toEqual({
      value: { name: 'Dan', age: 30 },
    });
  });

  it('merge combines two objects', () => {
    expect(impl('json:merge')({ a: { x: 1 }, b: { y: 2 } }, {})).toEqual({
      value: { x: 1, y: 2 },
    });
  });

  it('split partitions keys into selected and rest', () => {
    expect(
      impl('json:split')({ obj: { a: 1, b: 2, c: 3 } }, { keys: ['a', 'c'] })
    ).toEqual({ selected: { a: 1, c: 3 }, rest: { b: 2 } });
  });

  it('registers into an InlineRegistry', () => {
    const registry = new InlineRegistry();
    registry.register(jsonAdapter);
    expect(registry.list()).toEqual(
      expect.arrayContaining(['json:select', 'json:object', 'json:merge', 'json:split'])
    );
  });
});
