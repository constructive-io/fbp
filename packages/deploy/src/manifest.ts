import type { InlineImplFn } from '@fbp/core';

/**
 * manifest:parse — the handler manifests found in a built image, in, one
 * function descriptor per registrable definition out.
 *
 * The deployment graph builds an image and then has to register what that image
 * serves. Writing the rows is a `runtime='sql'` node; *understanding* the
 * manifest set — expanding methods, deriving identity, defaulting, validating —
 * is pure computation, so it lives here where a database is not needed to test
 * it.
 *
 * The descriptor field names mirror `metaschema_private.register_function`'s
 * named arguments (as `fun register` maps them in
 * `compute/fun/cli/src/commands/register.ts`), so the SQL node downstream needs
 * no translation layer.
 */

const RUNTIMES = ['http', 'inline', 'handler', 'sql', 'resource', 'human'] as const;
const DELIVERIES = ['projected', 'lane'] as const;

export type FunctionRuntime = (typeof RUNTIMES)[number];

/** A secret or config a manifest declares, and how its value reaches the pod. */
export interface ManifestRequirement {
  name: string;
  required?: boolean;
  provider?: string;
  delivery?: 'projected' | 'lane';
  description?: string;
}

export interface FunctionDescriptor {
  module_scope: string;
  category: string;
  name: string;
  task_identifier: string;
  runtime: FunctionRuntime;
  /** Logical image name (the handler identity), never a registry/tag ref. */
  image: string | null;
  is_published: boolean;
  description: string | null;
  icon: string | null;
  inputs: unknown[];
  outputs: unknown[];
  props: unknown[];
  access_channels: string[];
  required_secrets: ManifestRequirement[];
  required_configs: ManifestRequirement[];
  required_buckets: string[];
  required_modules: string[];
  required_models: string[];
  volatile: boolean;
  system: boolean;
  protected: boolean;
  billable: boolean;
  /** Present only for `runtime='sql'`; the dispatch target and its bound args. */
  sql: SqlDispatch | null;
}

