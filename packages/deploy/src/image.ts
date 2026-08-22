import type { InlineImplFn } from '@fbp/core';

/**
 * image:ref — image parts in, one canonical reference out; or one reference in,
 * its parts out.
 *
 * `build:image` reports `repository`, `tag` and `digest` separately;
 * `deployment:function_provision` wants a single reference, pinned to the digest
 * so what was tested is what runs. That is string surgery with a few traps in it
 * (is `foo/bar`'s first segment a registry? no — `foo.io/bar`'s is), which is
 * exactly the kind of thing that should not be reimplemented inside three
 * handlers.
 *
 * Strings only: this node never talks to a registry.
 */

/** `sha256:<64 hex>`, and the same shape for any other named algorithm. */
const DIGEST = /^[a-z0-9]+(?:[.+_-][a-z0-9]+)*:[a-f0-9]{32,}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const TAG = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;
const PATH_SEGMENT = /^[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*$/;
const HOST = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(?::[0-9]+)?$/;

export interface ImageReference {
  ref: string;
  registry: string | null;
  repository: string;
  tag: string | null;
  digest: string | null;
  immutable: boolean;
}

const readString = (value: unknown, field: string): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new Error(`image:ref: "${field}" must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`image:ref: "${field}" is blank — omit it rather than passing an empty value`);
  }
  return trimmed;
};

const assertDigest = (digest: string): string => {
  if (!DIGEST.test(digest)) {
    throw new Error(
      `image:ref: malformed digest "${digest}" — expected "<algorithm>:<hex>", e.g. "sha256:<64 hex>"`
    );
  }
  if (digest.startsWith('sha256:') && !SHA256.test(digest)) {
    throw new Error(
      `image:ref: malformed digest "${digest}" — sha256 digests are exactly 64 hex characters`
    );
  }
  return digest;
};

const assertTag = (tag: string): string => {
  if (!TAG.test(tag)) {
    throw new Error(
      `image:ref: illegal tag "${tag}" — tags start with an alphanumeric or underscore and may contain only letters, digits, ".", "_" and "-"`
    );
  }
  return tag;
};

const assertRepository = (repository: string): string => {
  const segments = repository.split('/');
  for (const segment of segments) {
    if (!PATH_SEGMENT.test(segment)) {
      throw new Error(
        `image:ref: illegal repository "${repository}" — path segments are lowercase alphanumerics with single ".", "_" or "-" separators`
      );
    }
  }
  return repository;
};

const assertRegistry = (registry: string): string => {
  if (!HOST.test(registry) || !looksLikeHost(registry)) {
    throw new Error(
      `image:ref: illegal registry "${registry}" — expected a host with a dot, a port, or "localhost"`
    );
  }
  return registry;
};

/**
 * Whether a leading segment is a registry host rather than the first part of the
 * repository path.
 *
 * The distinction the OCI reference grammar draws: a dot, a port, or the literal
 * `localhost`. Without it `library/nginx` would be read as registry `library`.
 */
const looksLikeHost = (segment: string): boolean =>
  segment.includes('.') || segment.includes(':') || segment === 'localhost';

/** Split a reference into its parts, without validating them. */
const splitRef = (
  ref: string
): { registry: string | null; repository: string; tag: string | null; digest: string | null } => {
  let rest = ref;
  let digest: string | null = null;
  let tag: string | null = null;

  const atIndex = rest.indexOf('@');
  if (atIndex !== -1) {
    digest = rest.slice(atIndex + 1);
    rest = rest.slice(0, atIndex);
    if (!digest) {
      throw new Error(`image:ref: reference "${ref}" ends at "@" with no digest`);
    }
  }

  const slashIndex = rest.indexOf('/');
  const firstSegment = slashIndex === -1 ? rest : rest.slice(0, slashIndex);
  const registry = slashIndex !== -1 && looksLikeHost(firstSegment) ? firstSegment : null;
  let remainder = registry === null ? rest : rest.slice(slashIndex + 1);

  // A colon after the last slash is a tag; a colon before one is the registry's
  // port, which has already been split off above.
  const colonIndex = remainder.lastIndexOf(':');
  if (colonIndex !== -1 && !remainder.slice(colonIndex).includes('/')) {
    tag = remainder.slice(colonIndex + 1);
    remainder = remainder.slice(0, colonIndex);
    if (!tag) {
      throw new Error(`image:ref: reference "${ref}" ends at ":" with no tag`);
    }
  }

  if (!remainder) {
    throw new Error(`image:ref: reference "${ref}" has no repository`);
  }
  return { registry, repository: remainder, tag, digest };
};

/**
 * Compose the canonical `[registry/]repository[@digest | :tag]`.
 *
 * A digest wins by default: a deployment that resolves a tag twice can get two
 * different images, which is the failure mode this node exists to remove.
 */
const compose = (
  parts: { registry: string | null; repository: string; tag: string | null; digest: string | null },
  prefer: 'digest' | 'tag'
): ImageReference => {
  const base = parts.registry ? `${parts.registry}/${parts.repository}` : parts.repository;
  const pinToDigest = parts.digest !== null && (prefer === 'digest' || parts.tag === null);

  if (pinToDigest && parts.digest !== null) {
    return { ...parts, ref: `${base}@${parts.digest}`, immutable: true };
  }
  if (parts.tag !== null) {
    return { ...parts, ref: `${base}:${parts.tag}`, immutable: false };
  }
  // Neither: a bare repository, which round-trips as itself. What the registry
  // resolves it to is the registry's business, not this node's.
  return { ...parts, ref: base, immutable: false };
};

export const imageRef: InlineImplFn = (inputs, props) => {
  const ref = readString(inputs.ref, 'ref');
  const registry = readString(inputs.registry, 'registry');
  const repository = readString(inputs.repository, 'repository');
  const tag = readString(inputs.tag, 'tag');
  const digest = readString(inputs.digest, 'digest');

  const declaredParts = [
    ['registry', registry],
    ['repository', repository],
    ['tag', tag],
    ['digest', digest],
  ].filter((entry): entry is [string, string] => entry[1] !== null);

  if (ref !== null && declaredParts.length > 0) {
    throw new Error(
      `image:ref: "ref" was given alongside ${declaredParts
        .map(([field]) => `"${field}"`)
        .join(', ')} — pass a reference to split, or parts to compose, not both`
    );
  }
  if (ref === null && repository === null) {
    throw new Error(
      'image:ref: nothing to work with — pass "ref" to split a reference, or at least "repository" to compose one'
    );
  }

  const preferProp = readString(props.prefer, 'prefer') ?? 'digest';
  if (preferProp !== 'digest' && preferProp !== 'tag') {
    throw new Error(`image:ref: "prefer" must be "digest" or "tag", got "${preferProp}"`);
  }
  const defaultTag = readString(props.defaultTag, 'defaultTag');

  const parts = ref !== null ? splitRef(ref) : { registry, repository: repository ?? '', tag, digest };

  const validated = {
    registry: parts.registry === null ? null : assertRegistry(parts.registry),
    repository: assertRepository(parts.repository),
    tag: parts.tag === null ? null : assertTag(parts.tag),
    digest: parts.digest === null ? null : assertDigest(parts.digest),
  };

  // `defaultTag` fills in only where the caller knows neither, so it can never
  // override a pin.
  const resolved =
    validated.tag === null && validated.digest === null && defaultTag !== null
      ? { ...validated, tag: assertTag(defaultTag) }
      : validated;

  return { ...compose(resolved, preferProp) };
};
