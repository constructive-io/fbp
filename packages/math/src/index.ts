import type { InlineAdapter, InlineImplFn } from '@fbp/core';

const add: InlineImplFn = (inputs) => ({
  sum: (Number(inputs.a) || 0) + (Number(inputs.b) || 0),
});

const multiply: InlineImplFn = (inputs) => ({
  product: (Number(inputs.a) || 0) * (Number(inputs.b) || 0),
});

const subtract: InlineImplFn = (inputs) => ({
  difference: (Number(inputs.a) || 0) - (Number(inputs.b) || 0),
});

export const mathAdapter: InlineAdapter = {
  name: '@fbp/math',
  nodes: [
    { taskIdentifier: 'math:add', impl: add },
    { taskIdentifier: 'math:multiply', impl: multiply },
    { taskIdentifier: 'math:subtract', impl: subtract },
  ],
};

export default mathAdapter;
