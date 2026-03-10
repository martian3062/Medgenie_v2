import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  uploadReport,
  homeChat,
  getHealthcareNews,
  getCancerNews,
  getCurrentUser,
  logoutUser,
} from '../lib/api'

const NEWS_REFRESH_MS = 3 * 60 * 60 * 1000

function NewsCard({ title, source, published_at, url }) {
  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-cyan-500/30 hover:bg-slate-900/80"
    >
      <h4 className="line-clamp-2 text-sm font-semibold text-white">{title}</h4>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span className="truncate">{source || 'Unknown source'}</span>
        <span className="shrink-0">{formatPublishedTime(published_at)}</span>
      </div>
    </a>
  )
}

function formatPublishedTime(value) {
  if (!value) return 'Unknown time'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'

  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NewsSection({ title, items, loading, emptyText }) {
  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/75 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-200">
          10 items
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
            Loading news...
          </div>
        ) : items.length ? (
          items.slice(0, 10).map((item, index) => (
            <NewsCard
              key={`${item.title}-${index}`}
              title={item.title}
              source={item.source}
              published_at={item.published_at}
              url={item.url}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [homeMessage, setHomeMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi. I am your Med Holo AI homepage assistant powered by Gemini.',
    },
    {
      role: 'assistant',
      content:
        'You can ask general health questions here, or upload a medical report for deeper report-specific analysis.',
    },
  ])

  const [healthcareNews, setHealthcareNews] = useState([])
  const [cancerNews, setCancerNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const navigate = useNavigate()

  async function loadCurrentUser() {
    try {
      setAuthLoading(true)
      const res = await getCurrentUser()
      setCurrentUser(res?.is_authenticated ? res.user : null)
    } catch (error) {
      console.error(error)
      setCurrentUser(null)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await logoutUser()
      setCurrentUser(null)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleUpload() {
    if (!file || loading || authLoading) return

    if (!currentUser) {
      setUploadError('Please log in first before uploading a report.')
      navigate('/login')
      return
    }

    setUploadError('')
    setLoading(true)

    try {
      const res = await uploadReport(file)
      navigate(`/dashboard/${res.id}`)
    } catch (error) {
      console.error(error)
      console.log('UPLOAD ERROR DATA:', error?.response?.data)
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.type ||
          'Upload failed. Check backend terminal.'
      )
      setUploadError(
        error?.response?.data?.error ||
          error?.response?.data?.type ||
          'Upload failed. Check backend terminal.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleHomeChat() {
    const text = homeMessage.trim()
    if (!text || chatLoading) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setHomeMessage('')
    setChatLoading(true)

    try {
      const res = await homeChat(text)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer || 'No response generated.',
        },
      ])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, the Gemini homepage chat request failed. Please try again.',
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  async function loadNews() {
    try {
      setNewsLoading(true)
      const [healthcare, cancer] = await Promise.all([
        getHealthcareNews(),
        getCancerNews(),
      ])

      setHealthcareNews(Array.isArray(healthcare?.items) ? healthcare.items : [])
      setCancerNews(Array.isArray(cancer?.items) ? cancer.items : [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error(error)
      setHealthcareNews([])
      setCancerNews([])
    } finally {
      setNewsLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentUser()
    loadNews()

    const intervalId = window.setInterval(() => {
      loadNews()
    }, NEWS_REFRESH_MS)

    return () => window.clearInterval(intervalId)
  }, [])

  const refreshText = useMemo(() => {
    if (!lastRefresh) return 'Refreshing every 3 hours'
    return `Last refreshed ${lastRefresh.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }, [lastRefresh])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/healthcare.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" />

      <div className="relative z-10 min-h-screen px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-7xl"
        >
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Med Holo AI v3</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Private report analysis stays in the backend. The homepage uses Gemini
                for general health guidance, while uploaded reports use the protected
                report-analysis workflow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {authLoading ? (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                  Checking session...
                </div>
              ) : currentUser ? (
                <>
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">
                    Logged in as{' '}
                    <span className="font-semibold">{currentUser.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-2xl border border-cyan-500/30 bg-cyan-500/15 px-4 py-2 font-medium text-cyan-100 transition hover:bg-cyan-500/25"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-2xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              <Link
                to="/doctor-p2p"
                className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
              >
                Doctor P2P
              </Link>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/75 p-8 shadow-2xl backdrop-blur-xl">
                <h2 className="text-2xl font-semibold">Private Medical Report Upload</h2>
                <p className="mt-3 text-slate-300">
                  Upload a medical report for OCR, structured extraction, body-region
                  mapping, lab parsing, findings, summary generation, and report-aware
                  Groq chat on the dashboard.
                </p>

                <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.tif"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-cyan-500"
                  />

                  {file && (
                    <p className="mt-3 text-xs text-cyan-200">
                      Selected file: {file.name}
                    </p>
                  )}

                  {uploadError && (
                    <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {uploadError}
                    </div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={!file || loading || authLoading || !currentUser}
                    className="mt-5 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {authLoading
                      ? 'Checking session...'
                      : loading
                      ? 'Processing...'
                      : !currentUser
                      ? 'Login to Upload'
                      : 'Upload & Analyze'}
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <h4 className="font-semibold text-cyan-200">Homepage AI</h4>
                    <p className="mt-2 text-sm text-slate-400">
                      Gemini for general questions and onboarding.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <h4 className="font-semibold text-cyan-200">Report AI</h4>
                    <p className="mt-2 text-sm text-slate-400">
                      Groq for uploaded report-specific explanation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/75 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-xl">
                    💬
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Homepage Health Assistant</h2>
                    <p className="text-sm text-slate-400">Powered by Gemini</p>
                  </div>
                </div>

                <div className="mt-6 h-[360px] space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'ml-auto rounded-br-sm bg-cyan-500 text-slate-950'
                          : 'rounded-tl-sm bg-slate-800 text-slate-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3 text-sm text-slate-300">
                      Thinking...
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                  <input
                    type="text"
                    value={homeMessage}
                    onChange={(e) => setHomeMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleHomeChat()
                    }}
                    placeholder="Ask a general health question..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <button
                  onClick={handleHomeChat}
                  disabled={chatLoading}
                  className="mt-4 w-full rounded-2xl border border-cyan-500/30 bg-cyan-500/20 px-4 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:opacity-50"
                >
                  {chatLoading ? 'Thinking...' : 'Ask Gemini'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <NewsSection
                title="Recent Healthcare News"
                items={healthcareNews}
                loading={newsLoading}
                emptyText="No healthcare news available right now."
              />
            </div>

            <div className="space-y-6">
              <NewsSection
                title="Recent Cancer News"
                items={cancerNews}
                loading={newsLoading}
                emptyText="No cancer news available right now."
              />

              <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/75 p-5 shadow-2xl backdrop-blur-xl">
                <h3 className="text-lg font-semibold">Feed Status</h3>
                <p className="mt-3 text-sm text-slate-400">{refreshText}</p>
                <p className="mt-2 text-sm text-slate-400">
                  This panel is designed to refresh every 3 hours from the backend news
                  service.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}