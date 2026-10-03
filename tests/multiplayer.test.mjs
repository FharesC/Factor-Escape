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

  await handleEvent(admin, { type: 'create', requestId: 'create', clientId: 'admin', name: 'Profesor', exerciseIds: ['fc-1', 'fc-2', 'fca-1', 'fca-2', 'tcp-1', 'tcp-2', 'dc-1', 'dc-2', 'tx-1', 'tx-2'] })
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

  await handleEvent(team, { type: 'answer', requestId: 'first-answer', correct: true, attempt: 1 })
  assert.equal(team.reply('first-answer').points, 20)
  assert.equal(team.reply('first-answer').room.questionIndex, 0)
  await handleEvent(secondTeam, { type: 'answer', requestId: 'first-answer-2', correct: true, attempt: 2 })
  assert.equal(secondTeam.reply('first-answer-2').points, 18)
  assert.equal(secondTeam.reply('first-answer-2').room.questionIndex, 1)

  await handleEvent(admin, { type: 'next', requestId: 'unfinished-module' })
  assert.equal(admin.reply('unfinished-module').ok, false)
  await handleEvent(secondTeam, { type: 'answer', requestId: 'second-answer-2', correct: true, attempt: 1 })
  assert.equal(secondTeam.reply('second-answer-2').points, 20)
  await handleEvent(team, { type: 'answer', requestId: 'second-answer', correct: true, attempt: 1 })
  assert.equal(team.reply('second-answer').points, 19)
  await handleEvent(admin, { type: 'next', requestId: 'next-module' })
  assert.equal(admin.reply('next-module').room.questionIndex, 2)
})
