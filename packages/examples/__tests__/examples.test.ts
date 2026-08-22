import type { NodeDefinitionWithImpl } from '@fbp/evaluator';
import {
  coreDefinitions,
  evaluate,
  graphInputDef,
  graphOutputDef,
  graphPropDef,
  mathDefinitions,
  netDefinitions,
  uiDefinitions,
  validateGraph,
} from '@fbp/evaluator';
import type { Graph, Node } from '@fbp/types';

import {
  exampleFlows,
  getExampleFlow,
  helloStringExpectedOutput,
  mathPipelineExpectedOutput,
} from '../src';

const inlineDefinitions: NodeDefinitionWithImpl[] = [
  ...coreDefinitions,
  ...mathDefinitions,
  ...uiDefinitions,
  ...netDefinitions,
  graphInputDef,
  graphOutputDef,
  graphPropDef,
];

/**
 * Node types the browser resolves on its own: the inline definitions keyed
 * `category:name`, plus the boundary kinds and `subnet`, which the editor and
 * the worker both satisfy structurally rather than from a definition.
 */
const inlineNodeTypes = new Set([
  ...inlineDefinitions.map((def) => (def.category ? `${def.category}:${def.name}` : def.name)),
  'graphInput',
  'graphOutput',
  'graphProp',
  'subnet',
]);

/** Every node type used by a graph, descending into subnets. */
function nodeTypes(nodes: Node[]): string[] {
  return nodes.flatMap((node) => [node.type, ...nodeTypes(node.nodes ?? [])]);
}

/** Every node name a graph declares at its top level. */
function nodeNames(graph: Graph): string[] {
  return graph.nodes.map((node) => node.name);
}

describe('example flow catalog', () => {
  it('exposes unique ids and names', () => {
    const ids = exampleFlows.map((example) => example.id);
    const names = exampleFlows.map((example) => example.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('getExampleFlow throws for an unknown id rather than returning an empty graph', () => {
    expect(() => getExampleFlow('nope')).toThrow(/Unknown example flow "nope"/);
  });

  it.each(exampleFlows.map((example) => [example.id, example] as const))(
    '%s — every edge addresses a declared node',
    (_id, example) => {
      const names = new Set(nodeNames(example.graph));
      for (const edge of example.graph.edges) {
        expect(names).toContain(edge.src.node);
        expect(names).toContain(edge.dst.node);
      }
    }
  );

  it.each(exampleFlows.map((example) => [example.id, example] as const))(
    '%s — declares an output node',
    (_id, example) => {
      expect(example.graph.nodes.some((node) => node.type === 'graphOutput')).toBe(true);
    }
  );

  it.each(exampleFlows.map((example) => [example.id, example] as const))(
    '%s — requiresFunctions lists exactly the non-inline node types',
    (_id, example) => {
      const used = new Set(
        nodeTypes(example.graph.nodes).filter((type) => !inlineNodeTypes.has(type))
      );
      expect([...used].sort()).toEqual([...example.requiresFunctions].sort());
      expect(example.runtime).toBe(used.size === 0 ? 'local' : 'server');
    }
  );

  it.each(exampleFlows.filter((example) => example.runtime === 'local').map((e) => [e.id, e] as const))(
    '%s — passes editor pre-flight validation',
    (_id, example) => {
      expect(validateGraph({ ...example.graph, context: 'js' }, { definitions: inlineDefinitions })).toEqual([]);
    }
  );
});

describe('local examples evaluate to their documented output', () => {
  const evaluateExample = (id: string, inputs?: Record<string, unknown>) => {
    const example = getExampleFlow(id);
    return evaluate({ ...example.graph, context: 'js' }, {
      definitions: inlineDefinitions,
      outputNode: 'graphOutput1',
      outputPort: 'value',
      inputs,
    });
  };

  it('hello-string renders its template', async () => {
    await expect(evaluateExample('hello-string')).resolves.toBe(helloStringExpectedOutput);
  });

  it('math-pipeline computes (2 + 3) * 4', async () => {
    await expect(evaluateExample('math-pipeline')).resolves.toBe(mathPipelineExpectedOutput);
  });

  it('failed-check-fanout plans one keyed shard per failing check', async () => {
    const checks = [
      { name: 'lint', conclusion: 'success' },
      { name: 'test', conclusion: 'failure' },
      { name: 'build', conclusion: 'failure' },
    ];
    await expect(evaluateExample('failed-check-fanout', { checks })).resolves.toEqual({
      arm: 'a',
      failed: 2,
      passed: 1,
      shards: [
        { index: 0, total: 2, item: checks[1], key: 'test' },
        { index: 1, total: 2, item: checks[2], key: 'build' },
      ],
    });
  });

  it('failed-check-fanout takes the empty arm when every check passed', async () => {
    const checks = [{ name: 'lint', conclusion: 'success' }];
    await expect(evaluateExample('failed-check-fanout', { checks })).resolves.toEqual({
      arm: 'b',
      failed: 0,
      passed: 1,
      shards: true,
    });
  });
});
