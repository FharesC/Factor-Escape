import type { WebSocket } from '@vercel/functions'
import { redis } from './redis.ts'

export type Player = { id: string; name: string; score: number; answered: boolean; connected: boolean }
export type Room = { code: string; hostId: string; status: 'lobby' | 'playing' | 'results'; questionIndex: number; exerciseIds: string[]; players: Player[] }
export type ClientEvent = { type: string; requestId?: string; clientId?: string; code?: string; name?: string; exerciseIds?: string[]; correct?: boolean; attempt?: number }

type Connection = { clientId: string; code: string }
type ServerMessage = { type: 'reply'; requestId?: string; ok: boolean; error?: string; room?: Room; points?: number } | { type: 'state'; room: Room }

const ROOM_TTL_SECONDS = 60 * 60 * 4
const STREAM_KEY = 'factor-escape:events'
const memoryRooms = new Map<string, Room>()
const hub = {
  id: crypto.randomUUID(),
  connections: new Map<WebSocket, Connection>(),
  streamClient: null as ReturnType<NonNullable<typeof redis>['duplicate']> | null,
  streaming: false,
  lastId: '$',
}

const keyFor = (code: string) => `factor-escape:room:${code}`
const cleanCode = (value?: string) => String(value || '').trim().toUpperCase()
const cleanName = (value?: string) => String(value || '').trim().slice(0, 24)

function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message))
}

function reply(ws: WebSocket, requestId: string | undefined, result: Omit<Extract<ServerMessage, { type: 'reply' }>, 'type' | 'requestId'>) {
  send(ws, { type: 'reply', requestId, ...result })
}

function broadcastLocal(room: Room) {
  for (const [socket, connection] of hub.connections) {
    if (connection.code === room.code) send(socket, { type: 'state', room })
  }
}

async function publish(room: Room) {
  broadcastLocal(room)
  if (!redis) return
  await redis.xadd(STREAM_KEY, 'MAXLEN', '~', 200, '*', 'room', JSON.stringify(room), 'origin', hub.id)
}

async function readRoom(code: string): Promise<Room | null> {
  if (!redis) return memoryRooms.get(code) ?? null
  const value = await redis.get(keyFor(code))
  return value ? JSON.parse(value) as Room : null
}

async function saveNewRoom(room: Room): Promise<boolean> {
  if (!redis) {
    if (memoryRooms.has(room.code)) return false
    memoryRooms.set(room.code, room)
    return true
  }
  return (await redis.set(keyFor(room.code), JSON.stringify(room), 'EX', ROOM_TTL_SECONDS, 'NX')) === 'OK'
}

async function updateRoom(code: string, update: (room: Room) => { room?: Room; error?: string; points?: number }): Promise<{ room?: Room; error?: string; points?: number }> {
  if (!redis) {
    const current = memoryRooms.get(code)
    if (!current) return { error: 'La sala no existe.' }
    const result = update(structuredClone(current))
    if (result.room) memoryRooms.set(code, result.room)
    return result
  }
  const key = keyFor(code)
  for (let attempt = 0; attempt < 5; attempt++) {
    await redis.watch(key)
    const value = await redis.get(key)
    if (!value) { await redis.unwatch(); return { error: 'La sala no existe.' } }
    const result = update(JSON.parse(value) as Room)
    if (!result.room) { await redis.unwatch(); return result }
    const committed = await redis.multi().set(key, JSON.stringify(result.room), 'EX', ROOM_TTL_SECONDS).exec()
    if (committed) return result
  }
  return { error: 'La sala cambió al mismo tiempo. Intenta de nuevo.' }
}

function roomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

async function create(ws: WebSocket, event: ClientEvent) {
  const name = cleanName(event.name)
  const clientId = String(event.clientId || '').slice(0, 64)
  if (!name || !clientId || !Array.isArray(event.exerciseIds) || event.exerciseIds.length !== 5) return reply(ws, event.requestId, { ok: false, error: 'Datos de sala inválidos.' })
  let room: Room | null = null
  for (let attempt = 0; attempt < 5 && !room; attempt++) {
    const code = roomCode()
    const candidate: Room = { code, hostId: clientId, status: 'lobby', questionIndex: 0, exerciseIds: event.exerciseIds, players: [{ id: clientId, name, score: 0, answered: false, connected: true }] }
    if (await saveNewRoom(candidate)) room = candidate
  }
  if (!room) return reply(ws, event.requestId, { ok: false, error: 'No fue posible crear la sala.' })
  hub.connections.set(ws, { clientId, code: room.code })
  reply(ws, event.requestId, { ok: true, room })
  await publish(room)
}

