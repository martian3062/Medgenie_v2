import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

function buildChartData(primaryRegion, abnormalLabs) {
  const base = primaryRegion ? 35 : 15
  const labBoost = Math.min(abnormalLabs?.length || 0, 5) * 8
  return [
    { step: 'Now', disease: base + labBoost, inflammation: 28 + labBoost / 2, recovery: 16 },
    { step: '2w', disease: base + labBoost + 8, inflammation: 34 + labBoost / 2, recovery: 18 },
    { step: '1m', disease: base + labBoost + 12, inflammation: 39 + labBoost / 2, recovery: 20 },
    { step: '3m', disease: base + labBoost + 16, inflammation: 42 + labBoost / 2, recovery: 24 },
    { step: '6m', disease: base + labBoost + 18, inflammation: 46 + labBoost / 2, recovery: 28 },
  ]
}

export default function SimulationPanel({ primaryRegion, abnormalLabs = [] }) {
  const data = buildChartData(primaryRegion, abnormalLabs)
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Progression Simulation</h3>
        <p className="text-sm text-slate-400">UI-only simulation scaffold based on extracted abnormalities and hotspot region.</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="disease" stroke="#22d3ee" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="inflammation" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="recovery" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
