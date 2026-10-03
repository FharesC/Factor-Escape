'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, Copy, Crown, Hash, LogIn, Play, RotateCcw, Users } from 'lucide-react'
import { io, type Socket } from 'socket.io-client'
import { exercises, levelMeta, type Exercise } from '@/data/exercises'

type Player = { id: string; name: string; score: number; answered: boolean; connected: boolean }
type Room = { code: string; hostId: string; status: 'lobby' | 'playing' | 'results'; questionIndex: number; exerciseIds: string[]; players: Player[] }
type Reply = { ok: boolean; error?: string; room?: Room; points?: number }

const exerciseMap = new Map(Object.values(exercises).flat().map(exercise => [exercise.id, exercise]))
const split = (value: string): string[] => [...(value.replaceAll(' ', '').match(/[a-zA-Z](?:[²³⁴⁵⁶])?|\d+|[()+−]/g) ?? [])]
function shuffle<T>(items: T[]) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] } return result }
function piecesFor(exercise: Exercise) {
  const correct = split(exercise.answer)
  const pool = [...exercise.options.flatMap(split), '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', 'y', '+', '−', '(', ')', '²', '³']
  const extras = shuffle([...new Set(pool.filter(piece => !correct.includes(piece)))]).slice(0, 10)
  return shuffle([...correct, ...extras].map((value, index) => ({ id: `${index}-${value}`, value })))
}

function BackButton({ onClick }: { onClick: () => void }) { return <button className="icon-button" onClick={onClick} aria-label="Volver"><ChevronLeft /></button> }
function RoomHeader({ room, onLeave }: { room: Room; onLeave: () => void }) { return <header className="topbar multiplayer-topbar"><div className="flex items-center gap-4"><BackButton onClick={onLeave} /><strong className="room-brand">FACTOR ESCAPE</strong></div><div className="room-code-small"><Hash /> SALA <b>{room.code}</b></div></header> }

function MultiplayerEntry({ socket, onRoom, onBack }: { socket: Socket; onRoom: (room: Room) => void; onBack: () => void }) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const exerciseIds = () => levelMeta.map(level => {
    const candidates = exercises[level.type]
    return candidates[Math.floor(Math.random() * candidates.length)].id
  })
  const submit = () => {
    setError('')
    if (!name.trim()) return setError('Escribe tu nombre para continuar.')
    setBusy(true)
    const event = mode === 'create' ? 'room:create' : 'room:join'
    const payload = mode === 'create' ? { name, exerciseIds: exerciseIds() } : { name, code: code.toUpperCase() }
    socket.emit(event, payload, (reply: Reply) => {
      setBusy(false)
      if (!reply.ok || !reply.room) return setError(reply.error || 'No fue posible entrar a la sala.')
      onRoom(reply.room)
    })
  }
  return <main className="screen"><header className="topbar"><div className="flex items-center gap-4"><BackButton onClick={mode === 'choose' ? onBack : () => { setMode('choose'); setError('') }} /><strong className="room-brand">FACTOR ESCAPE</strong></div><span className="header-status">Multijugador en tiempo real</span></header><div className="multiplayer-entry">
    <div className="eyebrow"><Users /> SALAS MULTIJUGADOR</div>
    <h1>{mode === 'choose' ? 'Juega con tu clase.' : mode === 'create' ? 'Crea una sala.' : 'Únete a una sala.'}</h1>
    <p>{mode === 'choose' ? 'Todos resuelven el mismo ejercicio y el marcador se actualiza en tiempo real.' : 'Usa un nombre corto y fácil de reconocer.'}</p>
    {mode === 'choose' ? <div className="mode-grid"><button className="mode-card" onClick={() => setMode('create')}><Crown /><strong>Crear sala</strong><span>Serás el anfitrión y controlarás el avance.</span></button><button className="mode-card" onClick={() => setMode('join')}><LogIn /><strong>Unirse</strong><span>Ingresa el código compartido por el anfitrión.</span></button></div> : <form className="room-form" onSubmit={event => { event.preventDefault(); submit() }}>
      {mode === 'join' && <label>Código de sala<input value={code} onChange={event => setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase())} placeholder="ABC123" autoComplete="off" /></label>}
      <label>Tu nombre<input value={name} onChange={event => setName(event.target.value.slice(0, 24))} placeholder="Ej. Andrea" autoFocus /></label>
      {error && <p className="room-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={busy || (mode === 'join' && code.length !== 6)}>{busy ? 'CONECTANDO…' : mode === 'create' ? 'CREAR SALA' : 'ENTRAR A LA SALA'} <ArrowRight /></button>
    </form>}
  </div></main>
}

