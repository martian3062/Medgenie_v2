import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'

import { getReport, downloadSummaryPdf } from '../lib/api'
import BodyModel3D from '../components/BodyModel3D'
import FindingList from '../components/FindingList'
import LabPanels from '../components/LabPanels'
import SimulationPanel from '../components/SimulationPanel'
import ChatPanel from '../components/ChatPanel'

export default function DashboardPage() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    getReport(id)
      .then(setReport)
      .catch((error) => {
        console.error(error)
      })
  }, [id])

  useEffect(() => {
    if (!report) return

    gsap.fromTo(
      '.hero-animate',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }
    )
  }, [report])

  async function handleDownloadSummary() {
    try {
      setDownloading(true)
      await downloadSummaryPdf(id)
    } catch (error) {
      console.error('Summary PDF download failed:', error)
    } finally {
      setDownloading(false)
    }
  }

  if (!report) {
    return <div className="p-8 text-slate-300">Loading dashboard...</div>
  }

  const analysis = report.analysis_json || {}
  const markers = analysis.markers || []

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-animate rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 to-slate-900 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Med Holo AI Dashboard</h1>
              <p className="mt-2 text-slate-400">{report.original_name}</p>
            </div>

            <button
              onClick={handleDownloadSummary}
              disabled={downloading}
              className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? 'Downloading...' : 'Download Summary PDF'}
            </button>
          </div>

          <p className="mt-4 text-slate-200">
            {analysis.summary || 'No summary available.'}
          </p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="hero-animate">
            <BodyModel3D
              markers={markers}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
            />
          </div>

          <div className="hero-animate space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <h3 className="text-lg font-semibold">Primary Hotspot</h3>
              <p className="mt-3 text-2xl font-bold capitalize text-cyan-300">
                {analysis.primary_region || 'Not detected'}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Click a marker on the 3D body to filter findings by region.
              </p>
            </div>

            <FindingList
              findings={analysis.findings || []}
              selectedRegion={selectedRegion}
              clearRegion={() => setSelectedRegion(null)}
            />
          </div>
        </div>

        <div className="hero-animate">
          <LabPanels labPanels={analysis.lab_panels || {}} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="hero-animate">
            <SimulationPanel
              primaryRegion={analysis.primary_region}
              abnormalLabs={analysis.abnormal_labs || []}
            />
          </div>

          <div className="hero-animate">
            <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
              <h3 className="text-sm font-semibold text-cyan-200">
                Report-Aware Chat
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                This assistant uses uploaded report text and structured analysis context.
              </p>
            </div>

            <ChatPanel reportId={id} />
          </div>
        </div>

        <div className="hero-animate rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <h3 className="text-lg font-semibold">Extracted Text</h3>
          <pre className="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-900/60 p-4 text-xs text-slate-300">
            {report.extracted_text || 'No extracted text available.'}
          </pre>
        </div>
      </div>
    </div>
  )
}
