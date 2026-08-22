/**
 * The chunker `text:chunk` splits with.
 *
 * A copy of the platform's chunker rather than a dependency on it: a
 * Constructive function image may only copy workspace packages from its own
 * compute tree, so the platform keeps the original where an image can reach it
 * and this package — which has to stand alone on npm — carries the same
 * implementation. Both must split a passage identically, or a passage chunked
 * in a flow and the same passage chunked by the embedding worker produce
 * different corpora and a retrieval result becomes unjudgeable.
 *
 * The strategy names are the platform's (`fixed | sentence | paragraph`):
 * `fixed` slides a window of `size` characters carrying `overlap` between
 * windows, while `sentence` and `paragraph` say where a boundary may fall,
 * packing pieces up to `size`. A piece longer than `size` on its own is split
 * by size rather than emitted whole, or the model receives an input longer than
 * its context and the setting silently meant nothing.
 *
 * Strict on purpose — bounds are validated and blank text throws, because a
 * lane that silently indexes nothing looks identical to one that worked. The
 * adapter clamps and guards before calling, since a flow reads free-form props.
 */

/** How a text is split. Mirrors `chunk_strategy` on `metaschema_public.embedding_chunks`. */
export type ChunkStrategy = 'fixed' | 'sentence' | 'paragraph';

export interface ChunkOptions {
  /** Maximum characters per chunk. */
  size: number;
  /** Characters carried from the end of one chunk into the next. */
  overlap?: number;
  strategy?: ChunkStrategy;
}

/** Text between blank lines, and text between sentence terminators. */
const BOUNDARIES: Record<Exclude<ChunkStrategy, 'fixed'>, RegExp> = {
  paragraph: /\n\s*\n/,
  sentence: /(?<=[.!?])\s+/
};

/** What rejoining a packed chunk's pieces preserves: the boundary they were split on. */
const SEPARATORS: Record<Exclude<ChunkStrategy, 'fixed'>, string> = {
  paragraph: '\n\n',
  sentence: ' '
};

const slide = (text: string, size: number, overlap: number): string[] => {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += size - overlap) {
    const chunk = text.slice(start, start + size).trim();
    if (chunk.length > 0) chunks.push(chunk);
  }
  return chunks;
};

/** Pack pieces into chunks no longer than `size`, splitting any piece that alone exceeds it. */
const pack = (
  pieces: string[],
  size: number,
  overlap: number,
  separator: string
): string[] => {
  const chunks: string[] = [];
  let current = '';

  const flush = (): void => {
    if (current) chunks.push(current);
    current = '';
  };

  for (const piece of pieces) {
    if (piece.length > size) {
      flush();
      chunks.push(...slide(piece, size, overlap));
      continue;
    }
    if (current && current.length + separator.length + piece.length > size) flush();
    current = current ? `${current}${separator}${piece}` : piece;
  }
  flush();

  return chunks;
};

/** Split on the strategy's boundaries, then pack the pieces back up to `size`. */
const packed = (
  text: string,
  size: number,
  overlap: number,
  strategy: Exclude<ChunkStrategy, 'fixed'>
): string[] => {
  const pieces = text
    .split(BOUNDARIES[strategy])
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0);
  return pack(pieces, size, overlap, SEPARATORS[strategy]);
};

export const chunkText = (text: string, options: ChunkOptions): string[] => {
  const { size, overlap = 0, strategy = 'fixed' } = options;

  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`chunk size must be a positive integer, received ${size}`);
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= size) {
    throw new Error(
      `overlap must be an integer >= 0 and < the chunk size (${size}), received ${overlap}`
    );
  }
  if (strategy !== 'fixed' && strategy !== 'sentence' && strategy !== 'paragraph') {
    throw new Error(
      `unknown chunk strategy "${strategy}" (expected fixed, sentence, or paragraph)`
    );
  }

  const chunks =
    strategy === 'fixed' ? slide(text, size, overlap) : packed(text, size, overlap, strategy);

  if (chunks.length === 0) throw new Error('text is blank — nothing to chunk');
  return chunks;
};
