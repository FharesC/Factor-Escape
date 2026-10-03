import { createServer } from 'node:http'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.argv.includes('--dev')
const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOSTNAME || '0.0.0.0'
const app = next({ dev, hostname, port, webpack: true })
const handle = app.getRequestHandler()
const rooms = new Map()

function roomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  } while (rooms.has(code))
  return code
}

function publicRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    questionIndex: room.questionIndex,
    exerciseIds: room.exerciseIds,
    players: [...room.players.values()].map(({ id, name, score, answered, connected }) => ({ id, name, score, answered, connected })),
  }
}

await app.prepare()
const httpServer = createServer((request, response) => handle(request, response))
const io = new Server(httpServer, { path: '/socket.io' })

const publish = room => io.to(room.code).emit('room:state', publicRoom(room))

io.on('connection', socket => {
  socket.on('room:create', ({ name, exerciseIds }, reply) => {
    const cleanName = String(name || '').trim().slice(0, 24)
    if (!cleanName || !Array.isArray(exerciseIds) || exerciseIds.length !== 5) return reply({ ok: false, error: 'Datos de sala inválidos.' })
    const code = roomCode()
    const room = { code, hostId: socket.id, status: 'lobby', questionIndex: 0, exerciseIds, players: new Map() }
    room.players.set(socket.id, { id: socket.id, name: cleanName, score: 0, answered: false, connected: true })
    rooms.set(code, room)
    socket.join(code)
    reply({ ok: true, room: publicRoom(room) })
    publish(room)
  })

  socket.on('room:join', ({ code, name }, reply) => {
    const room = rooms.get(String(code || '').trim().toUpperCase())
    const cleanName = String(name || '').trim().slice(0, 24)
    if (!room) return reply({ ok: false, error: 'La sala no existe.' })
    if (room.status !== 'lobby') return reply({ ok: false, error: 'La partida ya comenzó.' })
    if (!cleanName) return reply({ ok: false, error: 'Escribe tu nombre.' })
    if ([...room.players.values()].some(player => player.name.toLocaleLowerCase('es') === cleanName.toLocaleLowerCase('es'))) return reply({ ok: false, error: 'Ese nombre ya está en uso.' })
    if (room.players.size >= 20) return reply({ ok: false, error: 'La sala está llena.' })
    room.players.set(socket.id, { id: socket.id, name: cleanName, score: 0, answered: false, connected: true })
    socket.join(room.code)
    reply({ ok: true, room: publicRoom(room) })
    publish(room)
  })

  socket.on('game:start', ({ code }, reply = () => {}) => {
    const room = rooms.get(code)
    if (!room || room.hostId !== socket.id || room.status !== 'lobby') return reply({ ok: false })
    room.status = 'playing'
    room.questionIndex = 0
    for (const player of room.players.values()) player.answered = false
    publish(room)
    reply({ ok: true })
  })

  socket.on('game:answer', ({ code, correct, attempt }, reply = () => {}) => {
    const room = rooms.get(code)
    const player = room?.players.get(socket.id)
    if (!room || room.status !== 'playing' || !player || player.answered) return reply({ ok: false })
    const safeAttempt = Math.max(1, Math.min(3, Number(attempt) || 3))
    const points = correct ? (safeAttempt === 1 ? 3 : safeAttempt === 2 ? 1 : 0) : 0
    player.score += points
    player.answered = true
    publish(room)
    reply({ ok: true, points })
  })

  socket.on('game:next', ({ code }, reply = () => {}) => {
    const room = rooms.get(code)
    if (!room || room.hostId !== socket.id || room.status !== 'playing') return reply({ ok: false })
    const connected = [...room.players.values()].filter(player => player.connected)
    if (!connected.length || !connected.every(player => player.answered)) return reply({ ok: false, error: 'Aún faltan respuestas.' })
    if (room.questionIndex >= room.exerciseIds.length - 1) room.status = 'results'
    else {
      room.questionIndex += 1
      for (const player of room.players.values()) player.answered = false
    }
    publish(room)
    reply({ ok: true })
  })

  socket.on('disconnect', () => {
    for (const [code, room] of rooms) {
      const player = room.players.get(socket.id)
      if (!player) continue
      if (room.status === 'lobby') room.players.delete(socket.id)
      else player.connected = false
      if (room.hostId === socket.id) {
        const nextHost = [...room.players.values()].find(candidate => candidate.connected)
        if (nextHost) room.hostId = nextHost.id
      }
      if (![...room.players.values()].some(candidate => candidate.connected)) rooms.delete(code)
      else publish(room)
    }
  })
})

httpServer.listen(port, hostname, () => {
  console.log(`> Factor Escape listo en http://localhost:${port}`)
  console.log('> Otros dispositivos pueden entrar usando la IP local de este equipo.')
})
