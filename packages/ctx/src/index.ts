import type { InlineAdapter, InlineImplFn } from '@fbp/core';

/**
 * ctx:request — the missing head of a graph.
 *
 * Every other source node is a `const:*`, so a flow has no way to see what
 * invoked it. This node projects the invocation context the runtime already
 * carries (the same identity the compute log is attributed to) into typed
 * output ports. It performs no I/O: the values exist on the dispatch before
 * the node runs.
 *
 * A runtime that does not know the context — a local preview in the editor —
 * passes none, and every port is null rather than a fabricated value.
 */
const ctxRequest: InlineImplFn = (_inputs, _props, context) => ({
  databaseId: context?.databaseId ?? null,
  namespaceId: context?.namespaceId ?? null,
  entityId: context?.entityId ?? null,
  organizationId: context?.organizationId ?? null,
  entityType: context?.entityType ?? null,
  actorId: context?.actorId ?? null,
  principalId: context?.principalId ?? null,
  scope: context?.scope ?? null,
  executionId: context?.executionId ?? null,
  taskIdentifier: context?.taskIdentifier ?? null,
});

export const ctxAdapter: InlineAdapter = {
  name: '@fbp/ctx',
  nodes: [{ taskIdentifier: 'ctx:request', impl: ctxRequest }],
};

export default ctxAdapter;
