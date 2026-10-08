const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api"

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

async function requestForm(path, formData) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

const today = () => new Date().toISOString().slice(0, 10)

export const api = {
  getDashboard:        () => request("GET", `/dashboard/${today()}`),
  getVehicles:         () => request("GET", `/plans/${today()}/vehicles`),
  getDelays:           () => request("GET", `/dashboard/${today()}/delays`),
  getPlannedVsReal:    () => request("GET", `/dashboard/planned-vs-realized/${today()}`),
  getDelaySummary:     () => request("GET", `/dashboard/delays/summary/${today()}`),
  getHistory:   (id)   => request("GET", `/vehicles/${id}/history`),
  getVolumes:   (id)   => request("GET", `/vehicles/${id}/volumes`),
  retornoAnalista: (id, volumes) =>
    request("POST", `/vehicles/${id}/retorno-analista`, {
      actorName: "Victor Mosquera", volumes,
    }),

  // ── Programação ──────────────────────────────────────────────────────────
  // Passo 1: envia o Excel, recebe preview (sem salvar no banco ainda)
  parseExcel: (formData) => requestForm("/plans/parse-excel", formData),

  // Passo 2: confirma e salva no banco (libera para Edinaldo)
  importarProgramacao: (preview) =>
    request("POST", "/plans/import", {
      date:     preview.date,
      vehicles: preview.vehicles,
      actorName: "Victor Mosquera",
    }),
}

export function connectWS(onMessage) {
  let ws = null
  let ping = null
  let reconnectTimer = null
  let destroyed = false

  function connect() {
    if (destroyed) return
    const wsBase = (import.meta.env.VITE_API_URL || "http://localhost:3001")
      .replace("http", "ws").replace("/api", "")
    ws = new WebSocket(`${wsBase}/ws?actorId=victor-mosquera-id`)
    ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)) } catch {} }
    ws.onopen    = () => {
      console.log("[WS] conectado")
      ping = setInterval(() => {
        if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "PING" }))
      }, 30000)
    }
    ws.onclose = () => {
      clearInterval(ping)
      if (!destroyed) reconnectTimer = setTimeout(connect, 5000)
    }
    ws.onerror = () => ws.close()
  }

  connect()

  // retorna handle com close() para cleanup no useEffect
  return {
    close() {
      destroyed = true
      clearInterval(ping)
      clearTimeout(reconnectTimer)
      if (ws) ws.close()
    }
  }
}
