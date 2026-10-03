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
  register(admin)
  register(team)

  await handleEvent(admin, { type: 'create', requestId: 'create', clientId: 'admin', name: 'Profesor', exerciseIds: ['fc-1', 'fca-1', 'tcp-1', 'dc-1', 'tx-1'] })
  const created = admin.reply('create')
  assert.equal(created.room.players.length, 0)
  assert.equal(created.room.hostName, 'Profesor')

  await handleEvent(team, { type: 'join', requestId: 'join', clientId: 'team', name: 'Equipo 1', code: created.room.code })
  await handleEvent(admin, { type: 'start', requestId: 'start' })
  await handleEvent(admin, { type: 'answer', requestId: 'admin-answer', correct: true, attempt: 1 })
  assert.equal(admin.reply('admin-answer').ok, false)

  await handleEvent(admin, { type: 'next', requestId: 'next' })
  assert.equal(admin.reply('next').room.questionIndex, 1)
})
