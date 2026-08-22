import type { InlineAdapter, InlineImplFn } from '@fbp/core';

/**
 * flow:guard — let the flow continue, or divert it, on one condition.
 *
 * Only the arm that was taken is present in the output. A declared port absent
 * from a completed node's output is a branch not taken: the tick leaves
 * everything downstream of it unready and never dispatches it. Emitting both
 * ports — even with falsy values — is what makes both arms run.
 */
const flowGuard: InlineImplFn = (inputs) => {
  if (inputs.ok) {
    return { pass: true };
  }
  return {
    fail: true,
    error: inputs.error || { message: 'Guard condition failed' },
  };
};

const coerce: InlineImplFn = (inputs, props) => {
  const targetType = String(props.type ?? 'string');
  const val = inputs.value;
  switch (targetType) {
  case 'number': return { value: Number(val) };
  case 'boolean': return { value: Boolean(val) };
  case 'string': return { value: String(val ?? '') };
  case 'json': return { value: typeof val === 'string' ? JSON.parse(val) : val };
  default: return { value: val };
  }
};

type Comparison = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'truthy' | 'empty' | 'contains';

const COMPARISONS: Comparison[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'truthy', 'empty', 'contains'];

const compare = (value: unknown, operator: Comparison, expected: unknown): boolean => {
  switch (operator) {
  case 'eq': return value === expected;
  case 'neq': return value !== expected;
  case 'gt': return Number(value) > Number(expected);
  case 'gte': return Number(value) >= Number(expected);
  case 'lt': return Number(value) < Number(expected);
  case 'lte': return Number(value) <= Number(expected);
  case 'truthy': return Boolean(value);
  case 'empty':
    if (value === null || value === undefined) return true;
    if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  case 'contains':
    if (Array.isArray(value)) return value.includes(expected);
    return String(value ?? '').includes(String(expected ?? ''));
  }
};

/**
 * flow:branch — route a value down one of two paths by a declared predicate.
 *
 * The predicate is an operator plus an expected value, never an expression to
 * evaluate: a graph definition is data, and data that gets executed is a
 * remote-code-execution surface.
 *
 * Only the taken port is emitted, which is what makes the branch a branch: the
 * tick treats a declared port absent from a completed output as a path not
 * taken and never dispatches downstream of it. `matched` always carries the
 * verdict, so a node wired to it sees the decision without being on an arm —
 * and a downstream node can still distinguish "not taken" from "taken with a
 * null value", because the untaken port is absent rather than null.
 */
const flowBranch: InlineImplFn = (inputs, props) => {
  const operator = String(props.operator ?? 'truthy') as Comparison;
  if (!COMPARISONS.includes(operator)) {
    throw new Error(`flow:branch: unknown operator "${operator}" (expected one of ${COMPARISONS.join(', ')})`);
  }
  const expected = 'expected' in inputs ? inputs.expected : props.expected;
  const matched = compare(inputs.value, operator, expected);
  return matched
    ? { matched, true: inputs.value }
    : { matched, false: inputs.value };
};

/** The number of case ports flow:switch declares. */
const SWITCH_CASE_PORTS = 6;

type SwitchCase = { operator?: string; expected?: unknown };

/**
 * flow:switch — route a value to one of N declared paths, or to `default`.
 *
 * Cases are ordered and the first match wins, so overlapping predicates are
 * resolved by position rather than by an error. Case `i` emits on port
 * `case_<i>`; ports are declared up front and fixed in number because a port a
 * graph cannot name at design time is a port nothing can be wired to. Like
 * flow:branch, exactly one port carries a value and the rest are absent, and
 * `matched_case` always names the winner for anything that needs the decision
 * without sitting on an arm.
 */
const flowSwitch: InlineImplFn = (inputs, props) => {
  const rawCases = props.cases ?? [];
  if (!Array.isArray(rawCases)) {
    throw new Error('flow:switch: props.cases must be an array of { operator, expected }');
  }
  if (rawCases.length > SWITCH_CASE_PORTS) {
    throw new Error(`flow:switch: ${rawCases.length} cases exceeds the ${SWITCH_CASE_PORTS} declared case ports`);
  }
  const fallbackOperator = String(props.operator ?? 'eq');
  const cases = rawCases as SwitchCase[];

  for (let i = 0; i < cases.length; i++) {
    const branchCase = cases[i];
    if (branchCase === null || typeof branchCase !== 'object') {
      throw new Error(`flow:switch: case ${i} must be an object of { operator, expected }`);
    }
    const operator = String(branchCase.operator ?? fallbackOperator) as Comparison;
    if (!COMPARISONS.includes(operator)) {
      throw new Error(`flow:switch: case ${i} has unknown operator "${operator}" (expected one of ${COMPARISONS.join(', ')})`);
    }
    if (compare(inputs.value, operator, branchCase.expected)) {
      return { matched_case: String(i), [`case_${i}`]: inputs.value };
    }
  }
  return { matched_case: 'default', default: inputs.value };
};

/**
 * flow:merge — rejoin two branch arms into one path.
 *
 * The counterpart of a lazy branch: both inputs are optional, so the tick
 * dispatches this node once the arm that was taken arrives and skips the edge
 * whose source completed without its port. `source` names the arm that won, so
 * a graph can tell which path produced the value it is now carrying. `a` wins a
 * tie, which only happens when the two inputs are not exclusive arms at all.
 */
