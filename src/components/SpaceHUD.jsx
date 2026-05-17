import React from 'react'

export default function SpaceHUD({ speed, distance, sector, dockTarget }) {
  const speedPct = Math.min(speed / 100, 1)
  const formattedDist = Math.abs(distance).toFixed(1)
  const speedLabel = speed < 1 ? 'IDLE' : `${speed.toFixed(0)}x`

  return (
    <div className="fixed inset-0 pointer-events-none z-30 font-mono select-none">
      {/* Speed indicator — bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {/* Speed bar */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/40 tracking-[0.3em]">
            {speed > 0.5 ? 'HOLD FOR SPEED' : 'CLICK FOR SPEED'}
          </span>
        </div>
        <div className="relative w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
            style={{
              width: `${speedPct * 100}%`,
              background: speedPct > 0.7
                ? 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)'
                : 'linear-gradient(90deg, #60a5fa, #93c5fd)',
              boxShadow: speedPct > 0.5 ? '0 0 12px rgba(96, 165, 250, 0.6)' : 'none',
            }}
          />
        </div>
        <span className="text-lg font-bold tabular-nums"
          style={{
            color: speedPct > 0.7 ? '#f472b6' : speedPct > 0.3 ? '#93c5fd' : '#ffffff80',
            textShadow: speedPct > 0.5 ? '0 0 20px rgba(96, 165, 250, 0.5)' : 'none',
          }}>
          {speedLabel}
        </span>
      </div>

      {/* Distance — top right */}
      <div className="absolute top-6 right-6 text-right">
        <div className="text-[10px] text-white/30 tracking-[0.2em] mb-1">DISTANCE</div>
        <div className="text-sm text-white/60 tabular-nums">{formattedDist} <span className="text-[10px] text-white/30">ly</span></div>
      </div>

      {/* Sector name — top left */}
      <div className="absolute top-6 left-6">
        <div className="text-[10px] text-white/30 tracking-[0.2em] mb-1">SECTOR</div>
        <div className="text-sm text-white/60">{sector || 'DEEP SPACE'}</div>
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 border border-white/10 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Dock prompt */}
      {dockTarget && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 animate-pulse">
          <div className="px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 text-sm">
            Click to dock at <span className="text-blue-400 font-semibold">{dockTarget}</span>
          </div>
        </div>
      )}

      {/* Warp lines overlay at high speed */}
      {speed > 40 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(100,150,255,${(speed - 40) / 300}) 100%)`,
          }}
        />
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${0.3 + speedPct * 0.3}) 100%)`,
        }}
      />
    </div>
  )
}
