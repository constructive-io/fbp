import type { InlineAdapter } from '../src/index';
import { InlineRegistry } from '../src/index';

const makeAdapter = (name: string, ids: string[]): InlineAdapter => ({
  name,
  nodes: ids.map((taskIdentifier) => ({
    taskIdentifier,
    impl: (inputs) => ({ echoed: inputs }),
  })),
});

describe('@fbp/core InlineRegistry', () => {
  it('registers adapters and indexes each node by taskIdentifier', () => {
    const registry = new InlineRegistry();
    registry.register(makeAdapter('@fbp/demo', ['demo:a', 'demo:b']));

    expect(registry.size).toBe(2);
    expect(registry.has('demo:a')).toBe(true);
    expect(registry.list().sort()).toEqual(['demo:a', 'demo:b']);
    expect(registry.adapterNames()).toEqual(['@fbp/demo']);
  });

  it('resolves an impl and returns null for unknown identifiers', async () => {
    const registry = new InlineRegistry();
    registry.register(makeAdapter('@fbp/demo', ['demo:a']));

    const impl = registry.resolve('demo:a');
    expect(impl).not.toBeNull();
    expect(await impl!({ x: 1 }, {})).toEqual({ echoed: { x: 1 } });
    expect(registry.resolve('demo:missing')).toBeNull();
  });

  it('last registration wins on duplicate taskIdentifier', () => {
    const registry = new InlineRegistry();
    registry.register({
      name: '@fbp/first',
      nodes: [{ taskIdentifier: 'dup', impl: () => ({ from: 'first' }) }],
    });
    registry.register({
      name: '@fbp/second',
      nodes: [{ taskIdentifier: 'dup', impl: () => ({ from: 'second' }) }],
    });

    expect(registry.size).toBe(1);
    expect(registry.resolve('dup')!({}, {})).toEqual({ from: 'second' });
    expect(registry.adapterNames()).toEqual(['@fbp/first', '@fbp/second']);
  });
});
