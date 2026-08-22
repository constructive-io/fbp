import { manifestParse } from '../src/manifest';
import type { FunctionDescriptor } from '../src/manifest';

const parse = (
  manifests: unknown[],
  props: Record<string, unknown> = { scope: 'platform' }
): { descriptors: FunctionDescriptor[]; count: number } => {
  const result = manifestParse({ manifests }, props) as {
    descriptors: FunctionDescriptor[];
    count: number;
  };
  return result;
};

// The real thing: functions/build/handlers/image/handler.json, trimmed.
const buildImage = {
  name: 'build-image',
  version: '0.1.0',
  type: 'node-resource',
  image: 'functions/build-image',
  runtime: 'resource',
  taskIdentifier: 'build:image',
  description: 'Build the repository at the build commit and push the image',
  requires: {
    configs: [{ name: 'BUILDKIT_HOST', required: true }],
    secrets: [
      { name: 'REGISTRY_PASSWORD', required: false },
      { name: 'PROVIDER_TOKEN', required: true, delivery: 'lane' },
    ],
    buckets: ['builds'],
  },
  inputs: [{ name: 'dockerfile', type: 'string' }],
  outputs: [{ name: 'image_ref', type: 'string' }],
};

describe('manifest:parse', () => {
  it('normalises a real manifest into a registrable descriptor', () => {
    const { descriptors, count } = parse([buildImage]);

    expect(count).toBe(1);
    expect(descriptors[0]).toMatchObject({
      module_scope: 'platform',
      category: 'build',
      name: 'image',
      task_identifier: 'build:image',
      runtime: 'resource',
      image: 'functions/build-image',
      is_published: true,
      required_configs: [{ name: 'BUILDKIT_HOST', required: true }],
      required_buckets: ['builds'],
      inputs: [{ name: 'dockerfile', type: 'string' }],
      sql: null,
    });
  });

  it('drops lane-delivered requirements and keeps projected ones', () => {
    const { descriptors } = parse([buildImage]);

    expect(descriptors[0].required_secrets).toEqual([
      { name: 'REGISTRY_PASSWORD', required: false },
    ]);
  });

  it('expands one image with many methods into one descriptor each', () => {
    const mantra = {
      name: 'mantra',
      version: '0.1.0',
      type: 'node-http',
      image: 'functions/mantra',
      runtime: 'http',
      accessChannels: ['page'],
      methods: [
        { taskIdentifier: 'mantra:signin', description: 'sign in page' },
        { taskIdentifier: 'mantra:signout' },
        { taskIdentifier: 'mantra:robots_txt', accessChannels: ['page', 'sync'] },
      ],
    };

    const { descriptors, count } = parse([mantra]);

    expect(count).toBe(3);
    expect(descriptors.map((d) => d.task_identifier)).toEqual([
      'mantra:signin',
      'mantra:signout',
      'mantra:robots_txt',
    ]);
    // Inherited from the image manifest…
    expect(descriptors[1]).toMatchObject({
      image: 'functions/mantra',
      runtime: 'http',
      access_channels: ['page'],
      description: null,
    });
    // …except what the method states itself.
    expect(descriptors[0].description).toBe('sign in page');
    expect(descriptors[2].access_channels).toEqual(['page', 'sync']);
  });

  it('registers an infrastructure handler unpublished', () => {
    const { descriptors } = parse([
      { name: 'confirm', type: 'infrastructure', runtime: 'handler', taskIdentifier: 'infra:confirm' },
    ]);

    expect(descriptors[0].is_published).toBe(false);
  });

  it('reads the sql dispatch target in direct mode', () => {
    const { descriptors } = parse([
      {
        name: 'install-bindings',
        type: 'node-sql',
        runtime: 'sql',
        taskIdentifier: 'routes:install_bindings',
        targetSchema: 'function_resolution',
        targetFunction: 'install_mantra',
        payloadArgs: [{ name: 'site_id', type: 'uuid' }],
      },
    ]);

    expect(descriptors[0].sql).toEqual({
      mode: 'direct',
      target_schema: 'function_resolution',
      target_function: 'install_mantra',
      payload_args: [{ name: 'site_id', type: 'uuid' }],
    });
    // sql dispatch is imageless by construction.
    expect(descriptors[0].image).toBeNull();
  });

  it('reads the sql dispatch target in module mode', () => {
    const { descriptors } = parse([
      {
        name: 'rollup',
        type: 'node-sql',
        runtime: 'sql',
        taskIdentifier: 'usage:rollup',
        moduleTable: 'usage_summary',
        functionColumns: ['rollup_function'],
      },
    ]);

    expect(descriptors[0].sql).toEqual({
      mode: 'module',
      module_table: 'usage_summary',
      function_columns: ['rollup_function'],
      payload_args: [],
    });
  });

  it('is idempotent — the same input twice gives identical output', () => {
    expect(parse([buildImage])).toEqual(parse([buildImage]));
  });

  it('keeps discovery order', () => {
    const { descriptors } = parse([
      { name: 'b', type: 'node', runtime: 'inline', taskIdentifier: 'x:b' },
      { name: 'a', type: 'node', runtime: 'inline', taskIdentifier: 'x:a' },
    ]);

    expect(descriptors.map((d) => d.task_identifier)).toEqual(['x:b', 'x:a']);
  });

  describe('throws rather than softening', () => {
    it('on a non-array manifests input', () => {
      expect(() => manifestParse({ manifests: null }, { scope: 'platform' })).toThrow(
        /"manifests" input must be an array/
      );
    });

    it('on a manifest that is not an object', () => {
      expect(() => parse(['nope'])).toThrow(/manifests\[0\] must be an object/);
    });

    it('on a missing scope, rather than defaulting one', () => {
      expect(() => parse([{ name: 'x', type: 'node', taskIdentifier: 'a:b' }], {})).toThrow(
        /no scope/
      );
    });

    it('on a manifest that states a scope, rather than letting the prop outrank it', () => {
      expect(() =>
        parse([{ name: 'x', type: 'node', taskIdentifier: 'a:b', scope: 'platform' }])
      ).toThrow(/states a "scope"/);
    });

    it('on a blank task identifier', () => {
      expect(() => parse([{ name: 'x', type: 'node', taskIdentifier: '   ' }])).toThrow(
        /"taskIdentifier" is blank/
      );
    });

    it('on a manifest that can be identified by neither taskIdentifier nor name', () => {
      expect(() => parse([{ type: 'node' }])).toThrow(/cannot be identified/);
    });

    it('on a taskIdentifier that disagrees with category:name', () => {
      expect(() =>
        parse([{ name: 'signin', type: 'node', category: 'mantra', taskIdentifier: 'auth:signin' }])
      ).toThrow(/must equal "<category>:<name>"/);
    });

    it('on an unknown runtime', () => {
      expect(() =>
        parse([{ name: 'x', type: 'node', taskIdentifier: 'a:b', runtime: 'lambda' }])
      ).toThrow(/unknown runtime "lambda"/);
    });

    it('on an http manifest with no image anywhere', () => {
      expect(() =>
        parse([{ name: 'x', type: 'node', taskIdentifier: 'a:b', runtime: 'http' }])
      ).toThrow(/runtime "http" is served from an image/);
    });

    it('on a duplicate task identifier across manifests', () => {
      expect(() =>
        parse([
          { name: 'x', type: 'node', runtime: 'inline', taskIdentifier: 'a:b' },
          { name: 'y', type: 'node', runtime: 'inline', taskIdentifier: 'a:b' },
        ])
      ).toThrow(/duplicate task identifier "a:b"/);
    });

    it('on a duplicate task identifier across methods of one image', () => {
      expect(() =>
        parse([
          {
            name: 'mantra',
            type: 'node',
            runtime: 'inline',
            methods: [{ taskIdentifier: 'm:a' }, { taskIdentifier: 'm:a' }],
          },
        ])
      ).toThrow(/duplicate task identifier "m:a"/);
    });

    it('on a sql manifest declaring both dispatch modes', () => {
      expect(() =>
        parse([
          {
            name: 'x',
            type: 'node',
            runtime: 'sql',
            taskIdentifier: 'a:b',
            targetSchema: 's',
            targetFunction: 'f',
            moduleTable: 't',
            functionColumns: ['c'],
          },
        ])
      ).toThrow(/not both/);
    });

    it('on a sql manifest declaring neither dispatch mode', () => {
      expect(() =>
        parse([{ name: 'x', type: 'node', runtime: 'sql', taskIdentifier: 'a:b' }])
      ).toThrow(/requires targetSchema\/targetFunction or moduleTable\/functionColumns/);
    });

    it('on a sql module manifest missing its columns', () => {
      expect(() =>
        parse([
          { name: 'x', type: 'node', runtime: 'sql', taskIdentifier: 'a:b', moduleTable: 't' },
        ])
      ).toThrow(/requires both moduleTable and non-empty functionColumns/);
    });

    it('on a malformed requirement declaration', () => {
      expect(() =>
        parse([
          {
            name: 'x',
            type: 'node',
            runtime: 'inline',
            taskIdentifier: 'a:b',
            requires: { configs: [{ required: true }] },
          },
        ])
      ).toThrow(/has no name/);
    });

    it('on an unknown requirement delivery mode', () => {
      expect(() =>
        parse([
          {
            name: 'x',
            type: 'node',
            runtime: 'inline',
            taskIdentifier: 'a:b',
            requires: { secrets: [{ name: 'K', delivery: 'carrier-pigeon' }] },
          },
        ])
      ).toThrow(/must be "projected" or "lane"/);
    });

    it('on a non-array field where an array is required', () => {
      expect(() =>
        parse([{ name: 'x', type: 'node', runtime: 'inline', taskIdentifier: 'a:b', inputs: {} }])
      ).toThrow(/"inputs" must be an array/);
    });
  });
});
