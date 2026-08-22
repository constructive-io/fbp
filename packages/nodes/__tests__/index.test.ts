import {
  createDefaultInlineRegistry,
  defaultInlineAdapters,
} from '../src/index';

describe('@fbp/nodes', () => {
  it('bundles the default adapters', () => {
    expect(defaultInlineAdapters.map((a) => a.name).sort()).toEqual([
      '@fbp/const',
      '@fbp/ctx',
      '@fbp/deploy',
      '@fbp/flow',
      '@fbp/json',
      '@fbp/math',
      '@fbp/string',
      '@fbp/text',
    ]);
  });

  it('builds a registry with all default inline nodes', () => {
    const registry = createDefaultInlineRegistry();
    expect(registry.has('math:add')).toBe(true);
    expect(registry.has('json:select')).toBe(true);
    expect(registry.has('flow:guard')).toBe(true);
    expect(registry.has('const:number')).toBe(true);
    expect(registry.has('string:template')).toBe(true);
    expect(registry.has('text:chunk')).toBe(true);
    expect(registry.has('ctx:request')).toBe(true);
    expect(registry.has('manifest:parse')).toBe(true);
    expect(registry.has('image:ref')).toBe(true);
    expect(registry.has('deploy:plan')).toBe(true);
    expect(registry.list().length).toBe(registry.size);
  });

  it('registers extra adapters after the defaults', () => {
    const registry = createDefaultInlineRegistry([
      { name: '@fbp/custom', nodes: [{ taskIdentifier: 'custom:noop', impl: () => ({}) }] },
    ]);
    expect(registry.has('custom:noop')).toBe(true);
    expect(registry.has('math:add')).toBe(true);
  });
});
