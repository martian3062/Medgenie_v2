import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function DoctorP2PPage() {
  const [roomId, setRoomId] = useState('')

  function createRoom() {
    const generated = `room-${Math.random().toString(36).slice(2, 10)}`
    setRoomId(generated)
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-8 shadow-2xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Doctor P2P Consultation</h1>
              <p className="mt-3 max-w-3xl text-slate-400">
                This page is prepared for token-based WebRTC consultation using Django Channels
                for signaling. Video and audio will be peer-to-peer, while signaling will be
                handled through authenticated WebSocket rooms.
              </p>
            </div>

            <Link
              to="/"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
            >
              Back Home
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold">Session Controls</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Room ID</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter or generate room ID"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={createRoom}
                    className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Create Room
                  </button>
                  <button className="rounded-2xl border border-cyan-500/30 bg-cyan-500/15 px-4 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-500/25">
                    Join Room
                  </button>
                </div>

                {roomId && (
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    Current room: <span className="font-semibold">{roomId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold">Future Security Layer</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>• Token-based signaling auth</li>
                <li>• Doctor/patient room ownership</li>
                <li>• Future ZK identity proof support</li>
                <li>• Optional proof-hash storage in SQLite/PostgreSQL</li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Video Consultation Area</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="flex aspect-video items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 text-slate-500">
                Local Video Preview
              </div>
              <div className="flex aspect-video items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 text-slate-500">
                Remote Video Preview
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">
                Start Camera
              </button>
              <button className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-semibold text-white">
                Mute
              </button>
              <button className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-semibold text-white">
                Stop Video
              </button>
              <button className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 font-semibold text-red-200">
                Leave
              </button>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              This is the initial UI scaffold. WebRTC peer connection logic and Django Channels
              signaling will be connected next.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}