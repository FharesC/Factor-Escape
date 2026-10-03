'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Check, ChevronLeft, LockKeyhole, Plus, RotateCcw, Shuffle, Trophy, Users, X, Zap } from 'lucide-react'
import { exercises, exercisesPerLevel, levelMeta, replaceExercise, teamAvatars, teamColors } from '@/data/exercises'
import MultiplayerFlow from '@/components/multiplayer-flow'

type Screen = 'home' | 'multiplayer' | 'setup' | 'game' | 'results'
type Team = { name: string; score: number; avatar: string; color: (typeof teamColors)[number]; correct: number; errors: number; changes: number }

const initialTeams: Team[] = [
  { name: 'Equipo Alpha', score: 0, avatar: teamAvatars[0], color: teamColors[0], correct: 0, errors: 0, changes: 0 },
  { name: 'Equipo Beta', score: 0, avatar: teamAvatars[1], color: teamColors[1], correct: 0, errors: 0, changes: 0 },
]

function BrandMark({ variant = 'header' }: { variant?: 'header' | 'title' | 'orbit' }) {
  return <Image src="/icon.png" alt="" width={128} height={128} className={`brand-mark brand-mark-${variant}`} />
}
function Logo() { return <div className="brand-lockup"><BrandMark /><span className="brand-wordmark">FACTOR <b>ESCAPE</b></span></div> }
function Badge({ children, tone = 'cyan' }: { children: React.ReactNode; tone?: string }) { return <span className={`badge badge-${tone}`}>{children}</span> }
function Header({ label, onBack }: { label: string; onBack?: () => void }) { return <header className="topbar"><div className="flex items-center gap-5">{onBack && <button className="icon-button" onClick={onBack} aria-label="Volver"><ChevronLeft /></button>}<Logo /></div><div className="hidden items-center gap-3 sm:flex"><span className="status-dot" /><span className="header-status">Sesión activa · {label}</span></div></header> }
function LevelRail({ current }: { current: number }) { return <div className="level-rail">{levelMeta.map((item, index) => <div key={item.type} className={`rail-item ${index === current ? 'rail-active' : ''} ${index < current ? 'rail-done' : ''}`}><div className="rail-line" /><div className="rail-node">{index < current ? <Check /> : index > current ? <LockKeyhole /> : item.icon}</div><div className="rail-copy"><span>NIVEL {item.number}</span><strong>{item.short}</strong></div></div>)}</div> }
function TeamPill({ team, active }: { team: Team; active: boolean }) { return <div className={`team-pill team-${team.color} ${active ? 'team-active' : ''}`}><span className="team-avatar">{team.avatar}</span><span className="truncate">{team.name}</span><b>{team.score}</b></div> }
function Scoreboard({ teams, turn }: { teams: Team[]; turn: number }) { return <aside className="scoreboard"><div className="eyebrow"><Users /> MARCADOR EN VIVO</div><div className="flex flex-col gap-2">{teams.map((team, i) => <TeamPill key={team.avatar} team={team} active={turn === i} />)}</div></aside> }

