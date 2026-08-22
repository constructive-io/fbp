import type { InlineAdapter, InlineImplFn } from '@fbp/core';

const jsonSelect: InlineImplFn = (inputs, props) => {
  const { obj } = inputs;
  const path = String(props.path ?? '');
  if (!path || obj === undefined || obj === null) return { value: undefined };

  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return { value: undefined };
    const index = parseInt(part, 10);
    if (!isNaN(index) && Array.isArray(current)) {
      current = (current as unknown[])[index];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return { value: undefined };
    }
  }
  return { value: current };
};

const jsonObject: InlineImplFn = (inputs) => ({
  value: { ...inputs },
});

const jsonMerge: InlineImplFn = (inputs) => {
  const a = (inputs.a && typeof inputs.a === 'object') ? inputs.a as Record<string, unknown> : {};
  const b = (inputs.b && typeof inputs.b === 'object') ? inputs.b as Record<string, unknown> : {};
  return { value: { ...a, ...b } };
};

const jsonSplit: InlineImplFn = (inputs, props) => {
  const obj = inputs.obj as Record<string, unknown> | undefined;
  const keys = (props.keys as string[] | undefined) ?? [];
  if (!obj || typeof obj !== 'object') return { selected: {}, rest: {} };

  const selected: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keys.includes(k)) {
      selected[k] = v;
    } else {
      rest[k] = v;
    }
  }
  return { selected, rest };
};

export const jsonAdapter: InlineAdapter = {
  name: '@fbp/json',
  nodes: [
    { taskIdentifier: 'json:select', impl: jsonSelect },
    { taskIdentifier: 'json:object', impl: jsonObject },
    { taskIdentifier: 'json:merge', impl: jsonMerge },
    { taskIdentifier: 'json:split', impl: jsonSplit },
  ],
};

export default jsonAdapter;