function Lobby({ room, socketId, socket, onLeave }: { room: Room; socketId: string; socket: Socket; onLeave: () => void }) {
  const host = room.hostId === socketId
  const [copied, setCopied] = useState(false)
  const copyCode = async () => { await navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 1300) }
  return <main className="screen"><RoomHeader room={room} onLeave={onLeave} /><div className="lobby-layout"><section className="lobby-code"><span>CÓDIGO DE LA SALA</span><strong>{room.code}</strong><button className="outline-button" onClick={copyCode}><Copy /> {copied ? 'COPIADO' : 'COPIAR CÓDIGO'}</button><p>Los participantes deben abrir esta misma dirección e ingresar el código.</p></section><section className="setup-card lobby-players"><div className="card-topline"><span>PARTICIPANTES</span><b>{room.players.length} / 20</b></div><div className="player-list">{room.players.map(player => <div key={player.id} className="player-row"><span className="team-avatar">{player.name.charAt(0).toUpperCase()}</span><strong>{player.name}</strong>{player.id === room.hostId && <Crown aria-label="Anfitrión" />}</div>)}</div>{host ? <button className="primary-button lobby-start" onClick={() => socket.emit('game:start', { code: room.code })}><Play /> INICIAR PARTIDA</button> : <div className="waiting-copy"><span className="status-dot" /> Esperando al anfitrión…</div>}</section></div></main>
}

function ExerciseBuilder({ exercise, disabled, onComplete }: { exercise: Exercise; disabled: boolean; onComplete: (correct: boolean, attempt: number) => void }) {
  const answer = useMemo(() => split(exercise.answer), [exercise.answer])
  const bank = useMemo(() => piecesFor(exercise), [exercise])
  const [placed, setPlaced] = useState<(string | null)[]>(() => answer.map(() => null))
  const [active, setActive] = useState(0)
  const [attempt, setAttempt] = useState(1)
  const [message, setMessage] = useState('')
  const counts = placed.reduce<Record<string, number>>((result, value) => { if (value) result[value] = (result[value] || 0) + 1; return result }, {})
  const available = bank.map((piece, index) => ({ ...piece, used: bank.slice(0, index).filter(item => item.value === piece.value).length < (counts[piece.value] || 0) }))
  const put = (value: string) => { if (disabled) return; const next = [...placed]; next[active] = value; setPlaced(next); setMessage(''); const empty = next.findIndex((item, index) => !item && index > active); setActive(empty >= 0 ? empty : Math.max(0, next.findIndex(item => !item))) }
  const clear = (index: number) => { const next = [...placed]; next[index] = null; setPlaced(next); setActive(index); setMessage('') }
  const verify = () => {
    const correct = placed.join('') === exercise.answer.replaceAll(' ', '')
    if (correct) return onComplete(true, attempt)
    if (attempt >= 3) return onComplete(false, attempt)
    setAttempt(value => value + 1); setPlaced(answer.map(() => null)); setActive(0); setMessage('La construcción no es correcta. Intenta de nuevo.')
  }
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (disabled) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setActive(index => Math.max(0, Math.min(answer.length - 1, index + (event.key === 'ArrowLeft' ? -1 : 1)))); return }
      if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); clear(active); return }
      const typed = event.key === '-' ? '−' : event.key.toLowerCase()
      if (!/^[0-9xy+()]$/.test(typed) && typed !== '−') return
      const piece = available.find(item => !item.used && item.value === typed)
      if (piece) { event.preventDefault(); put(piece.value) }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  })
  return <div className="mini-game realtime-builder"><div className="math-display">{exercise.expression}</div><div className="game-instruction">CONSTRUYE LA FACTORIZACIÓN CORRECTA</div><div className="factor-slots">{placed.map((piece, index) => <button key={index} className={`factor-slot ${active === index ? 'active' : ''} ${piece ? 'filled' : ''}`} onClick={() => piece ? clear(index) : setActive(index)} disabled={disabled}>{piece || '?'}</button>)}</div><div className="piece-bank">{available.map(piece => <button key={piece.id} className="factor-piece" disabled={piece.used || disabled} onClick={() => put(piece.value)}>{piece.value}</button>)}</div>{message && <div className="inline-feedback wrong">{message}</div>}<div className="exercise-actions"><button className="outline-button" onClick={() => { setPlaced(answer.map(() => null)); setActive(0) }} disabled={disabled}><RotateCcw /> LIMPIAR</button><button className="primary-button" onClick={verify} disabled={disabled || placed.some(piece => !piece)}>COMPROBAR <Check /></button></div><span className="attempt-label">INTENTO {attempt} DE 3</span></div>
}

