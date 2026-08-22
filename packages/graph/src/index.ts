/**
 * @fbp/graph — flow-based programming graph-execution payload helpers.
 *
 * The bridge between a job/queue payload and an FBP graph-node execution:
 * payload shapes, type guards, and the pure argument-preparation logic a
 * runtime uses to turn a graph-node dispatch into (inputs, props) for an
 * inline node implementation. Contains no queue, database, or constructive
 * coupling so it can be reused by any worker (in-process, k8s, …).
 */

// ─── Payload shapes ─────────────────────────────────────────────────────────

/**
 * A job payload that dispatches an FBP graph node (as opposed to a direct
 * cloud-function invocation). Props may arrive as an array of {name, value}
 * objects (from tick_execution) or as a plain object (passthrough).
 */
export interface GraphJobPayload {
  execution_id: string;
  node_name: string;
  node_type?: string;
  inputs?: Record<string, unknown>;
  props?: Array<{ name: string; value: unknown }> | Record<string, unknown>;
  /** Exact module scope stamped by the generated tick_execution enqueue. */
  scope?: string | null;
}

/**
 * A fully-specified graph-node payload with resolved inputs and typed props.
 */
export interface GraphNodePayload {
  execution_id: string;
  node_name: string;
  node_type: string;
  inputs: Record<string, unknown>;
  props?: Array<{ name: string; type?: string; value: unknown }>;
  node_path?: string[];
  parent_invocation_id?: string;
  /** Exact module scope stamped by the generated tick_execution enqueue. */
  scope?: string | null;
}

// ─── Type guards ──────────────────────────────────────────────────────────

/**
 * Detect whether a job payload is a graph execution dispatch
 * (as opposed to a direct cloud-function invocation like send-email).
 */
export const isGraphJob = (payload: unknown): payload is GraphJobPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return typeof p.execution_id === 'string' && typeof p.node_name === 'string';
};

export function isGraphNodePayload(payload: unknown): payload is GraphNodePayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return typeof p.execution_id === 'string'
    && typeof p.node_name === 'string'
    && typeof p.node_type === 'string'
    && p.inputs !== undefined;
}

// ─── Argument preparation ───────────────────────────────────────────────────

/**
 * Extract node props from a payload into a flat key-value map. Props may arrive
 * as an array of {name, value} objects (from tick_execution) or as a plain
 * object (passthrough).
 */
export const extractNodeProps = (
  payload: unknown
): Record<string, unknown> => {
  if (!payload || typeof payload !== 'object') return {};
  const p = payload as Record<string, unknown>;
  const raw = p.props;

  if (!raw) return {};

  if (Array.isArray(raw)) {
    const out: Record<string, unknown> = {};
    for (const item of raw) {
      if (
        item &&
        typeof item === 'object' &&
        'name' in item &&
        'value' in item
      ) {
        out[(item as { name: string }).name] = (item as { value: unknown }).value;
      }
    }
    return out;
  }

  if (typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }

  return {};
};

/**
 * Prepare the (inputs, props) argument pair an inline node implementation
 * receives. For a graph-node dispatch, inputs come from `payload.inputs` and
 * props are flattened from the node definition; otherwise the payload itself
 * is passed through as inputs with empty props.
 */
export const prepareInlineArgs = (
  payload: Record<string, unknown>,
  isGraphNode: boolean
): { inputs: Record<string, unknown>; props: Record<string, unknown> } => {
  const inputs = isGraphNode
    ? ((payload.inputs as Record<string, unknown>) ?? {})
    : payload;
  const props = isGraphNode ? extractNodeProps(payload) : {};
  return { inputs, props };
};
