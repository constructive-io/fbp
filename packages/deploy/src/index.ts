import type { InlineAdapter } from '@fbp/core';

import { imageRef } from './image';
import { manifestParse } from './manifest';
import { deployPlan } from './plan';

/**
 * The pure half of deploying a repository: read what an image serves
 * (`manifest:parse`), name the image unambiguously (`image:ref`), and decide what
 * to change (`deploy:plan`).
 *
 * Everything that acts on those decisions is an existing node — `build:image`,
 * `deployment:function_provision`, `infra:confirm`, `http_route:reconcile` — so
 * this adapter deliberately contains no I/O of any kind.
 */
export const deployAdapter: InlineAdapter = {
  name: '@fbp/deploy',
  nodes: [
    { taskIdentifier: 'manifest:parse', impl: manifestParse },
    { taskIdentifier: 'image:ref', impl: imageRef },
    { taskIdentifier: 'deploy:plan', impl: deployPlan },
  ],
};

export { imageRef, manifestParse, deployPlan };
export type {
  FunctionDescriptor,
  FunctionRuntime,
  ManifestRequirement,
  SqlDispatch,
} from './manifest';
export type { ImageReference } from './image';
export type { ActualEntry, DesiredEntry, ProvisionEntry, UpdateEntry } from './plan';

export default deployAdapter;