export type SqlDispatch =
  | {
      mode: 'direct';
      target_schema: string;
      target_function: string;
      payload_args: unknown[];
    }
  | {
      mode: 'module';
      module_table: string;
      function_columns: string[];
      payload_args: unknown[];
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A manifest field that must be a non-blank string when present.
 *
 * `null` for absent rather than `undefined` so a caller can distinguish
 * "declared blank" (which throws) from "not declared".
 */
const optionalString = (
  value: unknown,
  field: string,
  where: string
): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new Error(`manifest:parse: ${where}: "${field}" must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(
      `manifest:parse: ${where}: "${field}" is blank — omit it rather than declaring an empty value`
    );
  }
  return trimmed;
};

const optionalArray = (value: unknown, field: string, where: string): unknown[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`manifest:parse: ${where}: "${field}" must be an array`);
  }
  return value;
};

const stringArray = (value: unknown, field: string, where: string): string[] =>
  optionalArray(value, field, where).map((entry, index) => {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new Error(
        `manifest:parse: ${where}: "${field}[${index}]" must be a non-blank string`
      );
    }
    return entry.trim();
  });

const optionalBoolean = (
  value: unknown,
  field: string,
  where: string,
  fallback: boolean
): boolean => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'boolean') {
    throw new Error(`manifest:parse: ${where}: "${field}" must be a boolean`);
  }
  return value;
};

/**
 * The requirement declarations that become the definition's columns: the
 * projected ones.
 *
 * A `delivery: 'lane'` declaration is deliberately dropped — those values are
 * fetched by the workload over its gateway lane at the moment of use, so
 * registering them as projected requirements would gate the resource on a value
 * the scope's store will never hold (`register.ts` §projectedRequirements).
 */
const projectedRequirements = (
  value: unknown,
  field: string,
  where: string
): ManifestRequirement[] =>
  optionalArray(value, field, where)
    .map((entry, index): ManifestRequirement => {
      if (!isRecord(entry)) {
        throw new Error(`manifest:parse: ${where}: "${field}[${index}]" must be an object`);
      }
      const name = optionalString(entry.name, `${field}[${index}].name`, where);
      if (!name) {
        throw new Error(`manifest:parse: ${where}: "${field}[${index}]" has no name`);
      }
      const declaredDelivery = optionalString(entry.delivery, `${field}[${index}].delivery`, where);
      const delivery =
        declaredDelivery === null
          ? null
          : DELIVERIES.find((candidate) => candidate === declaredDelivery);
      if (delivery === undefined) {
        throw new Error(
          `manifest:parse: ${where}: "${field}[${index}].delivery" must be "projected" or "lane", got "${declaredDelivery}"`
        );
      }
      const requirement: ManifestRequirement = { name };
      if (typeof entry.required === 'boolean') requirement.required = entry.required;
      const provider = optionalString(entry.provider, `${field}[${index}].provider`, where);
      if (provider) requirement.provider = provider;
      if (delivery) requirement.delivery = delivery;
      const description = optionalString(
        entry.description,
        `${field}[${index}].description`,
        where
      );
      if (description) requirement.description = description;
      return requirement;
    })
    .filter((requirement) => requirement.delivery !== 'lane');

/**
 * One manifest per definition: a manifest that declares `methods` becomes one
 * entry per method, each inheriting what it does not state itself.
 *
 * The three lane fields (`image`, `accessChannels`, `route`) are inherited like
 * the rest but are per method by design: a feature's methods do not share one
 * lane — a page is a different container from the JSON methods beside it — so a
 * method that states its own image means it.
 */
const expandMethods = (
  manifest: Record<string, unknown>,
  where: string
): Record<string, unknown>[] => {
  const methods = manifest.methods;
  if (methods === undefined || methods === null) return [manifest];
  if (!Array.isArray(methods)) {
    throw new Error(`manifest:parse: ${where}: "methods" must be an array`);
  }
  if (methods.length === 0) return [manifest];

  return methods.map((method, index) => {
    if (!isRecord(method)) {
      throw new Error(`manifest:parse: ${where}: "methods[${index}]" must be an object`);
    }
    const merged: Record<string, unknown> = { ...manifest };
    delete merged.methods;
    for (const [key, value] of Object.entries(method)) {
      if (value !== undefined) merged[key] = value;
    }
    return merged;
  });
};

/**
 * `task_identifier` is a generated stored column (`category || ':' || name`), so
 * `category:name` is the one canonical identifier and a manifest whose declared
 * `taskIdentifier` disagrees with it is rejected rather than silently
 * re-derived.
 */
const deriveIdentity = (
  manifest: Record<string, unknown>,
  where: string
): { category: string; name: string; taskIdentifier: string } => {
  const declaredTaskIdentifier = optionalString(manifest.taskIdentifier, 'taskIdentifier', where);
  const manifestName = optionalString(manifest.name, 'name', where);
  const raw = declaredTaskIdentifier ?? manifestName;
  if (!raw) {
    throw new Error(
      `manifest:parse: ${where}: no "taskIdentifier" and no "name" — a definition cannot be identified`
    );
  }

  const [rawCategory, rawName] = raw.includes(':') ? raw.split(':') : [null, null];
  const category = optionalString(manifest.category, 'category', where) ?? rawCategory;
  const name = rawName ?? manifestName;
  if (!category || !name) {
    throw new Error(
      `manifest:parse: ${where}: cannot derive category and name from "${raw}" — declare "taskIdentifier" as "<category>:<name>"`
    );
  }

  const taskIdentifier = `${category}:${name}`;
  if (declaredTaskIdentifier && declaredTaskIdentifier !== taskIdentifier) {
    throw new Error(
      `manifest:parse: ${where}: taskIdentifier "${declaredTaskIdentifier}" must equal "<category>:<name>" ("${taskIdentifier}") — task_identifier is a generated column`
    );
  }
  return { category, name, taskIdentifier };
};

const readRuntime = (manifest: Record<string, unknown>, where: string): FunctionRuntime => {
  const declared = optionalString(manifest.runtime, 'runtime', where);
  if (declared === null) return 'http';
  const runtime = RUNTIMES.find((candidate) => candidate === declared);
  if (!runtime) {
    throw new Error(
      `manifest:parse: ${where}: unknown runtime "${declared}" (expected ${RUNTIMES.join(', ')})`
    );
  }
  return runtime;
};

/**
 * The logical image name, or null for the runtimes that have none.
 *
 * `inline`, `sql` and `human` are imageless by construction. `http` is served by
 * a Knative Service built from an image, so a missing one is a fault here rather
 * than a 404 at provision time. `handler` and `resource` may be imageless: the
 * platform's own handlers live in the worker.
 */
const readImage = (
  manifest: Record<string, unknown>,
  runtime: FunctionRuntime,
  fallback: string | null,
  where: string
): string | null => {
  const declared = optionalString(manifest.image, 'image', where);
  if (runtime === 'inline' || runtime === 'sql' || runtime === 'human') return null;
  const image = declared ?? fallback;
  if (!image && runtime === 'http') {
    throw new Error(
      `manifest:parse: ${where}: runtime "http" is served from an image — declare "image" in the manifest or pass the "image" prop`
    );
  }
  return image;
};

/**
 * The SQL dispatch target, in exactly one of its two modes.
 *
 * Mirrors the checks `fun register` makes: direct (`targetSchema` +
 * `targetFunction`) or module (`moduleTable` + `functionColumns`), never both,
 * never neither — the worker's SQL runtime names its target only from the
 * definition row, so an incomplete one dispatches nowhere.
 */
const readSqlDispatch = (
  manifest: Record<string, unknown>,
  where: string
): SqlDispatch => {
  const targetSchema = optionalString(manifest.targetSchema, 'targetSchema', where);
  const targetFunction = optionalString(manifest.targetFunction, 'targetFunction', where);
  const moduleTable = optionalString(manifest.moduleTable, 'moduleTable', where);
  const functionColumns = stringArray(manifest.functionColumns, 'functionColumns', where);
  const payloadArgs = optionalArray(manifest.payloadArgs, 'payloadArgs', where);

  const hasDirect = Boolean(targetSchema || targetFunction);
  const hasModule = Boolean(moduleTable || functionColumns.length);
  if (hasDirect && hasModule) {
    throw new Error(
      `manifest:parse: ${where}: runtime=sql must use either targetSchema/targetFunction or moduleTable/functionColumns, not both`
    );
  }
  if (hasModule) {
    if (!moduleTable || !functionColumns.length) {
      throw new Error(
        `manifest:parse: ${where}: runtime=sql module mode requires both moduleTable and non-empty functionColumns`
      );
    }
    return {
      mode: 'module',
      module_table: moduleTable,
      function_columns: functionColumns,
      payload_args: payloadArgs,
    };
  }
  if (!targetSchema || !targetFunction) {
    throw new Error(
      `manifest:parse: ${where}: runtime=sql requires targetSchema/targetFunction or moduleTable/functionColumns`
    );
  }
  return {
    mode: 'direct',
    target_schema: targetSchema,
    target_function: targetFunction,
    payload_args: payloadArgs,
  };
};

/**
 * Which scope owns the definition: the `scope` prop, always.
 *
 * A manifest describes the function; where a deployment registers it is the
 * deployment's, so the graph names it once and every descriptor in the run
 * carries it. Nothing defaults it — the scope decides which definitions plane
 * holds the row, so a guessed one registers a function nothing can resolve
 * while every step still reports success — and a manifest that states one is
 * refused rather than silently outranked.
 */
const readScope = (
  manifest: Record<string, unknown>,
  override: string | null,
  where: string
): string => {
  if ('scope' in manifest) {
    throw new Error(
      `manifest:parse: ${where}: states a "scope" — a manifest describes the function, and the scope belongs to the deployment; pass the "scope" prop instead`
    );
  }
  if (!override) {
    throw new Error(
      `manifest:parse: ${where}: no scope — pass the "scope" prop; a definition's scope decides which plane owns it and cannot be inferred`
    );
  }
  return override;
};

