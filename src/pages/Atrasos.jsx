import { useState, useEffect } from "react"
import { api } from "../services/api"
import styles from "./Atrasos.module.css"

const CHECKPOINT = {
  carga_inicio:         "Início da carga",
  carga_fim:            "Fim da carga",
  liberacao_asistente:  "Liberação asistente",
  saida_portaria:       "Saída portaria",
  abastecimento_inicio: "Abastecimento",
  retorno_fisico:       "Retorno físico",
  retorno_analista_ok:  "Retorno analista",
  conferencia_retorno:  "Conferência retorno",
}

export default function Atrasos() {
  const [delays,  setDelays]  = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getDelays().catch(() => []),
      api.getDelaySummary().catch(() => []),
    ]).then(([d, s]) => { setDelays(d); setSummary(s) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.h1}>Atrasos</h1>
        <div className={styles.date}>
          {new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" })}
        </div>
      </div>

      {/* Resumo */}
      {summary.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>RESUMO POR PONTO DE CONTROLE</div>
          <div className={styles.grid}>
            {summary.map((s, i) => (
              <div key={i} className={styles.summaryCard}>
                <div className={styles.summaryChk}>{CHECKPOINT[s.checkpoint] || s.checkpoint}</div>
                <div className={styles.summaryNum}>{s.delayed_count}</div>
                <div className={styles.summaryLabel}>atrasos · média {Math.round(s.avg_delay_min || 0)}min</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>DETALHAMENTO</div>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : delays.length === 0 ? (
          <div className={styles.vazio}>✓ Nenhum atraso registrado hoje</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>VDA</th>
                  <th>Motorista</th>
                  <th>Ponto</th>
                  <th>Responsável</th>
                  <th>Atraso</th>
                  <th>Motivo</th>
                  <th>Justificativa</th>
                </tr>
              </thead>
              <tbody>
                {delays.map(d => (
                  <tr key={d.id}>
                    <td>{new Date(d.occurred_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</td>
                    <td className={styles.tdVda}>{d.vda}</td>
                    <td>{d.motorista_name}</td>
                    <td>{CHECKPOINT[d.checkpoint] || d.checkpoint}</td>
                    <td>{d.actor_name}</td>
                    <td className={styles.tdDelay}>{d.delay_minutes}min</td>
                    <td>{d.delay_reason?.replace(/_/g," ") || "—"}</td>
                    <td className={styles.tdJust}>{d.delay_justification || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
