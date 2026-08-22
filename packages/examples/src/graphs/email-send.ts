import type { ExampleFlow } from '../types';

/**
 * Two `email:send` calls — one at the top level, one inside a subnet whose
 * inputs are wired from the outer constants. The subnet, the boundary nodes and
 * the result edge back out of it make this the graph that exercises the editor's
 * nesting and the worker's subnet expansion, which is why the platform-UI e2e
 * suite runs this shape against Mailpit.
 *
 * Addresses are placeholders: point them at a mailbox you can read before
 * running it on a server.
 */
export const emailSend: ExampleFlow = {
  id: 'email-send',
  name: 'Email send (with subnet)',
  description: 'Two email:send nodes, one nested in a subnet — needs the email feature registered.',
  runtime: 'server',
  requiresFunctions: ['email:send'],
  graph: {
    name: 'email-send',
    nodes: [
      { name: 'send-email1', type: 'email:send', meta: { x: 689, y: 572 } },
      {
        name: 'string1',
        type: 'const:string',
        meta: { x: 106, y: 282 },
        props: [{ name: 'value', type: 'string', value: 'recipient@example.com' }],
      },
      {
        name: 'string2',
        type: 'const:string',
        meta: { x: 108, y: 392 },
        props: [{ name: 'value', type: 'string', value: 'top-level send' }],
      },
      {
        name: 'string3',
        type: 'const:string',
        meta: { x: 100, y: 483 },
        props: [{ name: 'value', type: 'string', value: '<h1>Sent from a flow</h1>' }],
      },
      {
        name: 'string4',
        type: 'const:string',
        meta: { x: 97, y: 570 },
        props: [{ name: 'value', type: 'string', value: 'Sent from a flow' }],
      },
      {
        name: 'string5',
        type: 'const:string',
        meta: { x: 104, y: 669 },
        props: [{ name: 'value', type: 'string', value: 'sender@example.com' }],
      },
      {
        name: 'string6',
        type: 'const:string',
        meta: { x: 113, y: 775 },
        props: [{ name: 'value', type: 'string', value: 'noreply@example.com' }],
      },
      { name: 'graphOutput1', type: 'graphOutput', meta: { x: 1377, y: 126 } },
      {
        name: 'subnet1',
        type: 'subnet',
        meta: { x: 1054, y: 274 },
        props: [],
        inputs: [
          { name: 'input1', type: 'any' },
          { name: 'input2', type: 'any' },
          { name: 'input3', type: 'any' },
          { name: 'mine', type: 'any' },
        ],
        outputs: [
          { name: 'graphOutput1', type: 'any' },
          { name: 'output1', type: 'any' },
        ],
        nodes: [
          {
            name: 'input_1',
            type: 'graphInput',
            meta: { x: 30, y: 21 },
            props: [{ name: 'portName', type: 'string', value: 'input1' }],
          },
          {
            name: 'input_2',
            type: 'graphInput',
            meta: { x: 22, y: 221 },
            props: [{ name: 'portName', type: 'string', value: 'input2' }],
          },
          {
            name: 'input_3',
            type: 'graphInput',
            meta: { x: 59, y: 340 },
            props: [{ name: 'portName', type: 'string', value: 'input3' }],
          },
          {
            name: 'string7',
            type: 'const:string',
            meta: { x: 335, y: 103 },
            props: [{ name: 'value', type: 'string', value: 'subnet send' }],
          },
          { name: 'send-email2', type: 'email:send', meta: { x: 650, y: 50 } },
          {
            name: 'output_1',
            type: 'graphOutput',
            meta: { x: 950, y: 50 },
            props: [{ name: 'portName', type: 'string', value: 'output1' }],
          },
          {
            name: 'graphInput1',
            type: 'graphInput',
            meta: { x: 47, y: 468 },
            props: [{ name: 'portName', type: 'string', value: 'mine' }],
          },
          { name: 'graphOutput1', type: 'graphOutput', meta: { x: 586, y: 517 } },
        ],
        edges: [
          { src: { node: 'string7', port: 'value' }, dst: { node: 'send-email2', port: 'subject' } },
          { src: { node: 'string7', port: 'value' }, dst: { node: 'send-email2', port: 'html' } },
          { src: { node: 'input_1', port: 'value' }, dst: { node: 'send-email2', port: 'to' } },
          { src: { node: 'input_2', port: 'value' }, dst: { node: 'send-email2', port: 'from' } },
          { src: { node: 'input_3', port: 'value' }, dst: { node: 'send-email2', port: 'replyTo' } },
          { src: { node: 'send-email2', port: 'result' }, dst: { node: 'output_1', port: 'value' } },
          { src: { node: 'graphInput1', port: 'value' }, dst: { node: 'graphOutput1', port: 'value' } },
        ],
      },
    ],
    edges: [
      { src: { node: 'string1', port: 'value' }, dst: { node: 'send-email1', port: 'to' } },
      { src: { node: 'string2', port: 'value' }, dst: { node: 'send-email1', port: 'subject' } },
      { src: { node: 'string3', port: 'value' }, dst: { node: 'send-email1', port: 'html' } },
      { src: { node: 'string4', port: 'value' }, dst: { node: 'send-email1', port: 'text' } },
      { src: { node: 'string5', port: 'value' }, dst: { node: 'send-email1', port: 'from' } },
      { src: { node: 'string6', port: 'value' }, dst: { node: 'send-email1', port: 'replyTo' } },
      { src: { node: 'string1', port: 'value' }, dst: { node: 'subnet1', port: 'input1' } },
      { src: { node: 'string5', port: 'value' }, dst: { node: 'subnet1', port: 'input2' } },
      { src: { node: 'string6', port: 'value' }, dst: { node: 'subnet1', port: 'input3' } },
      { src: { node: 'send-email1', port: 'result' }, dst: { node: 'subnet1', port: 'mine' } },
      { src: { node: 'subnet1', port: 'output1' }, dst: { node: 'graphOutput1', port: 'value' } },
    ],
    props: [],
    inputs: [],
    outputs: [{ name: 'graphOutput1', type: 'any' }],
  },
};
