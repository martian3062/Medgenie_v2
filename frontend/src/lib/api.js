import axios from "axios"

const ROOT_BASE =
  import.meta.env.VITE_API_ROOT?.trim() || "http://127.0.0.1:8000"

const API_BASE = `${ROOT_BASE.replace(/\/+$/, "")}/api`

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

function getCookie(name) {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)

  if (parts.length === 2) {
    return parts.pop().split(";").shift()
  }

  return null
}

export async function ensureCsrfCookie() {
  await api.get("/health/")
  return getCookie("csrftoken")
}

async function post(url, data = {}, config = {}) {
  const csrftoken = getCookie("csrftoken") || (await ensureCsrfCookie())

  const headers = {
    "X-CSRFToken": csrftoken,
    ...(config.headers || {}),
  }

  const res = await api.post(url, data, {
    ...config,
    headers,
    withCredentials: true,
  })

  return res.data
}

export function extractApiError(error, fallback = "Something went wrong.") {
  if (error?.response?.data?.error) return error.response.data.error
  if (error?.response?.data?.detail) return error.response.data.detail
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return fallback
}

export async function signupUser(payload) {
  return await post("/auth/signup/", payload)
}

export async function loginUser(payload) {
  return await post("/auth/login/", payload)
}

export async function logoutUser() {
  return await post("/auth/logout/", {})
}

export async function getCurrentUser() {
  const res = await api.get("/auth/me/", {
    withCredentials: true,
  })
  return res.data
}

export async function getReports() {
  const res = await api.get("/reports/", {
    withCredentials: true,
  })
  return res.data
}

export async function uploadReport(file) {
  const formData = new FormData()
  formData.append("file", file)

  const csrftoken = getCookie("csrftoken") || (await ensureCsrfCookie())

  const res = await api.post("/reports/upload/", formData, {
    withCredentials: true,
    headers: {
      "X-CSRFToken": csrftoken,
    },
  })

  return res.data
}

export async function getReport(id) {
  const res = await api.get(`/reports/${id}/`, {
    withCredentials: true,
  })
  return res.data
}

export async function chatWithReport(id, message) {
  return await post(`/reports/${id}/chat/`, { message })
}

export async function homeChat(message) {
  return await post("/home-chat/", { message })
}

export async function getHealthcareNews() {
  const res = await api.get("/news/healthcare/", {
    withCredentials: true,
  })
  return res.data
}

export async function getCancerNews() {
  const res = await api.get("/news/cancer/", {
    withCredentials: true,
  })
  return res.data
}

export function getSummaryPdfUrl(id) {
  return `${API_BASE}/reports/${id}/summary-pdf/`
}

export async function createConsultRoom(payload = {}) {
  return await post("/doctor/rooms/create/", payload)
}

export async function joinConsultRoom(payload) {
  return await post("/doctor/rooms/join/", payload)
}

export async function getConsultRoomToken(roomId) {
  return await post(`/doctor/rooms/${roomId}/token/`, {})
}

export { api, ROOT_BASE, API_BASE }
