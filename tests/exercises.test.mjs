import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exercises, exercisesPerLevel, levelMeta, replaceExercise } from '../data/exercises.ts'

test('los casos respetan el orden solicitado', () => {
  assert.deepEqual(levelMeta.map(level => level.type), ['common', 'grouping', 'perfect', 'squares', 'pair'])
})

test('cada nivel permite cinco ejercicios y cuatro alternativas con piezas válidas', () => {
  assert.equal(exercisesPerLevel, 5)
  for (const level of levelMeta) {
    const items = exercises[level.type]
    assert.equal(items.length, exercisesPerLevel + 4)
    assert.equal(new Set(items.map(item => item.expression)).size, items.length)
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

test('hay 45 ejercicios únicos', () => {
  const all = Object.values(exercises).flat()
  assert.equal(all.length, 45)
  assert.equal(new Set(all.map(item => item.id)).size, 45)
})

test('cambiar usa las reservas y conserva ejercicios terminados y pendientes', () => {
  const original = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  let order = original
  for (const replacement of [5, 6, 7, 8, 2]) {
    order = replaceExercise(order, 2)
    assert.equal(order[2], replacement)
    assert.deepEqual(order.slice(0, 2), [0, 1])
    assert.deepEqual(order.slice(3, 5), [3, 4])
    assert.equal(new Set(order).size, original.length)
  }
  assert.deepEqual(original, [0, 1, 2, 3, 4, 5, 6, 7, 8])
})

test('el quinto ejercicio también puede cambiarse sin avanzar de nivel', () => {
  const order = replaceExercise([0, 1, 2, 3, 4, 5, 6, 7, 8], 4)
  assert.deepEqual(order, [0, 1, 2, 3, 5, 6, 7, 8, 4])
})
