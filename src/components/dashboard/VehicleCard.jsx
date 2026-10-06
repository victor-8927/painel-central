import styles from "./VehicleCard.module.css"

const STATE = {
  aguardando_carga:       { label: "Aguardando",     color: "muted" },
  em_carga:               { label: "Em carga",       color: "amber" },
  liberado_producao:      { label: "Lib. produção",  color: "blue"  },
  em_liberacao_asistente: { label: "Lib. asistente", color: "amber" },
  liberado_portaria:      { label: "Lib. portaria",  color: "green" },
  em_rota:                { label: "Em rota",        color: "green" },
  abastecendo:            { label: "Abastecendo",    color: "amber" },
  retornado:              { label: "Retornado",      color: "purple"},
  retorno_analista:       { label: "Ret. analista",  color: "purple"},
  retorno_conferencia:    { label: "Conferência",    color: "purple"},
  finalizado:             { label: "Finalizado",     color: "done"  },
}

function fmt(ts) {
  if (!ts) return "—"
  return new Date(ts).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })
}

function Step({ done, ts, label }) {
  return (
    <div className={styles.step}>
      <div className={`${styles.stepDot} ${done ? styles.stepDone : ""}`}>
        {done ? "✓" : ""}
      </div>
      <div className={styles.stepLabel}>{done ? fmt(ts) : label}</div>
    </div>
  )
}

export default function VehicleCard({ vehicle, onClick }) {
  const cfg = STATE[vehicle.state] || { label: vehicle.state, color: "muted" }

  return (
    <div
      className={`${styles.card} ${vehicle.liberacao_atrasada ? styles.cardAtraso : ""}`}
      onClick={() => onClick?.(vehicle)}
    >
      <div className={styles.head}>
        <div>
          <div className={styles.vda}>{vehicle.vda}</div>
          <div className={styles.meta}>{vehicle.rota} · {vehicle.motorista_name || "—"}</div>
        </div>
        <div className={`${styles.badge} ${styles[`badge_${cfg.color}`]}`}>
          {cfg.label}
        </div>
      </div>

      <div className={styles.timeline}>
        <Step done={!!vehicle.carga_inicio_ts}        ts={vehicle.carga_inicio_ts}        label="Carga" />
        <div className={styles.tline} />
        <Step done={!!vehicle.liberacao_asistente_ts} ts={vehicle.liberacao_asistente_ts} label="Lib." />
        <div className={styles.tline} />
        <Step done={!!vehicle.saida_portaria_ts}      ts={vehicle.saida_portaria_ts}      label="Saída" />
        <div className={styles.tline} />
        <Step done={!!vehicle.retorno_fisico_ts}      ts={vehicle.retorno_fisico_ts}      label="Retorno" />
      </div>

      {vehicle.liberacao_atrasada && (
        <div className={styles.alertRow}>
          ⚠ Liberação atrasada {vehicle.duracao_liberacao_min}min — SLA excedido
        </div>
      )}

      {vehicle.km_saida && (
        <div className={styles.kmRow}>
          <span>KM saída: {vehicle.km_saida?.toLocaleString("pt-BR")}</span>
          {vehicle.km_retorno && (
            <span>Retorno: {vehicle.km_retorno?.toLocaleString("pt-BR")} · {vehicle.km_retorno - vehicle.km_saida}km</span>
          )}
        </div>
      )}
    </div>
  )
}
