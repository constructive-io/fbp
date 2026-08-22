import type { Graph } from '@fbp/types';

import type { NodeDefinitionWithImpl } from '../src/types';
import { validateGraph } from '../src/validate';

const CTX = 'function';

// A digital asset (definition carrying an internal graph) with a required
// input `x` and a required prop `factor` (no default).
const scalerDef: NodeDefinitionWithImpl = {
  context: CTX,
  category: 'math',
  name: 'scaler',
  inputs: [{ name: 'x', type: 'number' }],
  outputs: [{ name: 'result', type: 'number' }],
  props: [{ name: 'factor', type: 'number', required: true }],
  graph: {
    name: 'scaler-internal',
    context: CTX,
    nodes: [
      { name: 'in_x', type: 'graphInput', props: [{ name: 'portName', type: 'string', value: 'x' }] },
      { name: 'out_result', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'result' }] },
    ],
    edges: [
      { src: { node: 'in_x', port: 'value' }, dst: { node: 'out_result', port: 'value' } },
    ],
  },
};

// A leaf definition with a required input, an optional input, and a multi input.
const optMultiDef: NodeDefinitionWithImpl = {
  context: CTX,
  category: 'math',
  name: 'opt_multi',
  inputs: [
    { name: 'req', type: 'number' },
    { name: 'opt', type: 'number', optional: true },
    { name: 'many', type: 'number', multi: true },
  ],
  outputs: [{ name: 'result', type: 'number' }],
};

const defs = [scalerDef, optMultiDef];

function withScaler(connectX: boolean, setFactor: boolean): Graph {
  return {
    name: 'g',
    context: CTX,
    nodes: [
      { name: 'src', type: 'graphInput', props: [{ name: 'portName', type: 'string', value: 'x' }] },
      {
        name: 'my_scaler',
        type: 'math:scaler',
        props: setFactor ? [{ name: 'factor', type: 'number', value: 3 }] : [],
      },
      { name: 'out', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'result' }] },
    ],
    edges: [
      ...(connectX ? [{ src: { node: 'src', port: 'value' }, dst: { node: 'my_scaler', port: 'x' } }] : []),
      { src: { node: 'my_scaler', port: 'result' }, dst: { node: 'out', port: 'value' } },
    ],
  };
}

