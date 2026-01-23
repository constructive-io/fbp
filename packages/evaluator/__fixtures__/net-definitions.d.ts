import type { NodeDefinitionWithImpl } from '../src/types';
/**
 * Network node definitions with implementations.
 * These nodes handle GraphQL requests and related operations.
 */
/**
 * net/graphql/request - Execute GraphQL query or mutation
 *
 * Props:
 * - document: string (GraphQL query/mutation document)
 * - operationName?: string (optional operation name)
 * - endpoint: string (GraphQL endpoint URL)
 * - timeout?: number (request timeout in ms, default 30000)
 *
 * Inputs:
 * - variables: json (GraphQL variables)
 * - headers?: json (additional headers)
 *
 * Outputs:
 * - data: json (response data)
 * - error?: json (error if any)
 * - ok: boolean (true if request succeeded without errors)
 */
export declare const graphqlRequestDef: NodeDefinitionWithImpl;
export declare const netDefinitions: NodeDefinitionWithImpl[];
