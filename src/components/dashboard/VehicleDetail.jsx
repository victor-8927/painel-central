import { useState, useEffect } from "react"
import { api } from "../../services/api"
import styles from "./VehicleDetail.module.css"

const CHECKPOINT_LABEL = {
  carga_inicio:        "Início da carga",
  carga_fim:           "Fim da carga",
  liberacao_asistente: "Liberação asistente",
  saida_portaria:      "Saída portaria",
  abastecimento_inicio:"Abastecimento início",
  abastecimento_fim:   "Abastecimento fim",
  retorno_fisico:      "Retorno físico",
  retorno_analista_ok: "Retorno analista",
  conferencia_retorno: "Conferência retorno",
}

export default function VehicleDetail({ vehicle, onClose }) {
  const [history, setHistory] = useState([])
  const [volumes, setVolumes] = useState([])

  useEffect(() => {
    api.getHistory(vehicle.id).then(setHistory).catch(() => [])
    api.getVolumes(vehicle.id).then(setVolumes).catch(() => [])
  }, [vehicle.id])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.head}>
          <div>
            <div className={styles.vda}>{vehicle.vda}</div>
            <div className={styles.meta}>{vehicle.rota} · {vehicle.vehicle_type} · {vehicle.motorista_name}</div>
          </div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        {vehicle.km_saida && (
          <div className={styles.kms}>
            <div className={styles.km}><span>KM saída</span><strong>{vehicle.km_saida?.toLocaleString("pt-BR")}</strong></div>
            {vehicle.km_retorno && (
              <>
                <div className={styles.km}><span>KM retorno</span><strong>{vehicle.km_retorno?.toLocaleString("pt-BR")}</strong></div>
                <div className={styles.km}><span>Percorrido</span><strong className={styles.kmGreen}>{vehicle.km_retorno - vehicle.km_saida} km</strong></div>
              </>
            )}
          </div>
        )}

        <div className={styles.section}>CARGA</div>
        {volumes.length === 0 && <div className={styles.empty}>Sem volumes registrados</div>}
        {volumes.map((vol, i) => {
          const skus = []
          if (vol.planned_kg5)  skus.push(`${vol.planned_kg5} sc 5kg`)
          if (vol.planned_kg10) skus.push(`${vol.planned_kg10} sc 10kg`)
          if (vol.planned_kg20) skus.push(`${vol.planned_kg20} sc 20kg`)
          if (vol.planned_kg40) skus.push(`${vol.planned_kg40} sc 40kg`)
          return (
            <div key={i} className={styles.volRow}>
              <div className={styles.volType}>{vol.volume_type}</div>
              <div className={styles.volOc}>{vol.oc_number ? `OC ${vol.oc_number}` : "⚠ OC pendente"}</div>
              <div className={styles.volSkus}>{skus.join(" · ") || "—"}</div>
            </div>
          )
        })}

        <div className={styles.section}>HISTÓRICO DE EVENTOS</div>
        <div className={styles.history}>
          {history.length === 0 && <div className={styles.empty}>Sem eventos registrados</div>}
          {history.map((ev, i) => (
            <div key={i} className={`${styles.ev} ${ev.is_delayed ? styles.evDelay : ""}`}>
              <div className={styles.evTime}>
                {new Date(ev.occurred_at).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}
              </div>
              <div className={styles.evBody}>
                <div className={styles.evLabel}>{CHECKPOINT_LABEL[ev.checkpoint] || ev.checkpoint}</div>
                <div className={styles.evActor}>{ev.actor_name}</div>
                {ev.is_delayed && (
                  <div className={styles.evAlert}>+{ev.delay_minutes}min — {ev.delay_justification || ev.delay_reason || "sem justificativa"}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
