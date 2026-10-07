import { useState, useEffect, useCallback, useRef } from "react"
import VehicleCard from "../components/dashboard/VehicleCard"
import { api, connectWS } from "../services/api"
import styles from "./Dashboard.module.css"

const MOCK = {
  totalVehicles: 5,
  byState: { aguardando_carga:1, em_carga:1, em_rota:2, finalizado:1 },
  alerts: [
    { type:"LIBERACAO_ATRASADA", urgency:"high", vda:"VDA 81", motorista:"Mirian", message:"VDA 81 aguarda liberação há 14 min — SLA excedido", diffMin:14 },
  ],
  vehicles: [
    { id:"v1", sequence:1, vda:"VDA 80",    rota:"ROTA 802",  vehicle_type:"toco",     motorista_name:"Jean Pinto", state:"em_rota",          liberacao_atrasada:false, km_saida:45230, km_retorno:45618, planned_peso_kg:1200, carga_inicio_ts:"2026-10-05T08:21:00Z", carga_fim_ts:"2026-10-05T09:08:00Z", liberacao_asistente_ts:"2026-10-05T09:17:00Z", saida_portaria_ts:"2026-10-05T09:22:00Z", retorno_fisico_ts:"2026-10-05T17:40:00Z" },
    { id:"v2", sequence:2, vda:"VDA 81",    rota:"ROTA 805",  vehicle_type:"toco",     motorista_name:"Mirian",     state:"liberado_producao", liberacao_atrasada:true,  km_saida:null,  km_retorno:null, planned_peso_kg:800,  carga_inicio_ts:"2026-10-05T08:30:00Z", carga_fim_ts:"2026-10-05T09:25:00Z", liberacao_asistente_ts:null, saida_portaria_ts:null, retorno_fisico_ts:null, duracao_liberacao_min:14 },
    { id:"v3", sequence:3, vda:"VDA 46",    rota:"ROTA APOIO",vehicle_type:"truncado", motorista_name:"Wallace",    state:"em_rota",          liberacao_atrasada:false, km_saida:12400, km_retorno:null, planned_peso_kg:950,  carga_inicio_ts:"2026-10-05T08:10:00Z", carga_fim_ts:"2026-10-05T09:32:00Z", liberacao_asistente_ts:"2026-10-05T09:40:00Z", saida_portaria_ts:"2026-10-05T09:45:00Z", retorno_fisico_ts:null },
    { id:"v4", sequence:4, vda:"VDA 03",    rota:"ROTA 821",  vehicle_type:"toco",     motorista_name:"Frankney",   state:"finalizado",        liberacao_atrasada:false, km_saida:33100, km_retorno:33520, planned_peso_kg:1500, carga_inicio_ts:"2026-10-05T08:05:00Z", carga_fim_ts:"2026-10-05T08:43:00Z", liberacao_asistente_ts:"2026-10-05T08:50:00Z", saida_portaria_ts:"2026-10-05T08:55:00Z", retorno_fisico_ts:"2026-10-05T18:30:00Z" },
    { id:"v5", sequence:5, vda:"VDA ACCELO",rota:"ROTA 803",  vehicle_type:"3/4",      motorista_name:"Roldao",     state:"em_carga",          liberacao_atrasada:false, km_saida:null,  km_retorno:null, planned_peso_kg:600,  carga_inicio_ts:"2026-10-05T09:50:00Z", carga_fim_ts:null, liberacao_asistente_ts:null, saida_portaria_ts:null, retorno_fisico_ts:null },
  ],
}

const FILTROS = ["todos","em_carga","em_rota","retornado","finalizado","atrasados"]

