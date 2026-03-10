import React from 'react'

export default function BodyModel3D() {
  return (
    <div className="relative h-[560px] overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/70 shadow-2xl">
      <img
        src="/models/medico.gif"
        alt="Medical body demo"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-slate-950/20" />

      <div className="absolute left-4 top-4 rounded-xl border border-cyan-400/30 bg-slate-950/70 px-3 py-2 text-sm font-medium text-cyan-200 backdrop-blur-sm">
        Medico Demo Preview
      </div>
    </div>
  )
}