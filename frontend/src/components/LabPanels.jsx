function statusClasses(status) {
  if (status === 'high') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (status === 'low') return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  if (status === 'normal') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  return 'border-slate-700 bg-slate-900/70 text-slate-300'
}

function Panel({ title, items }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.length ? items.map((lab, idx) => (
          <div key={`${lab.normalized_name}-${idx}`} className={`rounded-2xl border p-4 shadow-lg ${statusClasses(lab.status)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold tracking-wide">{lab.name}</h4>
                <p className="mt-1 text-2xl font-bold">{lab.display_value}<span className="ml-1 text-sm font-medium opacity-80">{lab.unit}</span></p>
              </div>
              <span className="rounded-full px-2 py-1 text-xs font-semibold uppercase">{lab.status}</span>
            </div>
            <div className="mt-3 text-xs opacity-85">Reference: {lab.ref_min} – {lab.ref_max} {lab.ref_unit || ''}</div>
          </div>
        )) : <div className="text-sm text-slate-400">No values detected in this panel.</div>}
      </div>
    </div>
  )
}

export default function LabPanels({ labPanels = {} }) {
  return (
    <div className="grid gap-6">
      <Panel title="CBC Panel" items={labPanels.CBC || []} />
      <Panel title="LFT Panel" items={labPanels.LFT || []} />
      <Panel title="KFT Panel" items={labPanels.KFT || []} />
    </div>
  )
}
