import { imageRef } from '../src/image';
import type { ImageReference } from '../src/image';

const run = (
  inputs: Record<string, unknown>,
  props: Record<string, unknown> = {}
): ImageReference => imageRef(inputs, props) as unknown as ImageReference;

const DIGEST = `sha256:${'a'.repeat(64)}`;

describe('image:ref', () => {
  describe('composing', () => {
    it('pins to the digest by default', () => {
      expect(
        run({
          registry: 'registry.internal:5000',
          repository: 'constructive/mantra',
          tag: 'v1',
          digest: DIGEST,
        })
      ).toEqual({
        ref: `registry.internal:5000/constructive/mantra@${DIGEST}`,
        registry: 'registry.internal:5000',
        repository: 'constructive/mantra',
        tag: 'v1',
        digest: DIGEST,
        immutable: true,
      });
    });

    it('emits the tag when asked to prefer it', () => {
      const result = run(
        { repository: 'constructive/mantra', tag: 'v1', digest: DIGEST },
        { prefer: 'tag' }
      );

      expect(result.ref).toBe('constructive/mantra:v1');
      expect(result.immutable).toBe(false);
    });

    it('falls back to the digest when there is no tag, even preferring tags', () => {
      const result = run({ repository: 'constructive/mantra', digest: DIGEST }, { prefer: 'tag' });

      expect(result.ref).toBe(`constructive/mantra@${DIGEST}`);
      expect(result.immutable).toBe(true);
    });

    it('applies defaultTag only when neither tag nor digest is known', () => {
      expect(run({ repository: 'constructive/mantra' }, { defaultTag: 'latest' }).ref).toBe(
        'constructive/mantra:latest'
      );
      expect(run({ repository: 'constructive/mantra', digest: DIGEST }, { defaultTag: 'latest' }).ref).toBe(
        `constructive/mantra@${DIGEST}`
      );
    });

    it('emits a bare repository when nothing pins it', () => {
      expect(run({ repository: 'nginx' })).toEqual({
        ref: 'nginx',
        registry: null,
        repository: 'nginx',
        tag: null,
        digest: null,
        immutable: false,
      });
    });
  });

  describe('splitting', () => {
    it('reads a registry with a port, a repository path and a digest', () => {
      expect(run({ ref: `localhost:5000/constructive/mantra@${DIGEST}` })).toEqual({
        ref: `localhost:5000/constructive/mantra@${DIGEST}`,
        registry: 'localhost:5000',
        repository: 'constructive/mantra',
        tag: null,
        digest: DIGEST,
        immutable: true,
      });
    });

    it('reads both tag and digest when a reference carries them', () => {
      const result = run({ ref: `ghcr.io/constructive/mantra:v1@${DIGEST}` });

      expect(result.tag).toBe('v1');
      expect(result.digest).toBe(DIGEST);
      expect(result.ref).toBe(`ghcr.io/constructive/mantra@${DIGEST}`);
    });

    it('treats a dotless first segment as repository, not registry', () => {
      const result = run({ ref: 'library/nginx:1.27-alpine' });

      expect(result.registry).toBeNull();
      expect(result.repository).toBe('library/nginx');
      expect(result.tag).toBe('1.27-alpine');
    });

    it('treats a dotted or ported first segment as a registry', () => {
      expect(run({ ref: 'foo.io/bar' }).registry).toBe('foo.io');
      expect(run({ ref: 'localhost:5000/bar' }).registry).toBe('localhost:5000');
      expect(run({ ref: 'localhost/bar' }).registry).toBe('localhost');
    });
  });

  describe('round-tripping', () => {
    const cases: Record<string, unknown>[] = [
      { repository: 'nginx' },
      { repository: 'library/nginx', tag: '1.27-alpine' },
      { registry: 'ghcr.io', repository: 'constructive/mantra', tag: 'v1' },
      { registry: 'localhost:5000', repository: 'constructive/mantra', digest: DIGEST },
      { registry: 'registry.internal:5000', repository: 'a/b/c', tag: 'v2', digest: DIGEST },
    ];

    it.each(cases)('parsing what it emitted yields the same parts (%j)', (parts) => {
      const composed = run(parts);
      const reparsed = run({ ref: composed.ref });

      expect(reparsed.ref).toBe(composed.ref);
      expect(reparsed.registry).toBe(composed.registry);
      expect(reparsed.repository).toBe(composed.repository);
      expect(reparsed.immutable).toBe(composed.immutable);
    });
  });

  describe('throws rather than softening', () => {
    it('when both a ref and parts are given', () => {
      expect(() => run({ ref: 'nginx', tag: 'v1' })).toThrow(/pass a reference to split, or parts/);
    });

    it('when neither a ref nor a repository is given', () => {
      expect(() => run({ tag: 'v1' })).toThrow(/nothing to work with/);
    });

    it('on a blank repository', () => {
      expect(() => run({ repository: '   ' })).toThrow(/"repository" is blank/);
    });

    it('on a malformed digest', () => {
      expect(() => run({ repository: 'nginx', digest: 'sha256:nope' })).toThrow(/malformed digest/);
    });

    it('on a short sha256 digest', () => {
      expect(() => run({ repository: 'nginx', digest: `sha256:${'a'.repeat(63)}` })).toThrow(
        /exactly 64 hex characters/
      );
    });

    it('on an illegal tag', () => {
      expect(() => run({ repository: 'nginx', tag: '-nope' })).toThrow(/illegal tag/);
    });

    it('on an illegal repository', () => {
      expect(() => run({ repository: 'Nginx/Bad' })).toThrow(/illegal repository/);
    });

    it('on a reference that ends at a separator', () => {
      expect(() => run({ ref: 'nginx@' })).toThrow(/no digest/);
      expect(() => run({ ref: 'nginx:' })).toThrow(/no tag/);
    });

    it('on an unknown prefer value', () => {
      expect(() => run({ repository: 'nginx' }, { prefer: 'whatever' })).toThrow(
        /"prefer" must be "digest" or "tag"/
      );
    });
  });
});
