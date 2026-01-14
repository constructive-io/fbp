import type { NodeDefinitionWithImpl } from '../src/types';

/**
 * UI component node definitions with implementations for testing.
 * These produce vdom JSON structures.
 */

export const pageDef: NodeDefinitionWithImpl = {
  context: 'ui',
  category: 'layout',
  type: 'ui/layout/Page',
  inputs: [
    { name: 'children', type: 'Element[]', multi: true }
  ],
  outputs: [{ name: 'element', type: 'Element' }],
  props: [
    { name: 'className', type: 'string', default: '' },
    { name: 'key', type: 'string', required: true }
  ],
  description: 'A page container component',
  impl: (inputs, props) => ({
    element: {
      type: 'Page',
      key: props.key,
      props: { className: props.className },
      children: inputs.children ?? []
    }
  })
};

export const formDef: NodeDefinitionWithImpl = {
  context: 'ui',
  category: 'form',
  type: 'ui/form/Form',
  inputs: [
    { name: 'children', type: 'Element[]', multi: true }
  ],
  outputs: [{ name: 'element', type: 'Element' }],
  props: [
    { name: 'className', type: 'string', default: '' },
    { name: 'key', type: 'string', required: true }
  ],
  description: 'A form container component',
  impl: (inputs, props) => ({
    element: {
      type: 'Form',
      key: props.key,
      props: { className: props.className },
      children: inputs.children ?? []
    }
  })
};

export const inputDef: NodeDefinitionWithImpl = {
  context: 'ui',
  category: 'form',
  type: 'ui/form/Input',
  inputs: [],
  outputs: [{ name: 'element', type: 'Element' }],
  props: [
    { name: 'key', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'type', type: 'string', default: 'text' },
    { name: 'placeholder', type: 'string', default: '' }
  ],
  description: 'An input field component',
  impl: (_inputs, props) => ({
    element: {
      type: 'Input',
      key: props.key,
      props: {
        name: props.name,
        type: props.type ?? 'text',
        placeholder: props.placeholder ?? ''
      }
    }
  })
};

export const buttonDef: NodeDefinitionWithImpl = {
  context: 'ui',
  category: 'form',
  type: 'ui/form/Button',
  inputs: [],
  outputs: [{ name: 'element', type: 'Element' }],
  props: [
    { name: 'key', type: 'string', required: true },
    { name: 'type', type: 'string', default: 'button' },
    { name: 'text', type: 'string', required: true }
  ],
  description: 'A button component',
  impl: (_inputs, props) => ({
    element: {
      type: 'Button',
      key: props.key,
      props: {
        type: props.type ?? 'button',
        text: props.text
      }
    }
  })
};

export const uiDefinitions: NodeDefinitionWithImpl[] = [
  pageDef,
  formDef,
  inputDef,
  buttonDef
];