function Home({ onStart }: { onStart: () => void }) { return <main className="screen home-screen"><Header label="Inicio" /><div className="home-content"><div className="home-copy"><div className="eyebrow"><span className="status-dot" /> ACTIVIDAD DE FACTORIZACIÓN</div><div className="brand-title"><h1>FACTOR<br /><em>ESCAPE</em></h1></div><p>Una dinámica multijugador para practicar<br />los <strong>5 primeros casos de factorización</strong>.</p><button className="primary-button" onClick={onStart}>CREAR O UNIRSE <ArrowRight /></button><div className="home-note"><Zap /> Hecho por el grupo #1</div></div><div className="level-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><small>5 NIVELES</small></div>{levelMeta.map((item, i) => <div key={item.type} className={`orbit-node node-${i}`}><span>{item.icon}</span><small>0{i + 1}</small></div>)}</div></div><div className="home-footer"><span>FACTOR ESCAPE · RECURSO EDUCATIVO</span><span>MULTIJUGADOR EN TIEMPO REAL</span></div></main> }

function Setup({ onBack, onStart }: { onBack: () => void; onStart: (teams: Team[]) => void }) {
  const [teams, setTeams] = useState(initialTeams)
  const [newTeamName, setNewTeamName] = useState('')
  const name = newTeamName.trim()
  const duplicateName = name !== '' && teams.some(team => team.name.trim().toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))
  const canAdd = teams.length < 5 && name !== '' && !duplicateName
  const update = (index: number, name: string) => setTeams(prev => prev.map((team, i) => i === index ? { ...team, name } : team))
  const add = () => {
    if (!canAdd) return
    const identity = teamAvatars.findIndex(avatar => !teams.some(team => team.avatar === avatar))
    if (identity === -1) return
    setTeams([...teams, { name, score: 0, avatar: teamAvatars[identity], color: teamColors[identity], correct: 0, errors: 0, changes: 0 }])
    setNewTeamName('')
  }
  return <main className="screen"><Header label="Configuración" onBack={onBack} /><div className="setup-layout"><div><div className="eyebrow">01 // CONFIGURACIÓN DE EQUIPOS</div><div className="brand-title"><h2 className="page-title">Arma tu<br /><span>equipo.</span></h2></div><p className="page-subtitle">Puedes jugar con uno o hasta cinco equipos.<br />Personaliza las identidades antes de comenzar.</p></div><section className="setup-card"><div className="card-topline"><span className="font-mono text-xs tracking-[.18em] text-slate-400">EQUIPOS REGISTRADOS</span><Badge>{teams.length} / 05</Badge></div><div className="team-editor">{teams.map((team, i) => <div className={`editor-row team-${team.color}`} key={team.avatar}><span className="team-avatar">{team.avatar}</span><input value={team.name} onChange={e => update(i, e.target.value)} aria-label={`Nombre del equipo ${i + 1}`} /><button className="delete-button" onClick={() => teams.length > 1 && setTeams(teams.filter((_, j) => i !== j))} disabled={teams.length <= 1} aria-label={`Eliminar ${team.name}`}><X /></button></div>)}</div>
      <form onSubmit={event => { event.preventDefault(); add() }}>
        <label htmlFor="new-team-name" className="block mb-2 text-sm text-slate-300">Nombre del nuevo equipo</label>
        <div className="editor-row">
          <input id="new-team-name" value={newTeamName} onChange={event => setNewTeamName(event.target.value)} placeholder="Escribe el nombre del equipo" disabled={teams.length >= 5} aria-invalid={duplicateName} aria-describedby={duplicateName ? 'team-name-error' : undefined} />
        </div>
        {duplicateName && <p id="team-name-error" role="status" className="mt-2 text-sm text-rose-300">Ya existe un equipo con ese nombre.</p>}
        <button type="submit" className="add-team" disabled={!canAdd}><Plus /> AGREGAR EQUIPO</button>
      </form>
      <div className="setup-actions"><button className="primary-button" onClick={() => onStart(teams)}>ABRIR NIVELES <ArrowRight /></button></div></section></div></main>
}

function splitFactorization(value: string): string[] {
  return [...(value.replaceAll(' ', '').match(/[a-zA-Z](?:[²³⁴⁵⁶])?|\d+|[()+−]/g) ?? [])]
}

