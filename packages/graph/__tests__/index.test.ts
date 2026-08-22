import {
  extractNodeProps,
  isGraphJob,
  isGraphNodePayload,
  prepareInlineArgs,
} from '../src/index';

describe('@fbp/graph isGraphJob', () => {
  it('accepts a payload with execution_id + node_name', () => {
    expect(isGraphJob({ execution_id: 'e1', node_name: 'n1' })).toBe(true);
  });

  it('rejects direct invocations and non-objects', () => {
    expect(isGraphJob({ to: 'a@b.com', subject: 'hi' })).toBe(false);
    expect(isGraphJob(undefined)).toBe(false);
    expect(isGraphJob(null)).toBe(false);
  });
});

describe('@fbp/graph isGraphNodePayload', () => {
  it('requires execution_id, node_name, node_type and inputs', () => {
    expect(
      isGraphNodePayload({ execution_id: 'e', node_name: 'n', node_type: 't', inputs: {} })
    ).toBe(true);
    expect(isGraphNodePayload({ execution_id: 'e', node_name: 'n' })).toBe(false);
  });
});

describe('@fbp/graph extractNodeProps', () => {
  it('flattens an array of {name, value}', () => {
    const payload = { props: [{ name: 'value', type: 'number', value: 42 }] };
    expect(extractNodeProps(payload)).toEqual({ value: 42 });
  });

  it('passes a plain object through and defaults to empty', () => {
    expect(extractNodeProps({ props: { value: 'hello' } })).toEqual({ value: 'hello' });
    expect(extractNodeProps({ execution_id: 'x', node_name: 'y' })).toEqual({});
  });
});

describe('@fbp/graph prepareInlineArgs', () => {
  it('splits graph-node payloads into inputs + flattened props', () => {
    const payload = {
      execution_id: 'e',
      node_name: 'n',
      inputs: { a: 1 },
      props: [{ name: 'k', value: 'v' }],
    };
    expect(prepareInlineArgs(payload, true)).toEqual({
      inputs: { a: 1 },
      props: { k: 'v' },
    });
  });

  it('passes the payload through as inputs when not a graph node', () => {
    const payload = { a: 1, b: 2 };
    expect(prepareInlineArgs(payload, false)).toEqual({
      inputs: { a: 1, b: 2 },
      props: {},
    });
  });
});