const flowMerge: InlineImplFn = (inputs) => {
  if (inputs.a !== undefined) {
    return { value: inputs.a, source: 'a' };
  }
  if (inputs.b !== undefined) {
    return { value: inputs.b, source: 'b' };
  }
  throw new Error('flow:merge: neither input arrived — nothing to merge');
};

/** Read a dot-path out of one collection element, for the nodes that key on a field. */
const selectPath = (item: unknown, path: string): unknown => {
  if (path === '') return item;
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc === null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[segment];
  }, item);
};

const requireArray = (node: string, items: unknown): unknown[] => {
  if (!Array.isArray(items)) {
    throw new Error(`${node}: items must be an array (received ${items === null ? 'null' : typeof items})`);
  }
  return items;
};

/**
 * flow:filter — narrow a collection by the same declared predicate a branch uses.
 *
 * The interesting ports are the lazy ones. `items` carries the survivors and is
 * absent when nothing survived, and `empty` is present only in that case, so a
 * graph never runs the work downstream of a filter on an empty batch and never
 * has to test the length itself: "there is something to do" and "there is
 * nothing to do" are two paths, exactly as they are out of flow:branch.
 * `dropped` is absent rather than empty for the same reason — a rejects lane
 * only runs when there are rejects. The two counts are always emitted, because
 * a node wired to a count wants the number, not a path.
 *
 * `path` compares a field of each element rather than the element, which is what
 * makes the predicate usable on rows: `{ path: 'conclusion', operator: 'eq',
 * expected: 'success' }` filters a list of checks without a per-item node.
 */
const flowFilter: InlineImplFn = (inputs, props) => {
  const operator = String(props.operator ?? 'truthy') as Comparison;
  if (!COMPARISONS.includes(operator)) {
    throw new Error(`flow:filter: unknown operator "${operator}" (expected one of ${COMPARISONS.join(', ')})`);
  }
  const items = requireArray('flow:filter', inputs.items);
  const path = String(props.path ?? '');
  const expected = 'expected' in inputs ? inputs.expected : props.expected;

  const kept: unknown[] = [];
  const dropped: unknown[] = [];
  for (const item of items) {
    if (compare(selectPath(item, path), operator, expected)) {
      kept.push(item);
    } else {
      dropped.push(item);
    }
  }

  const outputs: Record<string, unknown> = {
    kept_count: kept.length,
    dropped_count: dropped.length,
  };
  if (kept.length > 0) outputs.items = kept;
  else outputs.empty = true;
  if (dropped.length > 0) outputs.dropped = dropped;
  return outputs;
};

/** The ceiling flow:for_each refuses to plan beyond unless a graph raises it. */
const DEFAULT_MAX_SHARDS = 64;

/**
 * flow:for_each — turn a collection into an ordered, keyed fan-out plan.
 *
 * The plan is the node's product: each element becomes a shard descriptor
 * `{ index, total, item, key }`, which is what a downstream node needs whether
 * the engine dispatches the shards one per node job later or a single node maps
 * over them today. Keying is deliberate and deterministic — `key` is a declared
 * field of the element, falling back to its index — because a shard's identity
 * is what makes a retry land on the same shard instead of duplicating work, and
 * a key derived from position alone renames every shard when the collection
 * order changes.
 *
 * `shards` is absent for an empty collection and `empty` is present instead, so
 * a graph does not fan out over nothing; `total` always carries the size.
 * Exceeding `max_shards` fails the node rather than truncating the plan: a
 * silently short plan is work that never ran and nothing that says so.
 */
const flowForEach: InlineImplFn = (inputs, props) => {
  const items = requireArray('flow:for_each', inputs.items);
  const maxShards = Number(props.max_shards ?? DEFAULT_MAX_SHARDS);
  if (!Number.isFinite(maxShards) || maxShards < 1) {
    throw new Error(`flow:for_each: max_shards must be a positive number (received ${String(props.max_shards)})`);
  }
  if (items.length > maxShards) {
    throw new Error(`flow:for_each: ${items.length} items exceeds max_shards ${maxShards} — raise the ceiling or filter the collection first`);
  }

  const keyPath = String(props.key ?? '');
  const total = items.length;
  const shards = items.map((item, index) => {
    if (keyPath === '') {
      return { index, total, item, key: String(index) };
    }
    const keyValue = selectPath(item, keyPath);
    if (keyValue === null || keyValue === undefined || keyValue === '') {
      throw new Error(`flow:for_each: item ${index} has no value at key path "${keyPath}" — a shard without a stable key cannot be retried`);
    }
    return { index, total, item, key: String(keyValue) };
  });

  const keys = shards.map((shard) => shard.key);
  const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
  if (duplicate !== undefined) {
    throw new Error(`flow:for_each: key "${duplicate}" appears more than once at key path "${keyPath}" — shard keys must be unique`);
  }

  return total === 0
    ? { total, empty: true }
    : { total, shards };
};

export const flowAdapter: InlineAdapter = {
  name: '@fbp/flow',
  nodes: [
    { taskIdentifier: 'flow:guard', impl: flowGuard },
    { taskIdentifier: 'flow:coerce', impl: coerce },
    { taskIdentifier: 'flow:branch', impl: flowBranch },
    { taskIdentifier: 'flow:switch', impl: flowSwitch },
    { taskIdentifier: 'flow:merge', impl: flowMerge },
    { taskIdentifier: 'flow:filter', impl: flowFilter },
    { taskIdentifier: 'flow:for_each', impl: flowForEach },
  ],
};

export default flowAdapter;
