import type { Graph } from '@fbp/types';

/**
 * What an example needs before it can run.
 *
 * - `local` — every node is an inline node, so the editor's local preview
 *   evaluates the whole graph in the browser with no platform at all.
 * - `server` — the graph addresses registered cloud functions, so it only runs
 *   through `Run on Server` (compute-worker → knative).
 */
export type ExampleRuntime = 'local' | 'server';

export interface ExampleFlow {
  /** Stable id — what a test or a deep link addresses. */
  id: string;
  /** Label shown in the Flows panel's Examples menu. */
  name: string;
  /** One line saying what the graph demonstrates. */
  description: string;
  runtime: ExampleRuntime;
  /**
   * Task identifiers the graph expects to be registered, empty for a graph made
   * only of inline nodes. Listed so a suite can skip an example whose functions
   * the environment under test does not carry.
   */
  requiresFunctions: string[];
  graph: Graph;
}