async function join(ws: WebSocket, event: ClientEvent) {
  const code = cleanCode(event.code)
  const name = cleanName(event.name)
  const clientId = String(event.clientId || '').slice(0, 64)
  const result = await updateRoom(code, room => {
    if (room.status !== 'lobby') return { error: 'La partida ya comenzó.' }
    if (!name || !clientId) return { error: 'Escribe tu nombre.' }
    if (room.players.some(player => player.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) return { error: 'Ese nombre ya está en uso.' }
    if (room.players.length >= 20) return { error: 'La sala está llena.' }
    room.players.push({ id: clientId, name, score: 0, answered: false, connected: true })
    return { room }
  })
  if (!result.room) return reply(ws, event.requestId, { ok: false, error: result.error })
  hub.connections.set(ws, { clientId, code })
  reply(ws, event.requestId, { ok: true, room: result.room })
  await publish(result.room)
}

async function resume(ws: WebSocket, event: ClientEvent) {
  const code = cleanCode(event.code)
  const clientId = String(event.clientId || '').slice(0, 64)
  const result = await updateRoom(code, room => {
    const player = room.players.find(item => item.id === clientId)
    if (!player) return { error: 'Ya no perteneces a esta sala.' }
    player.connected = true
    return { room }
  })
  if (!result.room) return reply(ws, event.requestId, { ok: false, error: result.error })
  hub.connections.set(ws, { clientId, code })
  reply(ws, event.requestId, { ok: true, room: result.room })
  await publish(result.room)
}

async function action(ws: WebSocket, event: ClientEvent) {
  const connection = hub.connections.get(ws)
  if (!connection) return reply(ws, event.requestId, { ok: false, error: 'Conexión sin sala.' })
  const result = await updateRoom(connection.code, room => {
    const player = room.players.find(item => item.id === connection.clientId)
    if (!player) return { error: 'Participante no encontrado.' }
    if (event.type === 'start') {
      if (room.hostId !== player.id || room.status !== 'lobby') return { error: 'Solo el anfitrión puede iniciar.' }
      room.status = 'playing'; room.questionIndex = 0
      room.players.forEach(item => { item.answered = false })
    } else if (event.type === 'answer') {
      if (room.status !== 'playing' || player.answered) return { error: 'La respuesta ya fue registrada.' }
      const attempt = Math.max(1, Math.min(3, Number(event.attempt) || 3))
      const points = event.correct ? (attempt === 1 ? 3 : attempt === 2 ? 1 : 0) : 0
      player.score += points; player.answered = true
      return { room, points }
    } else if (event.type === 'next') {
      if (room.hostId !== player.id || room.status !== 'playing') return { error: 'Solo el anfitrión puede avanzar.' }
      const active = room.players.filter(item => item.connected)
      if (!active.length || !active.every(item => item.answered)) return { error: 'Aún faltan respuestas.' }
      if (room.questionIndex >= room.exerciseIds.length - 1) room.status = 'results'
      else { room.questionIndex += 1; room.players.forEach(item => { item.answered = false }) }
    }
    return { room }
  })
  if (!result.room) return reply(ws, event.requestId, { ok: false, error: result.error })
  reply(ws, event.requestId, { ok: true, room: result.room, points: result.points })
  await publish(result.room)
}

async function leave(ws: WebSocket, event: ClientEvent) {
  const connection = hub.connections.get(ws)
  if (!connection?.code) return reply(ws, event.requestId, { ok: true })
  const result = await updateRoom(connection.code, room => {
    const player = room.players.find(item => item.id === connection.clientId)
    if (!player) return { room }
    if (room.status === 'lobby') room.players = room.players.filter(item => item.id !== player.id)
    else player.connected = false
    if (room.hostId === player.id) {
      const replacement = room.players.find(item => item.connected && item.id !== player.id)
      if (replacement) room.hostId = replacement.id
    }
    return { room }
  })
  hub.connections.delete(ws)
  reply(ws, event.requestId, { ok: true, room: result.room })
  if (result.room) await publish(result.room)
}

export function register(ws: WebSocket) {
  hub.connections.set(ws, { clientId: '', code: '' })
  startStream()
}

export async function handleEvent(ws: WebSocket, event: ClientEvent) {
  try {
    if (event.type === 'create') return await create(ws, event)
    if (event.type === 'join') return await join(ws, event)
    if (event.type === 'resume') return await resume(ws, event)
    if (event.type === 'leave') return await leave(ws, event)
    if (['start', 'answer', 'next'].includes(event.type)) return await action(ws, event)
  } catch (error) {
    console.error('[Factor Escape] Evento en tiempo real falló', error)
    reply(ws, event.requestId, { ok: false, error: 'No fue posible actualizar la sala.' })
  }
}

export async function unregister(ws: WebSocket) {
  const connection = hub.connections.get(ws)
  hub.connections.delete(ws)
  if (!connection?.code || !connection.clientId) return
  const stillLocal = [...hub.connections.values()].some(item => item.code === connection.code && item.clientId === connection.clientId)
  if (stillLocal) return
  const result = await updateRoom(connection.code, room => {
    const player = room.players.find(item => item.id === connection.clientId)
    if (!player) return { room }
    player.connected = false
    return { room }
  })
  if (result.room) await publish(result.room)
}

function startStream() {
  if (!redis || hub.streaming) return
  hub.streaming = true
  hub.streamClient = redis.duplicate()
  void (async () => {
    while (hub.streaming && hub.streamClient) {
      try {
        const response = await hub.streamClient.xread('BLOCK', 5000, 'STREAMS', STREAM_KEY, hub.lastId) as Array<[string, Array<[string, string[]]>]> | null
        if (!response) continue
        for (const [, entries] of response) for (const [id, fields] of entries) {
          hub.lastId = id
          const values = Object.fromEntries(Array.from({ length: fields.length / 2 }, (_, index) => [fields[index * 2], fields[index * 2 + 1]]))
          if (values.origin !== hub.id && values.room) broadcastLocal(JSON.parse(values.room) as Room)
        }
      } catch (error) {
        console.error('[Factor Escape] Redis stream interrumpido', error)
      }
    }
  })()
}