const toDescriptor = (
  manifest: Record<string, unknown>,
  scopeOverride: string | null,
  imageFallback: string | null,
  where: string
): FunctionDescriptor => {
  const { category, name, taskIdentifier } = deriveIdentity(manifest, where);
  const identified = `${where} ("${taskIdentifier}")`;
  const runtime = readRuntime(manifest, identified);
  const type = optionalString(manifest.type, 'type', identified);

  return {
    module_scope: readScope(manifest, scopeOverride, identified),
    category,
    name,
    task_identifier: taskIdentifier,
    runtime,
    image: readImage(manifest, runtime, imageFallback, identified),
    // An infrastructure handler is registered but not offered: publishing is the
    // manifest's `type`, not a separate flag.
    is_published: type !== 'infrastructure',
    description: optionalString(manifest.description, 'description', identified),
    icon: optionalString(manifest.icon, 'icon', identified),
    inputs: optionalArray(manifest.inputs, 'inputs', identified),
    outputs: optionalArray(manifest.outputs, 'outputs', identified),
    props: optionalArray(manifest.props, 'props', identified),
    access_channels: stringArray(manifest.accessChannels, 'accessChannels', identified),
    required_secrets: projectedRequirements(
      isRecord(manifest.requires) ? manifest.requires.secrets : undefined,
      'requires.secrets',
      identified
    ),
    required_configs: projectedRequirements(
      isRecord(manifest.requires) ? manifest.requires.configs : undefined,
      'requires.configs',
      identified
    ),
    required_buckets: stringArray(
      isRecord(manifest.requires) ? manifest.requires.buckets : undefined,
      'requires.buckets',
      identified
    ),
    required_modules: stringArray(
      isRecord(manifest.requires) ? manifest.requires.modules : undefined,
      'requires.modules',
      identified
    ),
    required_models: stringArray(
      isRecord(manifest.requires) ? manifest.requires.models : undefined,
      'requires.models',
      identified
    ),
    volatile: optionalBoolean(manifest.volatile, 'volatile', identified, false),
    system: optionalBoolean(manifest.system, 'system', identified, false),
    protected: optionalBoolean(manifest.protected, 'protected', identified, false),
    billable: optionalBoolean(manifest.billable, 'billable', identified, true),
    sql: runtime === 'sql' ? readSqlDispatch(manifest, identified) : null,
  };
};

