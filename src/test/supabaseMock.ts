import { vi } from 'vitest'

export interface QueryResult {
  data?: unknown
  error?: { message: string } | null
}

/**
 * Mimics the chainable Postgrest query builder (`.from().select().order()...`),
 * which is "thenable" — awaiting it resolves to `{ data, error }`.
 */
export function createChainable(result: QueryResult) {
  const resolved = { data: result.data ?? null, error: result.error ?? null }

  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    then: (resolve: (value: QueryResult) => void) => Promise.resolve(resolved).then(resolve),
  }

  return chain
}

export function createChannelMock() {
  const channel: Record<string, unknown> = {
    on: vi.fn(() => channel),
    subscribe: vi.fn(() => channel),
  }
  return channel
}

export function createSupabaseMock() {
  return {
    from: vi.fn(() => createChainable({ data: [], error: null })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: vi.fn(() => createChannelMock()),
    removeChannel: vi.fn(),
  }
}
