import type { InlineAdapter, InlineImplFn } from '@fbp/core';

const stringTemplate: InlineImplFn = (inputs, props) => {
  const template = String(props.template ?? '');
  if (!template) return { value: '' };

  const result = template.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => {
    const value = inputs[key];
    if (value === undefined || value === null) return _match;
    return String(value);
  });
  return { value: result };
};

const stringConcat: InlineImplFn = (_inputs, props) => {
  const { value = '' } = _inputs;
  const { prefix = '', suffix = '' } = props;
  return { value: `${prefix}${value}${suffix}` };
};

export const stringAdapter: InlineAdapter = {
  name: '@fbp/string',
  nodes: [
    { taskIdentifier: 'string:template', impl: stringTemplate },
    { taskIdentifier: 'string:concat', impl: stringConcat },
  ],
};

export default stringAdapter;
