import { deployPlan } from '../src/plan';

const NEW_REF = 'ghcr.io/constructive/mantra@sha256:' + 'a'.repeat(64);
const OLD_REF = 'ghcr.io/constructive/mantra@sha256:' + 'b'.repeat(64);

interface Plan {
  provision: { task_identifier: string }[];
  update: { task_identifier: string; from: string | null; to: string }[];
  unchanged: { task_identifier: string }[];
  deprovision: { task_identifier: string }[];
  orphaned: { task_identifier: string }[];
  changed: boolean;
}

const plan = (
  desired: unknown[],
  actual: unknown[],
  props: Record<string, unknown> = {},
  imageRef: unknown = NEW_REF
): Plan => deployPlan({ desired, actual, image_ref: imageRef }, props) as unknown as Plan;

const desired = (taskIdentifier: string, runtime = 'http') => ({
  task_identifier: taskIdentifier,
  runtime,
});

const actual = (
  taskIdentifier: string,
  imageRefValue: string | null,
  runtime = 'http'
) => ({
  task_identifier: taskIdentifier,
  runtime,
  image_ref: imageRefValue,
  function_definition_id: `def-${taskIdentifier}`,
});

const identifiers = (entries: { task_identifier: string }[]): string[] =>
  entries.map((entry) => entry.task_identifier);

describe('deploy:plan', () => {
  it('provisions everything on a first deploy', () => {
    const result = plan([desired('mantra:signin'), desired('mantra:signout')], []);

    expect(identifiers(result.provision)).toEqual(['mantra:signin', 'mantra:signout']);
    expect(result.update).toEqual([]);
    expect(result.changed).toBe(true);
  });

  it('updates only what moved to a different image ref', () => {
    const result = plan(
      [desired('mantra:signin'), desired('mantra:signout')],
      [actual('mantra:signin', OLD_REF), actual('mantra:signout', NEW_REF)]
    );

    expect(result.update).toEqual([
      {
        task_identifier: 'mantra:signin',
        runtime: 'http',
        function_definition_id: 'def-mantra:signin',
        from: OLD_REF,
        to: NEW_REF,
      },
    ]);
    expect(identifiers(result.unchanged)).toEqual(['mantra:signout']);
    expect(result.provision).toEqual([]);
  });

  it('treats a registered-but-undeployed definition as an update', () => {
    const result = plan([desired('mantra:signin')], [actual('mantra:signin', null)]);

    expect(result.update[0].from).toBeNull();
    expect(result.update[0].to).toBe(NEW_REF);
  });

  it('reports nothing to do as unchanged and not changed', () => {
    const result = plan([desired('mantra:signin')], [actual('mantra:signin', NEW_REF)]);

    expect(identifiers(result.unchanged)).toEqual(['mantra:signin']);
    expect(result.changed).toBe(false);
  });

  it('orphans surplus functions by default and prunes only when asked', () => {
    const withoutPrune = plan([desired('a:one')], [actual('a:one', NEW_REF), actual('a:gone', NEW_REF)]);

    expect(identifiers(withoutPrune.orphaned)).toEqual(['a:gone']);
    expect(withoutPrune.deprovision).toEqual([]);
    // A surplus function left running is not a change to make.
    expect(withoutPrune.changed).toBe(false);

    const withPrune = plan(
      [desired('a:one')],
      [actual('a:one', NEW_REF), actual('a:gone', NEW_REF)],
      { prune: true }
    );

    expect(identifiers(withPrune.deprovision)).toEqual(['a:gone']);
    expect(withPrune.orphaned).toEqual([]);
    expect(withPrune.changed).toBe(true);
  });

  it('plans every actual entry for removal when the desired set is empty', () => {
    const result = plan([], [actual('a:one', NEW_REF)], { prune: true });

    expect(identifiers(result.deprovision)).toEqual(['a:one']);
    expect(result.provision).toEqual([]);
  });

  it('partitions its inputs exactly', () => {
    const desiredSet = [desired('z:new'), desired('m:moved'), desired('a:same')];
    const actualSet = [
      actual('m:moved', OLD_REF),
      actual('a:same', NEW_REF),
      actual('q:surplus', NEW_REF),
    ];

    for (const prune of [false, true]) {
      const result = plan(desiredSet, actualSet, { prune });

      const desiredCovered = [
        ...identifiers(result.provision),
        ...identifiers(result.update),
        ...identifiers(result.unchanged),
      ];
      expect(desiredCovered.sort()).toEqual(identifiers(desiredSet).sort());
      // No entry lands in two buckets.
      expect(new Set(desiredCovered).size).toBe(desiredCovered.length);

      const actualOnly = [...identifiers(result.deprovision), ...identifiers(result.orphaned)];
      expect(actualOnly).toEqual(['q:surplus']);
    }
  });

  it('sorts every bucket by task identifier', () => {
    const result = plan([desired('z:last'), desired('a:first'), desired('m:middle')], []);

    expect(identifiers(result.provision)).toEqual(['a:first', 'm:middle', 'z:last']);
  });

  describe('throws rather than softening', () => {
    it('on a runtime change', () => {
      expect(() =>
        plan([desired('a:one', 'http')], [actual('a:one', OLD_REF, 'inline')])
      ).toThrow(/changes runtime from "inline" to "http"/);
    });

    it('on a blank image ref', () => {
      expect(() => plan([desired('a:one')], [], {}, '  ')).toThrow(/"image_ref" input is required/);
    });

    it('on a non-array desired or actual input', () => {
      expect(() => deployPlan({ desired: null, actual: [], image_ref: NEW_REF }, {})).toThrow(
        /"desired" input must be an array/
      );
      expect(() => deployPlan({ desired: [], actual: 'nope', image_ref: NEW_REF }, {})).toThrow(
        /"actual" input must be an array/
      );
    });

    it('on a duplicate task identifier within a list', () => {
      expect(() => plan([desired('a:one'), desired('a:one')], [])).toThrow(
        /duplicate task identifier "a:one" in "desired"/
      );
    });

    it('on a desired entry with no task identifier', () => {
      expect(() => plan([{ runtime: 'http' }], [])).toThrow(/desired\[0\] has no "task_identifier"/);
    });

    it('on an actual entry with no function definition id', () => {
      expect(() =>
        plan([], [{ task_identifier: 'a:one', runtime: 'http', image_ref: NEW_REF }])
      ).toThrow(/actual\[0\] has no "function_definition_id"/);
    });

    it('on a non-boolean prune prop', () => {
      expect(() => plan([], [], { prune: 'yes' })).toThrow(/"prune" prop must be a boolean/);
    });
  });
});
