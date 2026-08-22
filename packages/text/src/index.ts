import type { InlineAdapter, InlineImplFn } from '@fbp/core';

import { chunkText, type ChunkStrategy } from './chunk';

/**
 * text:chunk — one passage in, bounded chunks out.
 *
 * The pure half of the embedding shape: a flow can chunk a passage without a
 * database round-trip, and each chunk is then embeddable on its own. Record
 * chunking (read a row, chunk a column, write the chunks back) is a record
 * worker, not this node.
 */
const textChunk: InlineImplFn = (inputs, props) => {
  const text = String(inputs.text ?? '').trim();
  const size = Math.max(1, Math.trunc(Number(props.size ?? 1000)));
  const requestedOverlap = Math.max(0, Math.trunc(Number(props.overlap ?? 0)));
  // An overlap at or above the chunk size never advances the cursor.
  const overlap = Math.min(requestedOverlap, size - 1);
  const strategy = String(props.strategy ?? 'paragraph') as ChunkStrategy;

  // A flow reads free-form props, so the leniency lives here: blank text is no
  // chunks rather than the shared chunker's error, and the strategy name is
  // reported against this node.
  if (strategy !== 'fixed' && strategy !== 'sentence' && strategy !== 'paragraph') {
    throw new Error(
      `text:chunk: unknown strategy "${strategy}" (expected fixed, sentence, or paragraph)`
    );
  }
  if (!text) return { chunks: [], count: 0 };

  const chunks = chunkText(text, { size, overlap, strategy });
  return { chunks, count: chunks.length };
};

/** text:join — chunks back into one passage. */
const textJoin: InlineImplFn = (inputs, props) => {
  const separator = String(props.separator ?? '\n\n');
  const chunks = Array.isArray(inputs.chunks) ? inputs.chunks : [];
  return { text: chunks.map(c => String(c ?? '')).join(separator) };
};

export const textAdapter: InlineAdapter = {
  name: '@fbp/text',
  nodes: [
    { taskIdentifier: 'text:chunk', impl: textChunk },
    { taskIdentifier: 'text:join', impl: textJoin },
  ],
};

export default textAdapter;
