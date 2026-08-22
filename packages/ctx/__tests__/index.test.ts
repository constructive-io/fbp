import { InlineRegistry } from '@fbp/core';

import { ctxAdapter } from '../src/index';

const impl = ctxAdapter.nodes[0].impl;

describe('ctxAdapter', () => {
  it('has the expected name and node', () => {
    expect(ctxAdapter.name).toBe('@fbp/ctx');
    expect(ctxAdapter.nodes.map((n) => n.taskIdentifier)).toEqual(['ctx:request']);
  });

  it('projects the invocation context onto output ports', () => {
    expect(
      impl({}, {}, {
        databaseId: 'db-1',
        namespaceId: 'ns-1',
        entityId: 'ent-1',
        organizationId: 'org-1',
        entityType: 'organization',
        actorId: 'user-1',
        principalId: 'user-1',
        scope: 'database',
        executionId: 'exec-1',
        taskIdentifier: 'ctx:request',
      })
    ).toEqual({
      databaseId: 'db-1',
      namespaceId: 'ns-1',
      entityId: 'ent-1',
      organizationId: 'org-1',
      entityType: 'organization',
      actorId: 'user-1',
      principalId: 'user-1',
      scope: 'database',
      executionId: 'exec-1',
      taskIdentifier: 'ctx:request',
    });
  });

  it('reports null rather than inventing values when a runtime passes no context', () => {
    const result = impl({}, {}) as Record<string, unknown>;
    expect(Object.values(result).every((v) => v === null)).toBe(true);
    expect(result.databaseId).toBeNull();
  });

  it('reports null for the fields a partial context omits', () => {
    const result = impl({}, {}, { databaseId: 'db-1' }) as Record<string, unknown>;
    expect(result.databaseId).toBe('db-1');
    expect(result.entityId).toBeNull();
    expect(result.actorId).toBeNull();
  });

  it('registers into an InlineRegistry', () => {
    const registry = new InlineRegistry();
    registry.register(ctxAdapter);
    expect(registry.has('ctx:request')).toBe(true);
  });
});
