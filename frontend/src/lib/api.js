
import axios from "axios"

const ROOT_BASE =
  import.meta.env.VITE_API_ROOT?.trim() || "http://127.0.0.1:8000"

const API_BASE = `${ROOT_BASE.replace(/\/+$/, "")}/api`

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

let csrfTokenCache = null

export async function ensureCsrfCookie() {
  const res = await api.get("/health/", {
    withCredentials: true,
  })

  csrfTokenCache = res.data?.csrfToken || null
  console.log("CSRF TOKEN FROM API:", csrfTokenCache)

  return csrfTokenCache
}

async function post(url, data = {}, config = {}) {
  const csrftoken = csrfTokenCache || (await ensureCsrfCookie())

  if (!csrftoken) {
    throw new Error("CSRF token missing from backend response.")
  }

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

export async function signupUser({
  username,
  email,
  password,
  confirm_password,
}) {
  const data = await post("/auth/signup/", {
    username,
    email,
    password,
    confirm_password,
  })

  await ensureCsrfCookie()
  return data
}

export async function loginUser({ username, password }) {
  const data = await post("/auth/login/", {
    username,
    password,
  })

  await ensureCsrfCookie()
  return data
}

export async function logoutUser() {
  const data = await post("/auth/logout/", {})
  csrfTokenCache = null
  return data
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

  const csrftoken = csrfTokenCache || (await ensureCsrfCookie())

  if (!csrftoken) {
    throw new Error("CSRF token missing from backend response.")
  }

  console.log("USING CSRF TOKEN FOR UPLOAD:", csrftoken)

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

export async function downloadSummaryPdf(id) {
  const res = await api.get(`/reports/${id}/summary-pdf/`, {
    withCredentials: true,
    responseType: "blob",
  })

  const blob = new Blob([res.data], { type: "application/pdf" })
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `report-summary-${id}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
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
