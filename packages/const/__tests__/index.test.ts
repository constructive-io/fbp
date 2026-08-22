import { InlineRegistry } from '@fbp/core';

import { constAdapter } from '../src/index';

const impl = (taskIdentifier: string) => {
  const node = constAdapter.nodes.find((n) => n.taskIdentifier === taskIdentifier);
  if (!node) throw new Error(`no node ${taskIdentifier}`);
  return node.impl;
};

describe('constAdapter', () => {
  it('has the expected name and nodes', () => {
    expect(constAdapter.name).toBe('@fbp/const');
    expect(constAdapter.nodes.map((n) => n.taskIdentifier)).toEqual([
      'const:number', 'const:string', 'const:boolean',
    ]);
  });

  it('number outputs the configured value and defaults to 0', () => {
    expect(impl('const:number')({}, { value: 42 })).toEqual({ value: 42 });
    expect(impl('const:number')({}, {})).toEqual({ value: 0 });
  });

  it('string outputs the configured value and defaults to empty', () => {
    expect(impl('const:string')({}, { value: 'hello' })).toEqual({ value: 'hello' });
    expect(impl('const:string')({}, {})).toEqual({ value: '' });
  });

  it('boolean coerces the configured value', () => {
    expect(impl('const:boolean')({}, { value: true })).toEqual({ value: true });
    expect(impl('const:boolean')({}, { value: 0 })).toEqual({ value: false });
  });

  it('registers into an InlineRegistry', () => {
    const registry = new InlineRegistry();
    registry.register(constAdapter);
    expect(registry.has('const:boolean')).toBe(true);
  });
});
