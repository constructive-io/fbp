import type { NodeDefinitionWithImpl } from '../types';

/**
 * Core node definitions with implementations.
 * These nodes handle JSON manipulation, flow control, and string operations.
 */

/**
 * core/json:select - Extract a value from JSON by path
 * 
 * Props:
 * - path: string (dot-path like "a.b.c" or "data.user.email")
 * 
 * Inputs:
 * - obj: json (the object to extract from)
 * 
 * Outputs:
 * - value: any (the extracted value)
 */
export const jsonSelectDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'select',
  category: 'json',
  icon: 'circle',
  inputs: [
    { name: 'obj', type: 'json' }
  ],
  outputs: [
    { name: 'value', type: 'any' }
  ],
  props: [
    { name: 'path', type: 'string', default: '' }
  ],
  description: 'Extract a value from JSON by dot-path',
  impl: (inputs, props) => {
    const { obj } = inputs;
    const { path } = props;

    if (!path || obj === undefined || obj === null) {
      return { value: undefined };
    }

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return { value: undefined };
      }
      // Handle array index access like "items.0.name"
      const index = parseInt(part, 10);
      if (!isNaN(index) && Array.isArray(current)) {
        current = current[index];
      } else if (typeof current === 'object') {
        current = current[part];
      } else {
        return { value: undefined };
      }
    }

    return { value: current };
  }
};

/**
 * core/json:object - Build a JSON object from named inputs
 * 
 * This node has dynamic inputs - any input wired to it becomes a key in the output object.
 * The implementation receives all inputs as a Record<string, any>.
 * 
 * Inputs:
 * - (dynamic) arbitrary named inputs
 * 
 * Outputs:
 * - value: json (the constructed object)
 */
export const jsonObjectDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'object',
  category: 'json',
  icon: 'braces',
  inputs: [], // Dynamic inputs - any input name is valid
  outputs: [
    { name: 'value', type: 'json' }
  ],
  props: [],
  description: 'Build a JSON object from named inputs',
  impl: (inputs) => {
    // All inputs become keys in the output object
    return { value: { ...inputs } };
  }
};

/**
 * core/flow:guard - Stop the flow if a condition fails
 * 
 * Inputs:
 * - ok: boolean (the condition to check)
 * - error?: json (optional error info)
 * 
 * Outputs (only the arm that was taken is emitted — a declared port absent
 * from a completed output is a path not taken, and emitting both arms is what
 * makes both arms run):
 * - pass: signal (emitted if ok is true)
 * - fail: signal (emitted if ok is false)
 * - error: json (the error if failed)
 */
export const flowGuardDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'guard',
  category: 'flow',
  icon: 'zap',
  inputs: [
    { name: 'ok', type: 'boolean' },
    { name: 'error', type: 'json' }
  ],
  outputs: [
    { name: 'pass', type: 'signal' },
    { name: 'fail', type: 'signal' },
    { name: 'error', type: 'json' }
  ],
  props: [],
  description: 'Stop the flow if a condition fails',
  impl: (inputs) => {
    const { ok, error } = inputs;

    if (ok) {
      return { pass: true };
    }
    return {
      fail: true,
      error: error || { message: 'Guard condition failed' }
    };
  }
};

type Comparison = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'truthy' | 'empty' | 'contains';

const COMPARISONS: Comparison[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'truthy', 'empty', 'contains'];

/**
 * The predicate flow:branch and flow:switch share: an operator plus an expected
 * value, never an expression to evaluate — a graph definition is data, and data
 * that gets executed is a remote-code-execution surface.
 *
 * Kept in step with the worker-side implementation in `@fbp/flow`, which is the
 * same predicate for the same node types: the editor's local preview and a
 * server run must agree on which arm a graph takes.
 */
