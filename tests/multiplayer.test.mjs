import test from 'node:test'
import assert from 'node:assert/strict'
import { handleEvent, register } from '../lib/game-realtime.ts'

class FakeSocket {
  OPEN = 1
  readyState = 1
  messages = []
  send(value) { this.messages.push(JSON.parse(value)) }
  reply(requestId) { return this.messages.findLast(message => message.type === 'reply' && message.requestId === requestId) }
}

test('el administrador observa y controla la ronda sin participar', async () => {
  const admin = new FakeSocket()
  const team = new FakeSocket()
  const secondTeam = new FakeSocket()
  register(admin)
  register(team)
  register(secondTeam)

  await handleEvent(admin, { type: 'create', requestId: 'create', clientId: 'admin', name: 'Profesor', exerciseIds: Array.from({ length: 25 }, (_, index) => `exercise-${index}`) })
  const created = admin.reply('create')
  assert.equal(created.room.players.length, 0)
  assert.equal(created.room.hostName, 'Profesor')

  await handleEvent(team, { type: 'join', requestId: 'join', clientId: 'team', name: 'Equipo 1', code: created.room.code })
  await handleEvent(secondTeam, { type: 'join', requestId: 'join-2', clientId: 'team-2', name: 'Equipo 2', code: created.room.code })
  await handleEvent(admin, { type: 'start', requestId: 'start' })
  await handleEvent(admin, { type: 'answer', requestId: 'admin-answer', correct: true, attempt: 1 })
  assert.equal(admin.reply('admin-answer').ok, false)

  await handleEvent(admin, { type: 'next', requestId: 'early-next' })
  assert.equal(admin.reply('early-next').ok, false)

  for (let exercise = 0; exercise < 4; exercise++) {
    await handleEvent(team, { type: 'answer', requestId: `answer-${exercise}-1`, correct: true, attempt: 1 })
    assert.equal(team.reply(`answer-${exercise}-1`).points, 20)
    await handleEvent(secondTeam, { type: 'answer', requestId: `answer-${exercise}-2`, correct: true, attempt: 2 })
    assert.equal(secondTeam.reply(`answer-${exercise}-2`).points, 18)
    assert.equal(secondTeam.reply(`answer-${exercise}-2`).room.questionIndex, exercise + 1)
  }

  await handleEvent(admin, { type: 'next', requestId: 'unfinished-module' })
  assert.equal(admin.reply('unfinished-module').ok, false)
  await handleEvent(secondTeam, { type: 'answer', requestId: 'fifth-answer-2', correct: true, attempt: 1 })
  assert.equal(secondTeam.reply('fifth-answer-2').points, 20)
  await handleEvent(team, { type: 'answer', requestId: 'fifth-answer', correct: true, attempt: 1 })
  assert.equal(team.reply('fifth-answer').points, 19)
  await handleEvent(admin, { type: 'next', requestId: 'next-module' })
  assert.equal(admin.reply('next-module').room.questionIndex, 5)
})
