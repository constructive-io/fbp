import { InlineRegistry } from '@fbp/core';

import { stringAdapter } from '../src/index';

const impl = (taskIdentifier: string) => {
  const node = stringAdapter.nodes.find((n) => n.taskIdentifier === taskIdentifier);
  if (!node) throw new Error(`no node ${taskIdentifier}`);
  return node.impl;
};

describe('stringAdapter', () => {
  it('has the expected name and nodes', () => {
    expect(stringAdapter.name).toBe('@fbp/string');
    expect(stringAdapter.nodes.map((n) => n.taskIdentifier)).toEqual([
      'string:template', 'string:concat',
    ]);
  });

  it('template replaces {{placeholders}}', () => {
    expect(
      impl('string:template')({ name: 'World' }, { template: 'Hello, {{name}}!' })
    ).toEqual({ value: 'Hello, World!' });
  });

  it('template leaves unknown placeholders intact', () => {
    expect(
      impl('string:template')({}, { template: '{{missing}}' })
    ).toEqual({ value: '{{missing}}' });
  });

  it('concat applies prefix and suffix', () => {
    expect(
      impl('string:concat')({ value: 'main' }, { prefix: 'pre-', suffix: '-suf' })
    ).toEqual({ value: 'pre-main-suf' });
  });

  it('registers into an InlineRegistry', () => {
    const registry = new InlineRegistry();
    registry.register(stringAdapter);
    expect(registry.has('string:template')).toBe(true);
  });
});
