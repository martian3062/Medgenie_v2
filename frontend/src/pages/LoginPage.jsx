import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginUser, getCurrentUser } from '../lib/api'

export default function LoginPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    const cleanUsername = username.trim()
    const cleanPassword = password.trim()

    if (!cleanUsername || !cleanPassword) {
      setError('Please enter username and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await loginUser({
        username: cleanUsername,
        password: cleanPassword,
      })

      const me = await getCurrentUser()

      if (!me?.is_authenticated) {
        setError('Login response came back, but session was not created.')
        return
      }

      navigate('/')
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.error || 'Login failed. Please check your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="mt-3 text-slate-400">
            Sign in to access your reports, dashboard, and Doctor P2P features.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin()
                }}
                placeholder="Enter username"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin()
                }}
                placeholder="Enter password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="mt-5 text-sm text-slate-400">
            Don’t have an account?{' '}
            <Link to="/signup" className="text-cyan-300 hover:text-cyan-200">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}