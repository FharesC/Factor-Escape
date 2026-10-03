import test from 'node:test'
import assert from 'node:assert/strict'
import { equivalentFactorization } from '../lib/factorization.ts'

test('acepta factores equivalentes en distinto orden', () => {
  assert.equal(equivalentFactorization('(x−5)(x−4)', '(x−4)(x−5)'), true)
  assert.equal(equivalentFactorization('(x−5)(x+4)', '(x−4)(x−5)'), false)
})

test('conserva el factor común exterior', () => {
  assert.equal(equivalentFactorization('14x²y³(2x+3y−1)', '14x²y³(2x+3y−1)'), true)
  assert.equal(equivalentFactorization('7x²y³(2x+3y−1)', '14x²y³(2x+3y−1)'), false)
})
