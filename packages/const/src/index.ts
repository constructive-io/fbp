import type { InlineAdapter, InlineImplFn } from '@fbp/core';

const constNumber: InlineImplFn = (_inputs, props) => ({
  value: Number(props.value) || 0,
});

const constString: InlineImplFn = (_inputs, props) => ({
  value: String(props.value ?? ''),
});

const constBoolean: InlineImplFn = (_inputs, props) => ({
  value: Boolean(props.value),
});

export const constAdapter: InlineAdapter = {
  name: '@fbp/const',
  nodes: [
    { taskIdentifier: 'const:number', impl: constNumber },
    { taskIdentifier: 'const:string', impl: constString },
    { taskIdentifier: 'const:boolean', impl: constBoolean },
  ],
};

export default constAdapter;
