import { useState, useEffect } from "react"
import { api } from "../services/api"
import styles from "./Planeado.module.css"

function fmt(ts) {
  if (!ts) return "—"
  return new Date(ts).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })
}

function cmp(plan, ret) {
  if (!plan) return "—"
  if (ret == null) return `${plan} / —`
  const diff = ret - plan
  const sign = diff > 0 ? "+" : ""
  return diff !== 0 ? `${plan}/${ret} (${sign}${diff})` : `${plan}/${ret}`
}

export default function Planeado() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPlannedVsReal()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.h1}>Planeado vs Realizado</h1>
        <div className={styles.date}>
          {new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" })}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : rows.length === 0 ? (
        <div className={styles.vazio}>Nenhum dado para hoje. Importe o plano do dia primeiro.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Seq</th>
                <th>VDA</th>
                <th>Motorista</th>
                <th>Estado</th>
                <th>Início carga</th>
                <th>Lib. portaria</th>
                <th>Saída</th>
                <th>Retorno</th>
                <th>KM</th>
                <th>5kg p/r</th>
                <th>10kg p/r</th>
                <th>20kg p/r</th>
                <th>40kg p/r</th>
                <th>OC pend.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className={r.liberacao_atrasada ? styles.rowAtraso : ""}>
                  <td>{r.sequence}</td>
                  <td className={styles.tdVda}>{r.vda}</td>
                  <td>{r.motorista_name || "—"}</td>
                  <td><span className={`${styles.state} ${r.state === "finalizado" ? styles.stateDone : ""}`}>{r.state?.replace(/_/g," ")}</span></td>
                  <td>{fmt(r.carga_inicio_ts)}</td>
                  <td className={r.liberacao_atrasada ? styles.tdRed : ""}>{fmt(r.liberacao_asistente_ts)}</td>
                  <td>{fmt(r.saida_portaria_ts)}</td>
                  <td>{fmt(r.retorno_fisico_ts)}</td>
                  <td>{r.km_percorrido != null ? `${r.km_percorrido}km` : "—"}</td>
                  <td>{cmp(r.plan_kg5,  r.ret_kg5)}</td>
                  <td>{cmp(r.plan_kg10, r.ret_kg10)}</td>
                  <td>{cmp(r.plan_kg20, r.ret_kg20)}</td>
                  <td>{cmp(r.plan_kg40, r.ret_kg40)}</td>
                  <td className={r.oc_pending_count > 0 ? styles.tdAmber : ""}>{r.oc_pending_count > 0 ? `${r.oc_pending_count} pend.` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
