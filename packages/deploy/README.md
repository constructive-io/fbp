# @fbp/deploy

Inline node adapter for the constructive-db compute worker.

Exports `deployAdapter` (an `InlineAdapter`) providing the inline node implementations for
`manifest:parse`, `image:ref` and `deploy:plan` — the pure half of deploying a repository.

```ts
import { InlineRegistry } from '@fbp/core';
import { deployAdapter } from '@fbp/deploy';

const registry = new InlineRegistry();
registry.register(deployAdapter);
```

Everything that *acts* on these decisions is an existing node — `build:image` (source →
image → registry → catalog row), `deployment:function_provision` / `function_update`,
`infra:confirm` for readiness, `http_route:reconcile` for the edge objects. So this package
contains no I/O of any kind: no database, no queue, no Kubernetes, no secrets, no registry
calls, no clock. That is what makes it inline.

## `manifest:parse`

The handler manifests found in a built image in, one function descriptor per registrable
definition out. The descriptor field names mirror `metaschema_private.register_function`'s
named arguments (as `fun register` maps them in
`compute/fun/cli/src/commands/register.ts`), so the `runtime='sql'` node that writes the rows
needs no translation layer.

| | |
| --- | --- |
| inputs | `manifests` — the raw `handler.json` documents, in discovery order |
| props | `scope` (required — where the run registers), `image` (fallback image name) |
| outputs | `descriptors`, `count` |

A manifest declaring `methods` becomes one descriptor per method, each inheriting what it
does not state itself — which is how one image serves many tasks (`mantra:signin`,
`mantra:robots_txt`, …).

Faults, all of which throw: no `scope` prop (never defaulted — a guessed scope registers a
function nothing can resolve while every step reports success), a manifest that states a
`scope` of its own (a manifest describes the function; where it is registered belongs to the
deployment), a `taskIdentifier` that disagrees with `<category>:<name>` (`task_identifier` is a generated
column), an unknown runtime, `runtime: "http"` with no image, a duplicate task identifier, a
`runtime: "sql"` manifest declaring both dispatch modes or neither.

`delivery: "lane"` requirements are deliberately dropped from the projected columns: those
values are fetched by the workload over its gateway lane at the moment of use, so registering
them as projected requirements would gate the resource on a value the scope's store will
never hold.

## `image:ref`

Image parts in, one canonical reference out — or one reference in, its parts out.

| | |
| --- | --- |
| inputs | `registry`, `repository`, `tag`, `digest` — or `ref` to split (never both) |
| props | `prefer` (`'digest'` default, or `'tag'`), `defaultTag` |
| outputs | `ref`, `registry`, `repository`, `tag`, `digest`, `immutable` |

Canonical form is `[registry/]repository[@digest | :tag]`, and a digest wins by default: a
deployment that resolves a tag twice can get two different images. Parsing a reference this
node emitted yields the same parts.

The trap it exists to hold in one place: whether a leading segment is a registry host or the
first segment of the repository path. `library/nginx` has no registry; `foo.io/bar` and
`localhost:5000/bar` do.

## `deploy:plan`

The set a new image should serve against the set currently deployed, in; what to change, out.
It decides and never acts.

| | |
| --- | --- |
| inputs | `desired` (from `manifest:parse`), `actual`, `image_ref` (from `image:ref`) |
| props | `prune` (default `false`) |
| outputs | `provision`, `update`, `unchanged`, `deprovision`, `orphaned`, `changed` |

The buckets partition their inputs exactly, and every one is sorted by task identifier so two
plans are comparable. Only `image_ref` decides an update — descriptor metadata is the
registration node's business. A surplus function is `orphaned` unless `prune` is set:
deleting a running function is opt-in, because an image built from a branch that happens not
to contain a handler is the common case.

A task whose `runtime` differs between desired and actual throws rather than being planned as
an update: that changes dispatch shape entirely, and rolling it out as an update would leave a
definition nothing can serve.
