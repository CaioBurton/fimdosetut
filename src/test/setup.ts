import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { limparTodosOsCaches } from '../lib/cacheRegistro'

afterEach(() => {
  cleanup()
  limparTodosOsCaches()
})