const compare = (value: any, operator: Comparison, expected: any): boolean => {
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
 * core/flow:branch - Route a value down one of two paths
 *
 * Only the taken port carries a value; the other is absent rather than null, so
 * a downstream node can tell "not taken" from "taken with a null value".
 * `matched` always carries the verdict, for anything that wants the decision
 * without sitting on an arm.
 */
export const flowBranchDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'branch',
  category: 'flow',
  icon: 'git-branch',
  inputs: [
    { name: 'value', type: 'any' },
    // Wired only when the comparison value comes from the graph rather than the prop.
    { name: 'expected', type: 'any', optional: true }
  ],
  outputs: [
    { name: 'matched', type: 'boolean' },
    { name: 'true', type: 'any' },
    { name: 'false', type: 'any' }
  ],
  props: [
    { name: 'operator', type: 'string', default: 'truthy' },
    { name: 'expected', type: 'any' }
  ],
  description: 'Route a value down one of two paths by a declared predicate',
  impl: (inputs, props) => {
    const operator = String(props.operator ?? 'truthy') as Comparison;
    if (!COMPARISONS.includes(operator)) {
      throw new Error(`flow:branch: unknown operator "${operator}" (expected one of ${COMPARISONS.join(', ')})`);
    }
    const expected = 'expected' in inputs ? inputs.expected : props.expected;
    const matched = compare(inputs.value, operator, expected);
    return matched
      ? { matched, true: inputs.value }
      : { matched, false: inputs.value };
  }
};

/** The number of case ports flow:switch declares. */
const SWITCH_CASE_PORTS = 6;

/**
 * core/flow:switch - Route a value to the first matching case, or to `default`
 *
 * Cases are ordered and the first match wins. Case `i` emits on `case_<i>`;
 * the ports are declared up front and fixed in number, because a port a graph
 * cannot name at design time is a port nothing can be wired to.
 */
export const flowSwitchDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'switch',
  category: 'flow',
  icon: 'git-fork',
  inputs: [
    { name: 'value', type: 'any' }
  ],
  outputs: [
    { name: 'matched_case', type: 'string' },
    ...Array.from({ length: SWITCH_CASE_PORTS }, (_, i) => ({ name: `case_${i}`, type: 'any' })),
    { name: 'default', type: 'any' }
  ],
  props: [
    { name: 'cases', type: 'json', default: [] },
    { name: 'operator', type: 'string', default: 'eq' }
  ],
  description: 'Route a value to the first matching case, or to default',
  impl: (inputs, props) => {
    const rawCases = props.cases ?? [];
    if (!Array.isArray(rawCases)) {
      throw new Error('flow:switch: props.cases must be an array of { operator, expected }');
    }
    if (rawCases.length > SWITCH_CASE_PORTS) {
      throw new Error(`flow:switch: ${rawCases.length} cases exceeds the ${SWITCH_CASE_PORTS} declared case ports`);
    }
    const fallbackOperator = String(props.operator ?? 'eq');

    for (let i = 0; i < rawCases.length; i++) {
      const branchCase = rawCases[i];
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
  }
};

/**
 * core/flow:merge - Rejoin two branch arms into one path
 *
 * The counterpart of a lazy branch: whichever arm produced a value wins, and
 * `source` names it so a graph can tell which path it is now carrying. `a` wins
 * a tie, which only happens when the inputs are not exclusive arms at all.
 */
export const flowMergeDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'merge',
  category: 'flow',
  icon: 'git-merge',
  inputs: [
    // Optional on purpose: a merge runs on whichever arm arrived, and a branch
    // arm that was not taken never produces one.
    { name: 'a', type: 'any', optional: true },
    { name: 'b', type: 'any', optional: true }
  ],
  outputs: [
    { name: 'value', type: 'any' },
    { name: 'source', type: 'string' }
  ],
  props: [],
  description: 'Rejoin two branch arms into one path',
  impl: (inputs) => {
    if (inputs.a !== undefined) {
      return { value: inputs.a, source: 'a' };
    }
    if (inputs.b !== undefined) {
      return { value: inputs.b, source: 'b' };
    }
    throw new Error('flow:merge: neither input arrived — nothing to merge');
  }
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
 * core/flow:filter - Narrow a collection by a declared predicate
 *
 * Same predicate vocabulary as flow:branch, applied per element — `path`
 * compares a field of each element so a list of rows can be filtered without a
 * per-item node. `items`, `dropped` and `empty` are lazy ports: a survivor lane
 * only runs when something survived and a rejects lane only when something was
 * rejected, so the "nothing to do" case is a path rather than a length test.
 */