describe('validateGraph — definition-aware pre-flight', () => {
  it('accepts a valid graph (required input connected, required prop set)', () => {
    expect(validateGraph(withScaler(true, true), { definitions: defs })).toEqual([]);
  });

  it('flags an unconnected required input', () => {
    const errors = validateGraph(withScaler(false, true), { definitions: defs });
    expect(errors).toEqual([
      expect.objectContaining({ code: 'MISSING_REQUIRED_INPUT', node: 'my_scaler', port: 'x' }),
    ]);
  });

  it('flags an unset required prop (no default)', () => {
    const errors = validateGraph(withScaler(true, false), { definitions: defs });
    expect(errors).toEqual([
      expect.objectContaining({ code: 'MISSING_REQUIRED_PROP', node: 'my_scaler', prop: 'factor' }),
    ]);
  });

  it('does not require optional or multi inputs to be connected', () => {
    const g: Graph = {
      name: 'g',
      context: CTX,
      nodes: [
        { name: 'src', type: 'graphInput', props: [{ name: 'portName', type: 'string', value: 'a' }] },
        { name: 'n', type: 'math:opt_multi' },
        { name: 'out', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'result' }] },
      ],
      edges: [
        { src: { node: 'src', port: 'value' }, dst: { node: 'n', port: 'req' } },
        { src: { node: 'n', port: 'result' }, dst: { node: 'out', port: 'value' } },
      ],
    };
    expect(validateGraph(g, { definitions: defs })).toEqual([]);
  });

  it('flags the required input of opt_multi when unconnected', () => {
    const g: Graph = {
      name: 'g',
      context: CTX,
      nodes: [
        { name: 'n', type: 'math:opt_multi' },
        { name: 'out', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'result' }] },
      ],
      edges: [{ src: { node: 'n', port: 'result' }, dst: { node: 'out', port: 'value' } }],
    };
    expect(validateGraph(g, { definitions: defs })).toEqual([
      expect.objectContaining({ code: 'MISSING_REQUIRED_INPUT', node: 'n', port: 'req' }),
    ]);
  });

  it('treats nodes with no resolvable definition as opaque (no error)', () => {
    const g: Graph = {
      name: 'g',
      context: CTX,
      nodes: [
        { name: 'mystery', type: 'unknown:thing' },
        { name: 'out', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'v' }] },
      ],
      edges: [{ src: { node: 'mystery', port: 'v' }, dst: { node: 'out', port: 'value' } }],
    };
    expect(validateGraph(g, { definitions: defs })).toEqual([]);
  });

  it('validates a required input of an inline subnet and recurses', () => {
    const g: Graph = {
      name: 'g',
      context: CTX,
      nodes: [
        {
          name: 'processor',
          type: 'subnet',
          inputs: [{ name: 'val', type: 'number' }],
          outputs: [{ name: 'result', type: 'number' }],
          nodes: [
            { name: 'in_val', type: 'graphInput', props: [{ name: 'portName', type: 'string', value: 'val' }] },
            { name: 'inner', type: 'math:opt_multi' },
            { name: 'out_result', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'result' }] },
          ],
          edges: [
            { src: { node: 'in_val', port: 'value' }, dst: { node: 'inner', port: 'req' } },
            { src: { node: 'inner', port: 'result' }, dst: { node: 'out_result', port: 'value' } },
          ],
        },
        { name: 'out', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'result' }] },
      ],
      // `processor.val` is intentionally left unconnected.
      edges: [{ src: { node: 'processor', port: 'result' }, dst: { node: 'out', port: 'value' } }],
    };
    expect(validateGraph(g, { definitions: defs })).toEqual([
      expect.objectContaining({ code: 'MISSING_REQUIRED_INPUT', node: 'processor', port: 'val' }),
    ]);
  });

  it('recurses into a digital asset whose internal node has an unset required prop', () => {
    // scaler2 embeds a scaler node internally with an unconnected required input.
    const scaler2: NodeDefinitionWithImpl = {
      context: CTX,
      category: 'math',
      name: 'scaler2',
      inputs: [{ name: 'x', type: 'number' }],
      outputs: [{ name: 'result', type: 'number' }],
      graph: {
        name: 'scaler2-internal',
        context: CTX,
        nodes: [
          { name: 'in_x', type: 'graphInput', props: [{ name: 'portName', type: 'string', value: 'x' }] },
          // required input `x` is NOT connected → should be flagged during recursion
          { name: 'nested', type: 'math:scaler', props: [{ name: 'factor', type: 'number', value: 2 }] },
          { name: 'out_result', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'result' }] },
        ],
        edges: [
          { src: { node: 'nested', port: 'result' }, dst: { node: 'out_result', port: 'value' } },
        ],
      },
    };
    const g: Graph = {
      name: 'g',
      context: CTX,
      nodes: [
        { name: 'src', type: 'graphInput', props: [{ name: 'portName', type: 'string', value: 'x' }] },
        { name: 'user', type: 'math:scaler2' },
        { name: 'out', type: 'graphOutput', props: [{ name: 'portName', type: 'string', value: 'result' }] },
      ],
      edges: [
        { src: { node: 'src', port: 'value' }, dst: { node: 'user', port: 'x' } },
        { src: { node: 'user', port: 'result' }, dst: { node: 'out', port: 'value' } },
      ],
    };
    const errors = validateGraph(g, { definitions: [...defs, scaler2] });
    expect(errors).toEqual([
      expect.objectContaining({ code: 'MISSING_REQUIRED_INPUT', node: 'user/nested', port: 'x' }),
    ]);
  });
});
