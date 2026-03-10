import { useState } from 'react'
import { chatWithReport } from '../lib/api'

export default function ChatPanel({ reportId }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([
    {
      role: 'assistant',
      text: 'This report-aware chat uses the uploaded report and analysis context.',
    },
    {
      role: 'assistant',
      text: 'Try asking: What is the major issue? Which body region is affected? Explain the abnormal labs simply.',
    },
  ])

  async function send() {
    const current = message.trim()
    if (!current || loading) return

    setMessage('')
    setLoading(true)
    setItems((prev) => [...prev, { role: 'user', text: current }])

    try {
      const res = await chatWithReport(reportId, current)
      setItems((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res?.answer || 'No response generated.',
        },
      ])
    } catch (error) {
      console.error(error)
      setItems((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Could not get report chatbot response. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Report Chatbot</h3>
          <p className="mt-1 text-xs text-slate-400">
            Powered by Groq for uploaded report explanation.
          </p>
        </div>
      </div>

      <div className="mt-4 h-[320px] space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              item.role === 'user'
                ? 'ml-auto bg-cyan-500/15 text-cyan-100'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            {item.text}
          </div>
        ))}

        {loading && (
          <div className="max-w-[85%] rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-300">
            Thinking...
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
          className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Ask about this report..."
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}