// ── Helpers de cálculo ──────────────────────────────────────────────────────
function calcMetricas(vehicles) {
  let pesoKg = 0
  let kmTotal = 0
  let tempoMin = 0
  let countTempo = 0

  for (const v of vehicles) {
    pesoKg += v.planned_peso_kg || 0

    if (v.km_saida && v.km_retorno) {
      kmTotal += v.km_retorno - v.km_saida
    }

    if (v.saida_portaria_ts && v.retorno_fisico_ts) {
      const diffMs = new Date(v.retorno_fisico_ts) - new Date(v.saida_portaria_ts)
      tempoMin += diffMs / 60000
      countTempo++
    }
  }

  const tempoMedMin = countTempo > 0 ? Math.round(tempoMin / countTempo) : 0
  const tempoMedH   = `${Math.floor(tempoMedMin/60)}h${String(tempoMedMin%60).padStart(2,"0")}`

  return {
    pesoT:    (pesoKg / 1000).toFixed(1),
    kmTotal,
    tempoMed: countTempo > 0 ? tempoMedH : "—",
  }
}

export default function Dashboard({ onSelectVehicle, setOnline }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro]   = useState("todos")
  const wsRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const d = await api.getDashboard()
      setData(d)
    } catch {
      setData(MOCK)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    wsRef.current = connectWS((msg) => {
      if (msg.type === "STATE_CHANGE" || msg.type === "DAILY_SNAPSHOT") load()
      setOnline(true)
    })
    wsRef.current.onopen  = () => setOnline(true)
    wsRef.current.onclose = () => setOnline(false)
    return () => wsRef.current?.close()
  }, [load])

  const vehicles = data?.vehicles || []
  const filtered = filtro === "todos"      ? vehicles
    : filtro === "atrasados" ? vehicles.filter(v => v.liberacao_atrasada)
    : vehicles.filter(v => v.state === filtro)

  const metricas = calcMetricas(vehicles)

  const kpis = [
    { label: "Total",       val: data?.totalVehicles || 0,                                     dim: false },
    { label: "Em rota",     val: data?.byState?.em_rota || 0,                                  dim: false },
    { label: "Finalizados", val: data?.byState?.finalizado || 0,                               dim: false },
    { label: "Atrasos",     val: (data?.alerts || []).filter(a=>a.urgency==="high").length,    dim: true  },
  ]

  const metrKpis = [
    { label: "Peso transportado", val: `${metricas.pesoT} t`,   icon: "🏋️", dim: false },
    { label: "KM gerado",         val: `${metricas.kmTotal} km`, icon: "🛣️", dim: false },
    { label: "Tempo médio/rota",  val: metricas.tempoMed,        icon: "⏱️", dim: false },
  ]

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Dashboard</h1>
          <div className={styles.date}>
            {new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
          </div>
        </div>
        <button className={styles.btnRefresh} onClick={load}>↻ Atualizar</button>
      </div>

      {/* Alertas */}
      {(data?.alerts || []).map((a, i) => (
        <div key={i} className={`${styles.alert} ${a.urgency === "high" ? styles.alertHigh : styles.alertMed}`}>
          <span className={styles.alertIcon}>⚠</span>
          {a.message}
        </div>
      ))}

      {/* KPIs operacionais */}
      <div className={styles.kpis}>
        {kpis.map(k => (
          <div key={k.label} className={styles.kpi}>
            <div className={`${styles.kpiVal} ${k.dim && k.val > 0 ? styles.kpiRed : ""}`}>{k.val}</div>
            <div className={styles.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* KPIs de desempenho — peso / KM / tempo */}
      <div className={styles.metricas}>
        {metrKpis.map(m => (
          <div key={m.label} className={styles.metrica}>
            <div className={styles.metricaIcon}>{m.icon}</div>
            <div className={styles.metricaVal}>{m.val}</div>
            <div className={styles.metricaLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className={styles.filtros}>
        {FILTROS.map(f => (
          <button key={f}
            className={`${styles.filtro} ${filtro === f ? styles.filtroOn : ""}`}
            onClick={() => setFiltro(f)}>
            {f === "todos" ? "Todos" : f === "atrasados" ? "⚠ Atrasos" : f.replace("_"," ")}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingDot} />
          Carregando...
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(v => (
            <VehicleCard key={v.id} vehicle={v} onClick={onSelectVehicle} />
          ))}
        </div>
      )}
    </div>
  )
}