function LiveGame({ room, socketId, socket, onLeave }: { room: Room; socketId: string; socket: Socket; onLeave: () => void }) {
  const exercise = exerciseMap.get(room.exerciseIds[room.questionIndex])
  const player = room.players.find(item => item.id === socketId)
  const host = room.hostId === socketId
  const connected = room.players.filter(item => item.connected)
  const allAnswered = connected.length > 0 && connected.every(item => item.answered)
  const [points, setPoints] = useState<number | null>(null)
  if (!exercise || !player) return null
  const submit = (correct: boolean, attempt: number) => socket.emit('game:answer', { code: room.code, correct, attempt }, (reply: Reply) => { if (reply.ok) setPoints(reply.points || 0) })
  return <main className="screen game-screen"><RoomHeader room={room} onLeave={onLeave} /><div className="live-game-layout"><section className="live-main"><div className="game-heading"><div><div className="eyebrow">RONDA {room.questionIndex + 1} / {room.exerciseIds.length} · {levelMeta[room.questionIndex].short}</div><h2>{levelMeta[room.questionIndex].name}</h2></div><div className="turn-card">JUGANDO COMO<strong>{player.name}</strong></div></div><div className="challenge-card">{player.answered ? <div className="answered-panel"><Check /><h3>Respuesta registrada</h3><strong>+{points ?? 0} puntos</strong><p>{allAnswered ? 'Todos respondieron.' : `Esperando a ${connected.filter(item => !item.answered).length} participante(s)…`}</p>{host && allAnswered && <button className="primary-button" onClick={() => { setPoints(null); socket.emit('game:next', { code: room.code }) }}>{room.questionIndex === room.exerciseIds.length - 1 ? 'VER RESULTADOS' : 'SIGUIENTE EJERCICIO'} <ArrowRight /></button>}</div> : <ExerciseBuilder key={exercise.id} exercise={exercise} disabled={false} onComplete={submit} />}</div></section><aside className="live-scoreboard"><div className="eyebrow"><Users /> MARCADOR EN VIVO</div>{[...room.players].sort((a, b) => b.score - a.score).map((item, index) => <div className={`live-score-row ${item.id === socketId ? 'me' : ''}`} key={item.id}><b>{index + 1}</b><span>{item.name}</span><strong>{item.score}</strong>{item.answered && <Check />}</div>)}</aside></div></main>
}

function LiveResults({ room, socketId, onLeave }: { room: Room; socketId: string; onLeave: () => void }) {
  const ranking = [...room.players].sort((a, b) => b.score - a.score)
  return <main className="screen results-screen"><RoomHeader room={room} onLeave={onLeave} /><div className="results-content"><div className="eyebrow">PARTIDA COMPLETADA</div><h1>RESULTADOS<br /><em>FINALES</em></h1><div className="ranking-card live-results">{ranking.map((player, index) => <div className={`rank-row ${player.id === socketId ? 'current-player' : ''}`} key={player.id}><b>{index + 1}</b><span className="team-avatar">{player.name.charAt(0).toUpperCase()}</span><strong>{player.name}</strong><span>{index === 0 ? 'Ganador' : 'Participante'}</span><em>{player.score} pts</em></div>)}</div><button className="outline-button" onClick={onLeave}>SALIR DE LA SALA</button></div></main>
}

export default function MultiplayerFlow({ onBack }: { onBack: () => void }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [socketId, setSocketId] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  useEffect(() => {
    const connection = io({ path: '/socket.io' })
    connection.on('connect', () => setSocketId(connection.id || ''))
    connection.on('room:state', (state: Room) => setRoom(state))
    setSocket(connection)
    return () => { connection.disconnect() }
  }, [])
  const leave = () => { socket?.disconnect(); setRoom(null); onBack() }
  if (!socket || !socket.connected) return <main className="screen"><div className="connection-screen"><span className="status-dot" /><strong>Conectando con el servidor…</strong></div></main>
  if (!room) return <MultiplayerEntry socket={socket} onRoom={setRoom} onBack={onBack} />
  if (room.status === 'lobby') return <Lobby room={room} socketId={socketId} socket={socket} onLeave={leave} />
  if (room.status === 'playing') return <LiveGame room={room} socketId={socketId} socket={socket} onLeave={leave} />
  return <LiveResults room={room} socketId={socketId} onLeave={leave} />
}
