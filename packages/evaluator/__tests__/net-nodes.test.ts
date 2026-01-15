import { graphqlRequestDef } from '../__fixtures__/net-definitions';

describe('net nodes', () => {
  describe('net/graphql/request', () => {
    it('should return error when no endpoint specified', async () => {
      const result = await graphqlRequestDef.impl!(
        { variables: {}, headers: {} },
        { document: 'query { users { id } }', endpoint: '' }
      );

      expect(result).toEqual({
        data: null,
        error: { message: 'No endpoint specified' },
        ok: false
      });
    });

    it('should return error when no document specified', async () => {
      const result = await graphqlRequestDef.impl!(
        { variables: {}, headers: {} },
        { document: '', endpoint: 'https://api.example.com/graphql' }
      );

      expect(result).toEqual({
        data: null,
        error: { message: 'No document specified' },
        ok: false
      });
    });

    it('should handle network errors gracefully', async () => {
      // Mock fetch to throw an error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      try {
        const result = await graphqlRequestDef.impl!(
          { variables: { id: 1 }, headers: {} },
          { 
            document: 'query GetUser($id: ID!) { user(id: $id) { name } }',
            endpoint: 'https://api.example.com/graphql',
            timeout: 5000
          }
        );

        expect(result).toEqual({
          data: null,
          error: { message: 'Network error' },
          ok: false
        });
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle HTTP errors', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      try {
        const result = await graphqlRequestDef.impl!(
          { variables: {}, headers: {} },
          { 
            document: 'query { users { id } }',
            endpoint: 'https://api.example.com/graphql'
          }
        );

        expect(result).toEqual({
          data: null,
          error: { 
            message: 'HTTP error: 500 Internal Server Error',
            statusCode: 500
          },
          ok: false
        });
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle GraphQL errors in response', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: null,
          errors: [{ message: 'User not found' }]
        })
      });

      try {
        const result = await graphqlRequestDef.impl!(
          { variables: { id: 999 }, headers: {} },
          { 
            document: 'query GetUser($id: ID!) { user(id: $id) { name } }',
            endpoint: 'https://api.example.com/graphql'
          }
        );

        expect(result).toEqual({
          data: null,
          error: [{ message: 'User not found' }],
          ok: false
        });
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should return data on successful request', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { user: { id: 1, name: 'Alice' } }
        })
      });

      try {
        const result = await graphqlRequestDef.impl!(
          { variables: { id: 1 }, headers: { Authorization: 'Bearer token' } },
          { 
            document: 'query GetUser($id: ID!) { user(id: $id) { id name } }',
            endpoint: 'https://api.example.com/graphql'
          }
        );

        expect(result).toEqual({
          data: { user: { id: 1, name: 'Alice' } },
          error: null,
          ok: true
        });

        // Verify fetch was called with correct parameters
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/graphql',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer token'
            }),
            body: JSON.stringify({
              query: 'query GetUser($id: ID!) { user(id: $id) { id name } }',
              variables: { id: 1 },
              operationName: undefined
            })
          })
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should include operationName when provided', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { users: [] } })
      });

      try {
        await graphqlRequestDef.impl!(
          { variables: {}, headers: {} },
          { 
            document: 'query GetUsers { users { id } }',
            operationName: 'GetUsers',
            endpoint: 'https://api.example.com/graphql'
          }
        );

        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/graphql',
          expect.objectContaining({
            body: JSON.stringify({
              query: 'query GetUsers { users { id } }',
              variables: {},
              operationName: 'GetUsers'
            })
          })
        );
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
