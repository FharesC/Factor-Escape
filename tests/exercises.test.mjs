import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exercises, levelMeta } from '../data/exercises.ts'

test('los casos respetan el orden solicitado', () => {
  assert.deepEqual(levelMeta.map(level => level.type), ['common', 'grouping', 'perfect', 'squares', 'pair'])
})

test('cada nivel tiene cinco ejercicios equilibrados y piezas válidas', () => {
  for (const level of levelMeta) {
    const items = exercises[level.type]
    assert.equal(items.length, 5)
    assert.ok(items.every(item => item.difficulty === 'ESTÁNDAR'))
    for (const item of items) {
      assert.equal(item.type, level.type)
      assert.equal(item.options.length, 4)
      assert.equal(new Set(item.options).size, 4)
      assert.equal(item.options.filter(option => option === item.answer).length, 1)
      assert.ok(item.expression && item.hint)
    }
  }
})

test('hay 25 ejercicios únicos', () => {
  const all = Object.values(exercises).flat()
  assert.equal(all.length, 25)
  assert.equal(new Set(all.map(item => item.id)).size, 25)
})
