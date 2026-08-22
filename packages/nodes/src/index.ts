import { constAdapter } from '@fbp/const';
import type { InlineAdapter } from '@fbp/core';
import { InlineRegistry } from '@fbp/core';
import { ctxAdapter } from '@fbp/ctx';
import { deployAdapter } from '@fbp/deploy';
import { flowAdapter } from '@fbp/flow';
import { jsonAdapter } from '@fbp/json';
import { mathAdapter } from '@fbp/math';
import { stringAdapter } from '@fbp/string';
import { textAdapter } from '@fbp/text';

/**
 * The default set of inline node adapters shipped with the platform. Runtimes
 * (compute-service, future k8s runners, …) compose their inline
 * registry from these instead of wiring each adapter by hand.
 */
export const defaultInlineAdapters: InlineAdapter[] = [
  mathAdapter,
  jsonAdapter,
  flowAdapter,
  constAdapter,
  stringAdapter,
  textAdapter,
  ctxAdapter,
  deployAdapter,
];

/**
 * Build an InlineRegistry pre-populated with the default adapters. Pass `extra`
 * to register additional (or overriding) adapters after the defaults.
 */
export const createDefaultInlineRegistry = (
  extra: InlineAdapter[] = []
): InlineRegistry => {
  const registry = new InlineRegistry();
  for (const adapter of [...defaultInlineAdapters, ...extra]) {
    registry.register(adapter);
  }
  return registry;
};

export {
  constAdapter,
  ctxAdapter,
  deployAdapter,
  flowAdapter,
  jsonAdapter,
  mathAdapter,
  stringAdapter,
  textAdapter,
};
