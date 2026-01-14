import type { Graph } from '@fbp/types';
import { evaluate } from '../src/evaluate';
import { mathDefinitions, constNumberDef, addDef, multiplyDef } from '../__fixtures__/math-definitions';
import { uiDefinitions, pageDef, formDef, inputDef, buttonDef } from '../__fixtures__/ui-definitions';

describe('evaluate', () => {
  describe('math operations', () => {
    it('should evaluate a simple add graph', () => {
      const graph: Graph = {
        name: 'simple-add',
        nodes: [
          { name: 'num1', type: 'js/const/number', props: [{ name: 'value', type: 'number', value: 5 }] },
          { name: 'num2', type: 'js/const/number', props: [{ name: 'value', type: 'number', value: 3 }] },
          { name: 'add', type: 'js/math/add' }
        ],
        edges: [
          { src: { node: 'num1', port: 'value' }, dst: { node: 'add', port: 'a' } },
          { src: { node: 'num2', port: 'value' }, dst: { node: 'add', port: 'b' } }
        ]
      };

      const result = evaluate(graph, {
        definitions: mathDefinitions,
        outputNode: 'add',
        outputPort: 'sum'
      });

      expect(result).toBe(8);
    });

    it('should evaluate a chained math graph (add then multiply)', () => {
      const graph: Graph = {
        name: 'chained-math',
        nodes: [
          { name: 'num1', type: 'js/const/number', props: [{ name: 'value', type: 'number', value: 2 }] },
          { name: 'num2', type: 'js/const/number', props: [{ name: 'value', type: 'number', value: 3 }] },
          { name: 'num3', type: 'js/const/number', props: [{ name: 'value', type: 'number', value: 4 }] },
          { name: 'add', type: 'js/math/add' },
          { name: 'multiply', type: 'js/math/multiply' }
        ],
        edges: [
          { src: { node: 'num1', port: 'value' }, dst: { node: 'add', port: 'a' } },
          { src: { node: 'num2', port: 'value' }, dst: { node: 'add', port: 'b' } },
          { src: { node: 'add', port: 'sum' }, dst: { node: 'multiply', port: 'a' } },
          { src: { node: 'num3', port: 'value' }, dst: { node: 'multiply', port: 'b' } }
        ]
      };

      const result = evaluate(graph, {
        definitions: mathDefinitions,
        outputNode: 'multiply',
        outputPort: 'product'
      });

      // (2 + 3) * 4 = 20
      expect(result).toBe(20);
    });

    it('should use lazy evaluation (only evaluate needed nodes)', () => {
      const evaluatedNodes: string[] = [];
      
      // Create definitions that track which nodes are evaluated
      const trackingDefs = mathDefinitions.map(def => ({
        ...def,
        impl: (inputs: Record<string, any>, props: Record<string, any>) => {
          evaluatedNodes.push(def.type);
          return def.impl!(inputs, props);
        }
      }));

      const graph: Graph = {
        name: 'lazy-test',
        nodes: [
          { name: 'num1', type: 'js/const/number', props: [{ name: 'value', type: 'number', value: 5 }] },
          { name: 'num2', type: 'js/const/number', props: [{ name: 'value', type: 'number', value: 3 }] },
          { name: 'unused', type: 'js/const/number', props: [{ name: 'value', type: 'number', value: 999 }] },
          { name: 'add', type: 'js/math/add' }
        ],
        edges: [
          { src: { node: 'num1', port: 'value' }, dst: { node: 'add', port: 'a' } },
          { src: { node: 'num2', port: 'value' }, dst: { node: 'add', port: 'b' } }
          // Note: 'unused' node is not connected to anything
        ]
      };

      evaluate(graph, {
        definitions: trackingDefs,
        outputNode: 'add',
        outputPort: 'sum'
      });

      // 'unused' node should NOT be evaluated
      expect(evaluatedNodes).toContain('js/const/number');
      expect(evaluatedNodes).toContain('js/math/add');
      expect(evaluatedNodes.filter(n => n === 'js/const/number').length).toBe(2); // Only num1 and num2
    });
  });

  describe('UI vdom generation', () => {
    it('should generate a simple page vdom', () => {
      const graph: Graph = {
        name: 'simple-page',
        nodes: [
          { 
            name: 'page', 
            type: 'ui/layout/Page', 
            props: [
              { name: 'key', type: 'string', value: 'home' },
              { name: 'className', type: 'string', value: 'min-h-screen' }
            ] 
          }
        ],
        edges: []
      };

      const result = evaluate(graph, {
        definitions: uiDefinitions,
        outputNode: 'page',
        outputPort: 'element'
      });

      expect(result).toEqual({
        type: 'Page',
        key: 'home',
        props: { className: 'min-h-screen' },
        children: []
      });
    });

    it('should generate a form with children using edge array order', () => {
      const graph: Graph = {
        name: 'form-with-children',
        nodes: [
          { 
            name: 'form', 
            type: 'ui/form/Form', 
            props: [
              { name: 'key', type: 'string', value: 'myForm' },
              { name: 'className', type: 'string', value: 'flex gap-4' }
            ] 
          },
          { 
            name: 'emailInput', 
            type: 'ui/form/Input', 
            props: [
              { name: 'key', type: 'string', value: 'email' },
              { name: 'name', type: 'string', value: 'email' },
              { name: 'type', type: 'string', value: 'email' },
              { name: 'placeholder', type: 'string', value: 'Enter email' }
            ] 
          },
          { 
            name: 'submitButton', 
            type: 'ui/form/Button', 
            props: [
              { name: 'key', type: 'string', value: 'submit' },
              { name: 'type', type: 'string', value: 'submit' },
              { name: 'text', type: 'string', value: 'Subscribe' }
            ] 
          }
        ],
        edges: [
          // Edge array order determines children order
          { src: { node: 'emailInput', port: 'element' }, dst: { node: 'form', port: 'children' } },
          { src: { node: 'submitButton', port: 'element' }, dst: { node: 'form', port: 'children' } }
        ]
      };

      const result = evaluate(graph, {
        definitions: uiDefinitions,
        outputNode: 'form',
        outputPort: 'element'
      });

      expect(result).toEqual({
        type: 'Form',
        key: 'myForm',
        props: { className: 'flex gap-4' },
        children: [
          {
            type: 'Input',
            key: 'email',
            props: { name: 'email', type: 'email', placeholder: 'Enter email' }
          },
          {
            type: 'Button',
            key: 'submit',
            props: { type: 'submit', text: 'Subscribe' }
          }
        ]
      });
    });

    it('should respect edge array ordering', () => {
      const graph: Graph = {
        name: 'array-order',
        nodes: [
          { 
            name: 'form', 
            type: 'ui/form/Form', 
            props: [
              { name: 'key', type: 'string', value: 'myForm' },
              { name: 'className', type: 'string', value: '' }
            ] 
          },
          { 
            name: 'first', 
            type: 'ui/form/Button', 
            props: [
              { name: 'key', type: 'string', value: 'first' },
              { name: 'text', type: 'string', value: 'First' }
            ] 
          },
          { 
            name: 'second', 
            type: 'ui/form/Button', 
            props: [
              { name: 'key', type: 'string', value: 'second' },
              { name: 'text', type: 'string', value: 'Second' }
            ] 
          }
        ],
        edges: [
          // Edge array order determines children order: first, then second
          { src: { node: 'first', port: 'element' }, dst: { node: 'form', port: 'children' } },
          { src: { node: 'second', port: 'element' }, dst: { node: 'form', port: 'children' } }
        ]
      };

      const result = evaluate(graph, {
        definitions: uiDefinitions,
        outputNode: 'form',
        outputPort: 'element'
      });

      // Edge array order determines children order
      expect(result.children[0].key).toBe('first');
      expect(result.children[1].key).toBe('second');
    });

    it('should generate the full newsletter page example', () => {
      const graph: Graph = {
        name: 'newsletter-page',
        nodes: [
          { 
            name: 'page', 
            type: 'ui/layout/Page', 
            props: [
              { name: 'key', type: 'string', value: 'home' },
              { name: 'className', type: 'string', value: 'min-h-screen' }
            ] 
          },
          { 
            name: 'form', 
            type: 'ui/form/Form', 
            props: [
              { name: 'key', type: 'string', value: 'newsletterForm' },
              { name: 'className', type: 'string', value: 'mt-10 flex gap-x-4' }
            ] 
          },
          { 
            name: 'emailInput', 
            type: 'ui/form/Input', 
            props: [
              { name: 'key', type: 'string', value: 'email' },
              { name: 'name', type: 'string', value: 'email' },
              { name: 'type', type: 'string', value: 'email' },
              { name: 'placeholder', type: 'string', value: 'Enter email' }
            ] 
          },
          { 
            name: 'submitButton', 
            type: 'ui/form/Button', 
            props: [
              { name: 'key', type: 'string', value: 'submit' },
              { name: 'type', type: 'string', value: 'submit' },
              { name: 'text', type: 'string', value: 'Subscribe' }
            ] 
          }
        ],
        edges: [
          // Edge array order determines children order
          { src: { node: 'emailInput', port: 'element' }, dst: { node: 'form', port: 'children' } },
          { src: { node: 'submitButton', port: 'element' }, dst: { node: 'form', port: 'children' } },
          { src: { node: 'form', port: 'element' }, dst: { node: 'page', port: 'children' } }
        ]
      };

      const result = evaluate(graph, {
        definitions: uiDefinitions,
        outputNode: 'page',
        outputPort: 'element'
      });

      expect(result).toEqual({
        type: 'Page',
        key: 'home',
        props: { className: 'min-h-screen' },
        children: [
          {
            type: 'Form',
            key: 'newsletterForm',
            props: { className: 'mt-10 flex gap-x-4' },
            children: [
              {
                type: 'Input',
                key: 'email',
                props: { name: 'email', type: 'email', placeholder: 'Enter email' }
              },
              {
                type: 'Button',
                key: 'submit',
                props: { type: 'submit', text: 'Subscribe' }
              }
            ]
          }
        ]
      });
    });
  });
});
