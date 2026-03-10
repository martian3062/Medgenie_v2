export default function FindingList({ findings = [], selectedRegion, clearRegion }) {
  const visible = selectedRegion
    ? findings.filter((f) => (f.regions || []).includes(selectedRegion) || (f.regions || []).includes('general'))
    : findings

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Filtered Findings</h3>
        {selectedRegion && (
          <button onClick={clearRegion} className="rounded-xl border border-cyan-500/30 px-3 py-1 text-sm text-cyan-200">
            Clear {selectedRegion}
          </button>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {visible.length ? visible.map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
            <div>{item.text}</div>
            <div className="mt-2 text-xs text-slate-400">Regions: {(item.regions || []).join(', ')}</div>
          </div>
        )) : <div className="text-sm text-slate-400">No findings for this selected region.</div>}
      </div>
    </div>
  )
}
