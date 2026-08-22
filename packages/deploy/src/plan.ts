import type { InlineImplFn } from '@fbp/core';

/**
 * deploy:plan — the set a new image should serve against the set currently
 * deployed, in; what to provision, update, leave and prune, out.
 *
 * The node decides and never acts: `deployment:function_provision`,
 * `function_update` and `function_deprovision` do the work. Keeping the diff
 * here means the decision is inspectable before anything touches Kubernetes, and
 * testable without it.
 */

export interface DesiredEntry {
  task_identifier: string;
  runtime: string;
}

export interface ActualEntry {
  task_identifier: string;
  runtime: string;
  image_ref: string | null;
  function_definition_id: string;
}

export interface ProvisionEntry {
  task_identifier: string;
  runtime: string;
  image_ref: string;
}

export interface UpdateEntry {
  task_identifier: string;
  runtime: string;
  function_definition_id: string;
  from: string | null;
  to: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readField = (
  entry: Record<string, unknown>,
  field: string,
  where: string
): string => {
  const value = entry[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`deploy:plan: ${where} has no "${field}"`);
  }
  return value.trim();
};

const readEntries = <T>(
  value: unknown,
  list: string,
  read: (entry: Record<string, unknown>, where: string) => T,
  key: (entry: T) => string
): T[] => {
  if (!Array.isArray(value)) {
    throw new Error(`deploy:plan: "${list}" input must be an array`);
  }
  const seen = new Set<string>();
  return value.map((raw, index) => {
    const where = `${list}[${index}]`;
    if (!isRecord(raw)) {
      throw new Error(`deploy:plan: ${where} must be an object`);
    }
    const entry = read(raw, where);
    const identifier = key(entry);
    if (seen.has(identifier)) {
      throw new Error(
        `deploy:plan: duplicate task identifier "${identifier}" in "${list}" — a plan cannot act on the same definition twice`
      );
    }
    seen.add(identifier);
    return entry;
  });
};

const byTaskIdentifier = <T extends { task_identifier: string }>(entries: T[]): T[] =>
  [...entries].sort((left, right) => (left.task_identifier < right.task_identifier ? -1 : 1));

export const deployPlan: InlineImplFn = (inputs, props) => {
  const imageRef = typeof inputs.image_ref === 'string' ? inputs.image_ref.trim() : '';
  if (!imageRef) {
    throw new Error(
      'deploy:plan: "image_ref" input is required — a plan that does not say which image it deploys cannot be acted on'
    );
  }

  const desired = readEntries<DesiredEntry>(
    inputs.desired,
    'desired',
    (entry, where) => ({
      task_identifier: readField(entry, 'task_identifier', where),
      runtime: readField(entry, 'runtime', where),
    }),
    (entry) => entry.task_identifier
  );

  const actual = readEntries<ActualEntry>(
    inputs.actual,
    'actual',
    (entry, where) => ({
      task_identifier: readField(entry, 'task_identifier', where),
      runtime: readField(entry, 'runtime', where),
      // A registered-but-never-deployed definition has no ref yet; that is an
      // update to the new one, not a fault.
      image_ref: typeof entry.image_ref === 'string' && entry.image_ref.trim()
        ? entry.image_ref.trim()
        : null,
      function_definition_id: readField(entry, 'function_definition_id', where),
    }),
    (entry) => entry.task_identifier
  );

  if (props.prune !== undefined && props.prune !== null && typeof props.prune !== 'boolean') {
    throw new Error('deploy:plan: "prune" prop must be a boolean');
  }
  const prune = props.prune === true;

  const actualByTask = new Map(actual.map((entry) => [entry.task_identifier, entry]));
  const desiredTasks = new Set(desired.map((entry) => entry.task_identifier));

  const provision: ProvisionEntry[] = [];
  const update: UpdateEntry[] = [];
  const unchanged: ActualEntry[] = [];

  for (const entry of desired) {
    const current = actualByTask.get(entry.task_identifier);
    if (!current) {
      provision.push({
        task_identifier: entry.task_identifier,
        runtime: entry.runtime,
        image_ref: imageRef,
      });
      continue;
    }
    // A changed runtime changes dispatch shape entirely — an inline node
    // becoming an HTTP one is not the same function served differently, and
    // rolling it out as an update would leave a definition nothing can serve.
    if (current.runtime !== entry.runtime) {
      throw new Error(
        `deploy:plan: "${entry.task_identifier}" changes runtime from "${current.runtime}" to "${entry.runtime}" — a runtime change is a re-registration, not a deployment update`
      );
    }
    if (current.image_ref === imageRef) {
      unchanged.push(current);
      continue;
    }
    update.push({
      task_identifier: entry.task_identifier,
      runtime: entry.runtime,
      function_definition_id: current.function_definition_id,
      from: current.image_ref,
      to: imageRef,
    });
  }

  // Deleting a running function is opt-in: an image built from a branch that
  // happens not to contain a handler is the common case, and pruning by default
  // would take it down.
  const surplus = actual.filter((entry) => !desiredTasks.has(entry.task_identifier));

  return {
    provision: byTaskIdentifier(provision),
    update: byTaskIdentifier(update),
    unchanged: byTaskIdentifier(unchanged),
    deprovision: prune ? byTaskIdentifier(surplus) : [],
    orphaned: prune ? [] : byTaskIdentifier(surplus),
    changed: provision.length > 0 || update.length > 0 || (prune && surplus.length > 0),
  };
};