export const flowFilterDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'filter',
  category: 'flow',
  icon: 'filter',
  inputs: [
    { name: 'items', type: 'json' },
    // Wired only when the comparison value comes from the graph rather than the prop.
    { name: 'expected', type: 'any', optional: true }
  ],
  outputs: [
    { name: 'items', type: 'json' },
    { name: 'dropped', type: 'json' },
    { name: 'empty', type: 'boolean' },
    { name: 'kept_count', type: 'number' },
    { name: 'dropped_count', type: 'number' }
  ],
  props: [
    { name: 'operator', type: 'string', default: 'truthy' },
    { name: 'expected', type: 'any' },
    { name: 'path', type: 'string', default: '' }
  ],
  description: 'Narrow a collection by a declared predicate',
  impl: (inputs, props) => {
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
      dropped_count: dropped.length
    };
    if (kept.length > 0) outputs.items = kept;
    else outputs.empty = true;
    if (dropped.length > 0) outputs.dropped = dropped;
    return outputs;
  }
};

/** The ceiling flow:for_each refuses to plan beyond unless a graph raises it. */
const DEFAULT_MAX_SHARDS = 64;

/**
 * core/flow:for_each - Turn a collection into an ordered, keyed fan-out plan
 *
 * Each element becomes a shard descriptor `{ index, total, item, key }`. The key
 * is a declared field of the element (falling back to its index) because a
 * shard's identity is what lets a retry land on the same shard; duplicate or
 * missing keys fail the node rather than producing an unaddressable plan, and so
 * does a collection larger than `max_shards` — a truncated plan is work that
 * never ran with nothing saying so. `shards` is absent for an empty collection,
 * where `empty` is present instead, so a graph never fans out over nothing.
 */
export const flowForEachDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'for_each',
  category: 'flow',
  icon: 'list-ordered',
  inputs: [
    { name: 'items', type: 'json' }
  ],
  outputs: [
    { name: 'shards', type: 'json' },
    { name: 'empty', type: 'boolean' },
    { name: 'total', type: 'number' }
  ],
  props: [
    { name: 'key', type: 'string', default: '' },
    { name: 'max_shards', type: 'number', default: DEFAULT_MAX_SHARDS }
  ],
  description: 'Turn a collection into an ordered, keyed fan-out plan',
  impl: (inputs, props) => {
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
  }
};

/**
 * core/string:template - Build a string from a template with placeholders
 * 
 * Props:
 * - template: string (template with {{placeholder}} syntax)
 * 
 * Inputs:
 * - (dynamic) values to substitute into the template
 * 
 * Outputs:
 * - value: string (the resulting string)
 */
export const stringTemplateDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'template',
  category: 'string',
  icon: 'quote',
  inputs: [], // Dynamic inputs based on template placeholders
  outputs: [
    { name: 'value', type: 'string' }
  ],
  props: [
    { name: 'template', type: 'string', default: '' }
  ],
  description: 'Build a string from a template with {{placeholder}} syntax',
  impl: (inputs, props) => {
    const { template } = props;
    
    if (!template) {
      return { value: '' };
    }

    // Replace {{placeholder}} with input values
    const result = template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
      const value = inputs[key];
      if (value === undefined || value === null) {
        return match; // Keep placeholder if no value
      }
      return String(value);
    });

    return { value: result };
  }
};

