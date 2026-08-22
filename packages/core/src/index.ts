/**
 * @fbp/core — flow-based programming core primitives.
 *
 * The generic, runtime-agnostic surface shared by every FBP node adapter and
 * the compute worker: the inline node registry and its adapter/node/impl
 * types. Contains no constructive-, job-queue-, or database-specific code so
 * it can be published stand-alone.
 */

import { Logger } from '@pgpmjs/logger';

const log = new Logger('fbp:inline-registry');

/**
 * What invoked this node. A graph's head is otherwise unreachable: every
 * source node is a `const:*`, so a flow cannot see the database, entity, or
 * actor it is running for. A runtime that knows those facts passes them here;
 * one that does not (a local preview in the editor) passes nothing, and a
 * node that projects them reports them as null rather than inventing values.
 */
export interface InlineContext {
  databaseId?: string | null;
  namespaceId?: string | null;
  entityId?: string | null;
  organizationId?: string | null;
  entityType?: string | null;
  actorId?: string | null;
  principalId?: string | null;
  scope?: string | null;
  taskIdentifier?: string | null;
  executionId?: string | null;
  nodeName?: string | null;
  invocationId?: string | null;
  jobId?: string | number | null;
}

/**
 * An inline node implementation. Pure function (non-volatile) matching the
 * evaluator NodeImplFn signature: (inputs, props) => outputs. A third
 * argument carries the invocation context for the nodes that project it;
 * everything else ignores it and stays pure.
 */
export type InlineImplFn = (
  inputs: Record<string, unknown>,
  props: Record<string, unknown>,
  context?: InlineContext
) => Record<string, unknown> | Promise<Record<string, unknown>>;

/** A single inline node contributed by an adapter. */
export interface InlineNode {
  taskIdentifier: string;
  impl: InlineImplFn;
}

/**
 * A package that contributes one or more inline node implementations.
 * `name` is the npm package name (e.g. "@fbp/math").
 */
export interface InlineAdapter {
  name: string;
  nodes: InlineNode[];
}

/**
 * InlineRegistry — in-process dispatch for inline node implementations.
 *
 * Adapter packages contribute their node implementations (math:add,
 * json:select, flow:guard, …) which a runtime resolves by task_identifier and
 * executes in-process without an HTTP round-trip. The registry ships zero
 * implementations — adapters are registered by the composing runtime.
 */
export class InlineRegistry {
  private impls = new Map<string, InlineImplFn>();
  private adapters: string[] = [];

  register(adapter: InlineAdapter): void {
    for (const node of adapter.nodes) {
      if (this.impls.has(node.taskIdentifier)) {
        log.warn(`overwriting inline impl for "${node.taskIdentifier}"`);
      }
      this.impls.set(node.taskIdentifier, node.impl);
    }
    this.adapters.push(adapter.name);
    log.debug(`registered inline adapter: ${adapter.name} (${adapter.nodes.length} node(s))`);
  }

  resolve(taskIdentifier: string): InlineImplFn | null {
    return this.impls.get(taskIdentifier) ?? null;
  }

  has(taskIdentifier: string): boolean {
    return this.impls.has(taskIdentifier);
  }

  list(): string[] {
    return Array.from(this.impls.keys());
  }

  adapterNames(): string[] {
    return [...this.adapters];
  }

  get size(): number {
    return this.impls.size;
  }
}
