import { expect, test } from 'vitest'
import { ENGINE_VERSION } from './index'

test('engine version is set', () => {
  expect(ENGINE_VERSION).toBe('0.1.0')
})