function shuffle<T>(items: T[], random = Math.random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function seededRandom(seed: number) {
  let value = seed || 1
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function buildPieces(answer: string, alternatives: string[], seed: number) {
  const correct = splitFactorization(answer)
  const distractorPool = [
    ...alternatives.flatMap(splitFactorization),
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'x', 'y', 'm', 'n', '+', '−', '²', '³', '⁴',
  ]
  const extras = shuffle([...new Set(distractorPool.filter(piece => !correct.includes(piece)))], seededRandom(seed + 97)).slice(0, 10)
  return shuffle([...correct, ...extras].map((value, index) => ({ id: `${index}-${value}`, value })), seededRandom(seed))
}

function ModuleComplete({ level, onContinue }: { level: number; onContinue: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const meta = levelMeta[level]
  const finalLevel = level === levelMeta.length - 1

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return <dialog ref={dialogRef} className="module-dialog" aria-labelledby="module-complete-title" aria-describedby="module-complete-description" onCancel={event => event.preventDefault()}>
    <div className="score-burst module-complete">
      <BrandMark variant="title" />
      <span>MÓDULO {meta.number} FINALIZADO</span>
      <h2 id="module-complete-title">{meta.short}</h2>
      <p id="module-complete-description">Has finalizado este módulo.{finalLevel ? ' ¡Llegaste al final de la actividad!' : ` Continúa con el módulo ${levelMeta[level + 1].number}: ${levelMeta[level + 1].short}.`}</p>
      <button autoFocus className="primary-button small-button" onClick={onContinue}>{finalLevel ? 'VER RESULTADOS' : 'CONTINUAR AL SIGUIENTE MÓDULO'} <ArrowRight /></button>
    </div>
  </dialog>
}

function Game({ teams: initial, onFinish, onExit }: { teams: Team[]; onFinish: (teams: Team[]) => void; onExit: () => void }) {
  const [teams, setTeams] = useState(initial)
  const [randomSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000))
  const [exerciseOrder, setExerciseOrder] = useState(() => levelMeta.map(item => shuffle(exercises[item.type].map((_, index) => index))))
  const [level, setLevel] = useState(0)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [turn, setTurn] = useState(0)
  const [attempt, setAttempt] = useState(1)
  const [selected, setSelected] = useState<(string | null)[]>([])
  const [activeSlot, setActiveSlot] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'failed' | null>(null)
  const [scoreFlash, setScoreFlash] = useState<{ points: number; teams: Team[] } | null>(null)
  const [completedModule, setCompletedModule] = useState<Team[] | null>(null)
  const meta = levelMeta[level]
  const current = exercises[meta.type][exerciseOrder[level][exerciseIndex]]
  const answerPieces = splitFactorization(current.answer)
  const placed = selected.length === answerPieces.length ? selected : Array<string | null>(answerPieces.length).fill(null)
  const exerciseSeed = randomSeed + current.id.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0)
  const pieces = buildPieces(current.answer, current.options, exerciseSeed)
  const lastExercise = exerciseIndex === exercisesPerLevel - 1
  const totalExercises = exercisesPerLevel * levelMeta.length
  const progress = Math.round(((level * exercisesPerLevel + exerciseIndex + (feedback === 'correct' ? 1 : 0)) / totalExercises) * 100)

  const updateCurrentTeam = (change: (team: Team) => Team) => {
    const next = teams.map((team, index) => index === turn ? change(team) : team)
    setTeams(next)
    return next
  }
  const verify = () => {
    if (placed.some(piece => piece === null) || feedback) return
    if (placed.join('') === current.answer.replaceAll(' ', '')) {
      const points = attempt === 1 ? 3 : attempt === 2 ? 1 : 0
      const nextTeams = updateCurrentTeam(team => ({ ...team, score: team.score + points, correct: team.correct + 1 }))
      setScoreFlash({ points, teams: nextTeams })
      setFeedback('correct')
    } else {
      updateCurrentTeam(team => ({ ...team, errors: team.errors + 1 }))
      if (attempt === 3) setFeedback('failed')
      else { setAttempt(value => value + 1); setSelected([]); setActiveSlot(0); setFeedback('wrong') }
    }
  }
  const resetQuestion = () => { setAttempt(1); setSelected([]); setActiveSlot(0); setFeedback(null); setScoreFlash(null) }
  const advanceLevel = (teamState = teams) => {
    setScoreFlash(null)
    setCompletedModule(teamState)
  }
  const continueAfterModule = () => {
    if (!completedModule) return
    const teamState = completedModule
    setCompletedModule(null)
    if (level === levelMeta.length - 1) { onFinish(teamState); return }
    setLevel(value => value + 1)
    setExerciseIndex(0)
    setTurn(value => (value + 1) % teams.length)
    resetQuestion()
  }
  const advance = (teamState = teams) => {
    if (lastExercise) { advanceLevel(teamState); return }
    setExerciseIndex(value => value + 1)
    setTurn(value => (value + 1) % teams.length)
    resetQuestion()
  }
  const changeExercise = () => {
    if (feedback === 'correct' || feedback === 'failed') return
    const nextTeams = updateCurrentTeam(team => ({ ...team, score: team.score - 1, changes: team.changes + 1 }))
    const replacementOrder = replaceExercise(exerciseOrder[level], exerciseIndex)
    if (replacementOrder === null) { advanceLevel(nextTeams); return }
    setExerciseOrder(order => order.map((items, index) => index === level ? replacementOrder : items))
    setTurn(value => (value + 1) % teams.length)
    resetQuestion()
  }

  const usedCounts = placed.reduce<Record<string, number>>((counts, value) => {
    if (value) counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
  const availablePieces = pieces.map(piece => {
    const sameBefore = pieces.filter(candidate => candidate.value === piece.value && candidate.id < piece.id).length
    return { ...piece, used: sameBefore < (usedCounts[piece.value] ?? 0) }
  })
  const putPiece = (value: string) => {
    if (feedback === 'correct' || feedback === 'failed') return
    const next = [...placed]
    next[activeSlot] = value
    setSelected(next)
    setFeedback(null)
    const nextEmpty = next.findIndex((piece, index) => piece === null && index > activeSlot)
    setActiveSlot(nextEmpty >= 0 ? nextEmpty : Math.max(0, next.findIndex(piece => piece === null)))
  }
  const clearSlot = (index: number) => {
    if (feedback === 'correct' || feedback === 'failed') return
    const next = [...placed]
    next[index] = null
    setSelected(next)
    setActiveSlot(index)
    setFeedback(null)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (completedModule || scoreFlash || feedback === 'correct' || feedback === 'failed') return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const direction = event.key === 'ArrowLeft' ? -1 : 1
        setActiveSlot(index => Math.max(0, Math.min(answerPieces.length - 1, index + direction)))
        return
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        const previousFilled = [...placed].map((piece, index) => ({ piece, index })).reverse().find(item => item.piece && item.index <= activeSlot)
        clearSlot(placed[activeSlot] ? activeSlot : (previousFilled?.index ?? activeSlot))
        return
      }
      const typed = event.key === '-' ? '−' : event.key.toLowerCase()
      if (!/^[0-9xy+()]$/.test(typed) && typed !== '−') return
      if (/^\d$/.test(typed) && activeSlot > 0) {
        const previousIndex = activeSlot - 1
        const previous = placed[previousIndex]
        const combined = previous && /^\d+$/.test(previous) ? `${previous}${typed}` : ''
        const combinedPiece = availablePieces.find(piece => !piece.used && piece.value === combined)
        if (combinedPiece) {
          event.preventDefault()
          const next = [...placed]
          next[previousIndex] = combined
          setSelected(next)
          setFeedback(null)
          return
        }
      }
      const available = availablePieces.find(piece => !piece.used && piece.value === typed)
      if (available) {
        event.preventDefault()
        putPiece(available.value)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSlot, answerPieces.length, availablePieces, completedModule, feedback, placed, scoreFlash])

  return <main className="screen game-screen">
    <Header label={`Nivel ${meta.number}`} onBack={onExit} />
    <div className="game-layout">
      <div className="game-sidebar"><LevelRail current={level} /><div className="progress-meter"><div className="flex justify-between"><span>PROGRESO DE ESCAPE</span><b>{progress}%</b></div><div className="meter"><span style={{ width: `${progress}%` }} /></div></div></div>
      <div className="game-main">
        <div className="game-heading"><div><div className="eyebrow">SECTOR {meta.number} // {meta.short.toUpperCase()}</div><h2>{meta.name}</h2></div><div className="turn-card"><span className="status-dot" /> TURNO ACTUAL<strong>{teams[turn].name}</strong></div></div>
        <div className="challenge-card">
          <div className="challenge-top"><Badge tone="violet">{current.difficulty}</Badge><span className="attempt-label">INTENTO {attempt} DE 3</span></div>
          <div className="exercise-status"><span>EJERCICIO {exerciseIndex + 1} / {exercisesPerLevel}</span><span>1.er intento: 3 pts · 2.º: 1 pt · 3.º: 0 pts</span></div>
          <div className="mini-game" key={current.id}>
            <div className="math-display">{current.expression}</div>
            <div className="game-instruction">ELIGE UNA CASILLA Y COLOCA CADA PIEZA EN SU POSICIÓN</div>
            <div className="keyboard-help">Teclado: números, x, y, +, − y paréntesis · Los números de dos cifras se unen automáticamente · Flechas para moverte · Backspace para borrar</div>
            <div className="factor-slots" aria-label="Construcción de la factorización">
              {placed.map((piece, index) => <button key={index} className={`factor-slot ${activeSlot === index ? 'active' : ''} ${piece ? 'filled' : ''}`} onClick={() => piece ? clearSlot(index) : setActiveSlot(index)} aria-label={`Posición ${index + 1}${piece ? `: ${piece}` : ''}`}>{piece || '?'}</button>)}
            </div>
            <div className="piece-bank" role="group" aria-label="Piezas disponibles">
              {availablePieces.map(piece => <button key={piece.id} className="factor-piece" disabled={piece.used || feedback === 'correct' || feedback === 'failed'} onClick={() => putPiece(piece.value)}>{piece.value}</button>)}
            </div>
            {(feedback === null || feedback === 'wrong') && <div className="exercise-actions"><button className="outline-button change-button" onClick={changeExercise}><Shuffle /> CAMBIAR EJERCICIO −1 PT</button><button className="outline-button" onClick={() => { setSelected([]); setActiveSlot(0); setFeedback(null) }}><RotateCcw /> LIMPIAR</button><button className="primary-button small-button" onClick={verify} disabled={placed.some(piece => piece === null)}>COMPROBAR <Check /></button></div>}
            {feedback === 'wrong' && <div className="inline-feedback wrong">El orden o alguna pieza no es correcta. Reorganízalas e intenta de nuevo.</div>}
            {(feedback === 'correct' || feedback === 'failed') && <div className={`step-feedback ${feedback === 'correct' ? 'correct' : 'wrong'}`} role="status"><strong>{feedback === 'correct' ? 'FACTORIZACIÓN CORRECTA' : 'SIN PUNTOS'}</strong><p>{feedback === 'correct' ? current.hint : `La respuesta correcta era ${current.answer}.`}</p><button className="primary-button small-button" onClick={() => advance()}>{lastExercise ? (level === 4 ? 'VER RESULTADOS' : 'SIGUIENTE NIVEL') : 'SIGUIENTE EJERCICIO'} <ArrowRight /></button></div>}
          </div>
        </div>
      </div>
      <Scoreboard teams={teams} turn={turn} />
    </div>
    {scoreFlash && <div className="score-celebration" role="dialog" aria-label="Puntuación actualizada"><div className="score-burst"><span>RESPUESTA CORRECTA</span><strong>+{scoreFlash.points}</strong><small>PUNTOS PARA {teams[turn].name.toUpperCase()}</small><div className="celebration-board">{scoreFlash.teams.map((team, index) => <div className={index === turn ? 'just-scored' : ''} key={team.avatar}><span className={`team-avatar team-${team.color}`}>{team.avatar}</span><b>{team.name}</b><em>{team.score} pts</em></div>)}</div><button className="primary-button small-button" onClick={() => setScoreFlash(null)}>CONTINUAR <ArrowRight /></button></div></div>}
    {completedModule && <ModuleComplete level={level} onContinue={continueAfterModule} />}
  </main>
}

function Results({ teams, onRestart, onHome }: { teams: Team[]; onRestart: () => void; onHome: () => void }) { const sorted = [...teams].sort((a, b) => b.score - a.score);  return <main className="screen results-screen"><Header label="Misión completada" /><div className="results-content"><div className="eyebrow"><span className="status-dot" /> ACTIVIDAD COMPLETADA · 100%</div><div className="brand-title brand-title-results"><h1>ESCAPE<br /><em>COMPLETADO</em></h1></div><p className="results-subtitle">Has finalizado los {levelMeta.length} módulos.</p><div className="results-grid"><div className="winner-card"><Trophy /><span>MEJOR EQUIPO</span><strong>{sorted[0].name}</strong><b>{sorted[0].score} <small>PTS</small></b></div><div className="ranking-card"><div className="card-topline"><span className="font-mono text-xs tracking-[.18em] text-slate-400">CLASIFICACIÓN FINAL</span><Badge tone="amber">{teams.length} {teams.length === 1 ? 'EQUIPO' : 'EQUIPOS'}</Badge></div>{sorted.map((team, i) => <div className="rank-row" key={team.avatar}><b>0{i + 1}</b><span className={`team-avatar team-${team.color}`}>{team.avatar}</span><strong>{team.name}</strong><span>{team.correct} aciertos · {team.changes} cambios</span><em>{team.score} pts</em></div>)}</div></div><div className="results-actions"><button className="primary-button" onClick={onRestart}><RotateCcw /> NUEVA PARTIDA</button><button className="outline-button" onClick={onHome}>VOLVER AL INICIO</button></div></div></main> }

export default function Page() {
  const [screen, setScreen] = useState<Screen>('home')
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  return <div className="page-wrap">{screen === 'home' && <Home onStart={() => setScreen('multiplayer')} />}{screen === 'multiplayer' && <MultiplayerFlow onBack={() => setScreen('home')} />}{screen === 'setup' && <Setup onBack={() => setScreen('home')} onStart={next => { setTeams(next); setScreen('game') }} />}{screen === 'game' && <Game teams={teams} onExit={() => setScreen('home')} onFinish={next => { setTeams(next); setScreen('results') }} />}{screen === 'results' && <Results teams={teams} onRestart={() => setScreen('setup')} onHome={() => setScreen('home')} />}</div>
}