/**
 * core/string:concat - Concatenate strings with an optional separator
 * 
 * Props:
 * - prefix: string (optional prefix)
 * - suffix: string (optional suffix)
 * 
 * Inputs:
 * - value: string (the main value)
 * 
 * Outputs:
 * - value: string (the resulting string)
 */
export const stringConcatDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'concat',
  category: 'string',
  icon: 'link',
  inputs: [
    { name: 'value', type: 'string' }
  ],
  outputs: [
    { name: 'value', type: 'string' }
  ],
  props: [
    { name: 'prefix', type: 'string', default: '' },
    { name: 'suffix', type: 'string', default: '' }
  ],
  description: 'Concatenate strings with optional prefix/suffix',
  impl: (inputs, props) => {
    const { value = '' } = inputs;
    const { prefix = '', suffix = '' } = props;
    
    return { value: `${prefix}${value}${suffix}` };
  }
};

export const constStringDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'string',
  category: 'const',
  icon: 'type',
  outputs: [{ name: 'value', type: 'string' }],
  props: [{ name: 'value', type: 'string', default: '' }],
  description: 'Outputs a constant string value',
  impl: (_inputs, props) => ({
    value: props.value ?? ''
  })
};

export const constBooleanDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'boolean',
  category: 'const',
  icon: 'toggle',
  outputs: [{ name: 'value', type: 'boolean' }],
  props: [{ name: 'value', type: 'boolean', default: false }],
  description: 'Outputs a constant boolean value',
  impl: (_inputs, props) => ({
    value: props.value ?? false
  })
};

export const jsonMergeDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'merge',
  category: 'json',
  icon: 'git-merge',
  inputs: [
    { name: 'a', type: 'json' },
    { name: 'b', type: 'json' }
  ],
  outputs: [
    { name: 'value', type: 'json' }
  ],
  description: 'Merge two JSON objects',
  impl: (inputs) => ({
    value: { ...(inputs.a || {}), ...(inputs.b || {}) }
  })
};

export const jsonSplitDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'split',
  category: 'json',
  icon: 'scissors',
  inputs: [
    { name: 'obj', type: 'json' }
  ],
  outputs: [
    { name: 'selected', type: 'json' },
    { name: 'rest', type: 'json' }
  ],
  props: [
    { name: 'keys', type: 'string', default: '' }
  ],
  description: 'Split a JSON object by key list',
  impl: (inputs, props) => {
    const obj = inputs.obj || {};
    const keyList = (props.keys || '').split(',').map((k: string) => k.trim()).filter(Boolean);
    const keySet = new Set(keyList);
    const selected: Record<string, any> = {};
    const rest: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (keySet.has(k)) selected[k] = v;
      else rest[k] = v;
    }
    return { selected, rest };
  }
};

export const flowCoerceDef: NodeDefinitionWithImpl = {
  context: 'js',
  name: 'coerce',
  category: 'flow',
  icon: 'repeat',
  inputs: [
    { name: 'value', type: 'any' }
  ],
  outputs: [
    { name: 'value', type: 'any' }
  ],
  props: [
    { name: 'type', type: 'string', default: 'string' }
  ],
  description: 'Convert a value to a different type',
  impl: (inputs, props) => {
    const { value } = inputs;
    switch (props.type) {
    case 'number': return { value: Number(value) || 0 };
    case 'string': return { value: String(value ?? '') };
    case 'boolean': return { value: Boolean(value) };
    case 'json': return { value: typeof value === 'string' ? JSON.parse(value) : value };
    default: return { value };
    }
  }
};

export const coreDefinitions: NodeDefinitionWithImpl[] = [
  constStringDef,
  constBooleanDef,
  jsonSelectDef,
  jsonObjectDef,
  jsonMergeDef,
  jsonSplitDef,
  flowGuardDef,
  flowBranchDef,
  flowSwitchDef,
  flowMergeDef,
  flowFilterDef,
  flowForEachDef,
  flowCoerceDef,
  stringTemplateDef,
  stringConcatDef
];
