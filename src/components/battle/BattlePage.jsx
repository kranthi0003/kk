import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import supabase from '../../lib/supabase'
import CHALLENGES from './challenges'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

function genRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function runTests(code, tests) {
  const results = []
  for (const test of tests) {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`${code}\nreturn String(${test.fn})`)
      const result = fn()
      const expected = test.expected.replace(/^"|"$/g, '')
      results.push({ pass: String(result) === expected, got: String(result), expected, input: test.input })
    } catch (e) {
      results.push({ pass: false, got: e.message, expected: test.expected, input: test.input, error: true })
    }
  }
  return results
}

// ─── PHASES ─── lobby → waiting → battle → results
export default function BattlePage({ onBack }) {
  const [phase, setPhase] = useState('lobby')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [opponent, setOpponent] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [testResults, setTestResults] = useState([])
  const [timer, setTimer] = useState(0)
  const [myFinishTime, setMyFinishTime] = useState(null)
  const [oppFinishTime, setOppFinishTime] = useState(null)
  const [oppTestsPassed, setOppTestsPassed] = useState(0)
  const channelRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ─── CREATE ROOM ───
  const createRoom = () => {
    if (!playerName.trim()) return
    const code = genRoomCode()
    setRoomCode(code)
    setIsHost(true)
    joinChannel(code, playerName.trim())
    setPhase('waiting')
  }

  // ─── JOIN ROOM ───
  const joinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return
    joinChannel(roomCode.trim().toUpperCase(), playerName.trim())
    setPhase('waiting')
  }

  // ─── SUPABASE CHANNEL ───
  const joinChannel = (room, name) => {
    const channel = supabase.channel(`battle-${room}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: crypto.randomUUID().slice(0, 8) },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const players = Object.values(state).flat()
        const opp = players.find(p => p.name !== name)
        if (opp) setOpponent(opp)
      })
      .on('broadcast', { event: 'start' }, ({ payload }) => {
        const ch = CHALLENGES.find(c => c.id === payload.challengeId)
        setChallenge(ch)
        setCode(ch.template)
        setPhase('battle')
        startTimeRef.current = Date.now()
        timerRef.current = setInterval(() => setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000)), 100)
      })
      .on('broadcast', { event: 'finished' }, ({ payload }) => {
        if (payload.name !== name) {
          setOppFinishTime(payload.time)
          setOppTestsPassed(payload.passed)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name, joined_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel
  }

  // ─── START BATTLE (host only) ───
  const startBattle = () => {
    const ch = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]
    // Broadcast to opponent
    channelRef.current?.send({ type: 'broadcast', event: 'start', payload: { challengeId: ch.id } })
    // Also start locally (broadcast doesn't echo to sender)
    setChallenge(ch)
    setCode(ch.template)
    setPhase('battle')
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000)), 100)
  }

  // ─── RUN TESTS ───
  const handleRunTests = () => {
    if (!challenge) return
    const results = runTests(code, challenge.tests)
    setTestResults(results)
    const passed = results.filter(r => r.pass).length

    if (passed === challenge.tests.length && !myFinishTime) {
      const time = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setMyFinishTime(time)
      clearInterval(timerRef.current)
      channelRef.current?.send({
        type: 'broadcast', event: 'finished',
        payload: { name: playerName, time, passed }
      })
      // Wait a moment then show results
      setTimeout(() => setPhase('results'), 2000)
    }
  }

  // ─── GIVE UP ───
  const giveUp = () => {
    const time = Math.floor((Date.now() - startTimeRef.current) / 1000)
    setMyFinishTime(time)
    clearInterval(timerRef.current)
    const passed = testResults.filter(r => r.pass).length
    channelRef.current?.send({
      type: 'broadcast', event: 'finished',
      payload: { name: playerName, time, passed }
    })
    setPhase('results')
  }

  // Timer format
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ─── LOBBY ───
  if (phase === 'lobby') return (
    <div className="min-h-screen bg-[#0f0f17] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-white/5">
        <button onClick={onBack} className="text-white/40 hover:text-white/70 flex items-center gap-1.5 text-sm">
          ← Back to site
        </button>
        <h1 className="ml-4 text-lg font-bold">⚔️ Code Battle</h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-[480px] max-w-[90vw] space-y-6">
          {/* Logo */}
          <div className="text-center">
            <span className="text-6xl">⚔️</span>
            <h2 className="text-2xl font-bold mt-4">Code Battle</h2>
            <p className="text-white/40 text-sm mt-1">Race to solve coding challenges against another visitor</p>
          </div>

          {/* Name input */}
          <div>
            <label className="text-xs text-white/30 uppercase tracking-wider">Your Name</label>
            <input value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={15}
              placeholder="Enter your name..."
              className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 outline-none focus:border-white/20" />
          </div>

          {/* Create or Join */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={createRoom} disabled={!playerName.trim()}
              className="py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-30">
              Create Room
            </button>
            <div className="relative">
              <input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={6}
                placeholder="ROOM CODE"
                className="w-full h-full px-4 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono uppercase placeholder:text-white/20 outline-none" />
            </div>
          </div>
          {roomCode.length === 6 && (
            <button onClick={joinRoom} disabled={!playerName.trim()}
              className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-30">
              Join Room: {roomCode}
            </button>
          )}

          {/* Difficulty legend */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-white/30">
            <span>🟢 Easy (6)</span>
            <span>🟡 Medium (9)</span>
            <span>🔴 Hard (5)</span>
            <span>20 challenges</span>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── WAITING ROOM ───
  if (phase === 'waiting') return (
    <div className="min-h-screen bg-[#0f0f17] text-white flex flex-col">
      <div className="flex items-center px-6 py-4 border-b border-white/5">
        <button onClick={() => { setPhase('lobby'); if (channelRef.current) supabase.removeChannel(channelRef.current) }}
          className="text-white/40 hover:text-white/70 text-sm">← Back</button>
        <h1 className="ml-4 text-lg font-bold">⚔️ Waiting Room</h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="text-5xl animate-pulse">⏳</div>

          {/* Room code display */}
          <div>
            <p className="text-white/40 text-sm mb-2">Share this code with your opponent:</p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-3xl font-mono font-bold tracking-widest text-blue-400">{roomCode}</span>
              <button onClick={() => navigator.clipboard.writeText(roomCode)}
                className="text-white/30 hover:text-white/60 text-sm">📋</button>
            </div>
          </div>

          {/* Players */}
          <div className="flex items-center justify-center gap-8">
            <PlayerCard name={playerName} ready />
            <span className="text-2xl text-white/20">⚔️</span>
            <PlayerCard name={opponent?.name} />
          </div>

          {/* Start button (host only) */}
          {isHost && opponent && (
            <button onClick={startBattle}
              className="px-8 py-3 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition animate-pulse">
              🚀 Start Battle!
            </button>
          )}
          {isHost && !opponent && (
            <p className="text-white/20 text-sm">Waiting for opponent to join...</p>
          )}
          {!isHost && (
            <p className="text-white/20 text-sm">Waiting for host to start...</p>
          )}
        </div>
      </div>
    </div>
  )

  // ─── BATTLE ARENA ───
  if (phase === 'battle' && challenge) return (
    <div className="h-screen bg-[#0f0f17] text-white flex flex-col overflow-hidden">
      {/* Top bar: timer + problem info */}
      <div className="flex items-center px-4 py-2 bg-[#181820] border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            challenge.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
            challenge.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>{challenge.difficulty}</span>
          <h2 className="text-sm font-bold">{challenge.title}</h2>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {opponent && <span className="text-xs text-white/30">vs {opponent.name}</span>}
          <span className="font-mono text-lg font-bold text-red-400">{formatTime(timer)}</span>
        </div>
      </div>

      {/* Main area: problem + editor + tests */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Problem */}
        <div className="w-[300px] flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 bg-[#12121a]">
          <h3 className="text-base font-bold mb-3">{challenge.title}</h3>
          <p className="text-sm text-white/60 leading-relaxed mb-4">{challenge.desc}</p>

          <h4 className="text-xs text-white/30 uppercase tracking-wider mb-2">Test Cases</h4>
          {challenge.tests.map((t, i) => (
            <div key={i} className="mb-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono">
              <div className="text-white/40">Input: <span className="text-white/70">{t.input}</span></div>
              <div className="text-white/40">Expected: <span className="text-green-400/80">{t.expected}</span></div>
            </div>
          ))}

          {/* Opponent status */}
          {oppFinishTime && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-xs text-red-400 font-bold">⚡ {opponent?.name} finished!</p>
              <p className="text-xs text-white/40">{formatTime(oppFinishTime)} · {oppTestsPassed}/{challenge.tests.length} tests</p>
            </div>
          )}
        </div>

        {/* Right: Editor + Test results */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" /></div>}>
              <MonacoEditor
                height="100%"
                language="javascript"
                value={code}
                onChange={v => setCode(v || '')}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12 },
                  tabSize: 2,
                }}
              />
            </Suspense>
          </div>

          {/* Test results + actions */}
          <div className="flex-shrink-0 border-t border-white/5 bg-[#181820]">
            {/* Test output */}
            {testResults.length > 0 && (
              <div className="px-4 py-2 max-h-[120px] overflow-y-auto">
                {testResults.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs py-1 ${r.pass ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{r.pass ? '✅' : '❌'}</span>
                    <span className="font-mono text-white/40">{r.input}</span>
                    <span>→</span>
                    <span className="font-mono">{r.got}</span>
                    {!r.pass && <span className="text-white/20">(expected {r.expected})</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Action bar */}
            <div className="px-4 py-3 flex items-center gap-3">
              <button onClick={handleRunTests}
                className="px-6 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition">
                ▶ Run Tests
              </button>
              <div className="flex-1 text-xs text-white/30">
                {testResults.length > 0 && `${testResults.filter(r => r.pass).length}/${testResults.length} passed`}
              </div>
              <button onClick={giveUp} className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm hover:text-white/70 transition">
                Give Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── RESULTS ───
  if (phase === 'results') {
    const myPassed = testResults.filter(r => r.pass).length
    const myTotal = challenge?.tests.length || 0
    const iWon = myFinishTime && (!oppFinishTime || (myPassed >= (oppTestsPassed || 0) && myFinishTime <= (oppFinishTime || Infinity)))

    return (
      <div className="min-h-screen bg-[#0f0f17] text-white flex flex-col">
        <div className="flex items-center px-6 py-4 border-b border-white/5">
          <h1 className="text-lg font-bold">⚔️ Battle Results</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-[500px] max-w-[90vw] text-center space-y-6">
            {/* Winner banner */}
            <div>
              <span className="text-6xl">{iWon ? '🏆' : '😤'}</span>
              <h2 className="text-3xl font-bold mt-4">{iWon ? 'You Won!' : 'Better luck next time!'}</h2>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-2 gap-4">
              <ScoreCard name={playerName} time={myFinishTime} passed={myPassed} total={myTotal} winner={iWon} />
              <ScoreCard name={opponent?.name || 'Opponent'} time={oppFinishTime} passed={oppTestsPassed} total={myTotal} winner={!iWon && !!oppFinishTime} />
            </div>

            {/* Challenge info */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-white/30">Challenge: <span className="text-white/60">{challenge?.title}</span></p>
              <p className="text-xs text-white/30">Difficulty: <span className="text-white/60">{challenge?.difficulty}</span></p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setPhase('waiting'); setTestResults([]); setMyFinishTime(null); setOppFinishTime(null) }}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition">
                🔄 Rematch
              </button>
              <button onClick={onBack}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-semibold hover:bg-white/10 transition">
                ← Back to Site
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function PlayerCard({ name, ready }) {
  return (
    <div className={`w-32 p-4 rounded-2xl border text-center ${name ? 'border-green-500/30 bg-green-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl font-bold ${name ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/20'}`}>
        {name ? name.charAt(0).toUpperCase() : '?'}
      </div>
      <p className={`text-sm mt-2 font-medium ${name ? 'text-white' : 'text-white/20'}`}>{name || 'Waiting...'}</p>
      {name && <span className="text-[10px] text-green-400">Ready</span>}
    </div>
  )
}

function ScoreCard({ name, time, passed, total, winner }) {
  return (
    <div className={`p-4 rounded-xl border ${winner ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
      {winner && <span className="text-lg">🏆</span>}
      <p className="text-sm font-bold mt-1">{name}</p>
      <p className="text-2xl font-mono font-bold mt-2 text-white">{time ? `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}` : 'DNF'}</p>
      <p className="text-xs text-white/40 mt-1">{passed}/{total} tests passed</p>
    </div>
  )
}
