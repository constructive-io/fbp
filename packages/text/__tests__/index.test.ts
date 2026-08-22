import { InlineRegistry } from '@fbp/core';

import { textAdapter } from '../src/index';

const impl = (taskIdentifier: string) => {
  const node = textAdapter.nodes.find((n) => n.taskIdentifier === taskIdentifier);
  if (!node) throw new Error(`no node ${taskIdentifier}`);
  return node.impl;
};

const chunksOf = (text: string, props: Record<string, unknown> = {}): string[] => {
  const out = impl('text:chunk')({ text }, props) as Record<string, unknown>;
  return out.chunks as string[];
};

describe('textAdapter', () => {
  it('has the expected name and nodes', () => {
    expect(textAdapter.name).toBe('@fbp/text');
    expect(textAdapter.nodes.map((n) => n.taskIdentifier)).toEqual([
      'text:chunk', 'text:join',
    ]);
  });

  it('splits on paragraph boundaries', () => {
    const chunks = chunksOf('one\n\ntwo\n\nthree', { size: 5 });
    expect(chunks).toEqual(['one', 'two', 'three']);
  });

  it('packs several units into one chunk while they fit, keeping their boundary', () => {
    const chunks = chunksOf('one\n\ntwo\n\nthree', { size: 20 });
    expect(chunks).toEqual(['one\n\ntwo\n\nthree']);
  });

  it('splits on sentence boundaries', () => {
    const chunks = chunksOf('Hi there. How are you? Fine!', { size: 12, strategy: 'sentence' });
    expect(chunks).toEqual(['Hi there.', 'How are you?', 'Fine!']);
  });

  it('bounds a unit longer than the chunk size rather than emitting it whole', () => {
    const chunks = chunksOf('a'.repeat(25), { size: 10, strategy: 'fixed' });
    expect(chunks.every((c) => c.length <= 10)).toBe(true);
    expect(chunks.join('')).toBe('a'.repeat(25));
  });

  it('carries overlap between chunks', () => {
    const chunks = chunksOf('abcdefghij', { size: 5, overlap: 2, strategy: 'fixed' });
    expect(chunks[0]).toBe('abcde');
    expect(chunks[1].startsWith('de')).toBe(true);
  });

  it('never lets overlap stall the cursor', () => {
    const chunks = chunksOf('abcdefghij', { size: 4, overlap: 99, strategy: 'fixed' });
    expect(chunks.length).toBeLessThan(20);
    expect(chunks[0]).toBe('abcd');
  });

  it('returns no chunks for empty text', () => {
    expect(impl('text:chunk')({ text: '   ' }, {})).toEqual({ chunks: [], count: 0 });
  });

  it('reports the chunk count', () => {
    const out = impl('text:chunk')({ text: 'one\n\ntwo' }, { size: 3 }) as Record<string, unknown>;
    expect(out.count).toBe(2);
  });

  it('rejects an unknown strategy rather than guessing one', () => {
    expect(() => impl('text:chunk')({ text: 'x' }, { strategy: 'semantic' })).toThrow(
      /unknown strategy "semantic"/
    );
  });

  it('joins chunks back into a passage', () => {
    expect(impl('text:join')({ chunks: ['a', 'b'] }, {})).toEqual({ text: 'a\n\nb' });
    expect(impl('text:join')({ chunks: ['a', 'b'] }, { separator: ' ' })).toEqual({ text: 'a b' });
  });

  it('joins nothing into an empty string', () => {
    expect(impl('text:join')({ chunks: null }, {})).toEqual({ text: '' });
  });

  it('round-trips chunk -> join for a paragraph passage', () => {
    const text = 'one\n\ntwo\n\nthree';
    const chunks = chunksOf(text, { size: 5 });
    expect(impl('text:join')({ chunks }, {})).toEqual({ text });
  });

  it('registers into an InlineRegistry', () => {
    const registry = new InlineRegistry();
    registry.register(textAdapter);
    expect(registry.has('text:chunk')).toBe(true);
    expect(registry.has('text:join')).toBe(true);
  });
});
