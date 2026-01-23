import type { NodeDefinitionWithImpl } from '../types';
/**
 * Core node definitions with implementations.
 * These nodes handle JSON manipulation, flow control, and string operations.
 */
/**
 * core/json/select - Extract a value from JSON by path
 *
 * Props:
 * - path: string (dot-path like "a.b.c" or "data.user.email")
 *
 * Inputs:
 * - obj: json (the object to extract from)
 *
 * Outputs:
 * - value: any (the extracted value)
 */
export declare const jsonSelectDef: NodeDefinitionWithImpl;
/**
 * core/json/object - Build a JSON object from named inputs
 *
 * This node has dynamic inputs - any input wired to it becomes a key in the output object.
 * The implementation receives all inputs as a Record<string, any>.
 *
 * Inputs:
 * - (dynamic) arbitrary named inputs
 *
 * Outputs:
 * - value: json (the constructed object)
 */
export declare const jsonObjectDef: NodeDefinitionWithImpl;
/**
 * core/flow/guard - Stop the flow if a condition fails
 *
 * Inputs:
 * - ok: boolean (the condition to check)
 * - error?: json (optional error info)
 *
 * Outputs:
 * - pass: signal (emitted if ok is true)
 * - fail: signal (emitted if ok is false)
 * - error: json (the error if failed)
 */
export declare const flowGuardDef: NodeDefinitionWithImpl;
/**
 * core/string/template - Build a string from a template with placeholders
 *
 * Props:
 * - template: string (template with {{placeholder}} syntax)
 *
 * Inputs:
 * - (dynamic) values to substitute into the template
 *
 * Outputs:
 * - value: string (the resulting string)
 */
export declare const stringTemplateDef: NodeDefinitionWithImpl;
/**
 * core/string/concat - Concatenate strings with an optional separator
 *
 * Props:
 * - prefix: string (optional prefix)
 * - suffix: string (optional suffix)
 *
 * Inputs:
 * - value: string (the main value)
 *
 * Outputs:
 * - value: string (the resulting string)
 */
export declare const stringConcatDef: NodeDefinitionWithImpl;
export declare const coreDefinitions: NodeDefinitionWithImpl[];