export const manifestParse: InlineImplFn = (inputs, props) => {
  const manifests = inputs.manifests;
  if (!Array.isArray(manifests)) {
    throw new Error(
      'manifest:parse: "manifests" input must be an array of handler manifests'
    );
  }

  const scopeOverride = optionalString(props.scope, 'scope', 'props');
  const imageFallback = optionalString(props.image, 'image', 'props');

  const descriptors: FunctionDescriptor[] = [];
  const seen = new Map<string, string>();

  manifests.forEach((manifest, index) => {
    const where = `manifests[${index}]`;
    if (!isRecord(manifest)) {
      throw new Error(`manifest:parse: ${where} must be an object`);
    }
    for (const [methodIndex, expanded] of expandMethods(manifest, where).entries()) {
      const methodWhere =
        expanded === manifest ? where : `${where}.methods[${methodIndex}]`;
      const descriptor = toDescriptor(expanded, scopeOverride, imageFallback, methodWhere);
      const previous = seen.get(descriptor.task_identifier);
      if (previous !== undefined) {
        throw new Error(
          `manifest:parse: duplicate task identifier "${descriptor.task_identifier}" (${previous} and ${methodWhere}) — one image cannot register the same definition twice`
        );
      }
      seen.set(descriptor.task_identifier, methodWhere);
      descriptors.push(descriptor);
    }
  });

  // Discovery order, which is file order: the set a graph compares against is
  // the same on every run.
  return { descriptors, count: descriptors.length };
};
