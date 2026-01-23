import type { Graph } from '@fbp/types';
import type { EvaluateOptions } from './types';
/**
 * Evaluate a graph starting from the specified output node/port.
 * Uses lazy evaluation - only evaluates nodes that are needed for the output.
 * Fully async to support async node implementations.
 *
 * @param graph - The graph to evaluate
 * @param options - Evaluation options including definitions, output node/port, and external inputs
 * @returns Promise resolving to the value at the specified output port
 */
export declare function evaluate(graph: Graph, options: EvaluateOptions): Promise<any>;
