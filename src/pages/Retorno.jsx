import { useState, useEffect } from "react"
import { api } from "../services/api"
import styles from "./Retorno.module.css"

export default function Retorno() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [volumes, setVolumes]   = useState([])
  const [retornos, setRetornos] = useState({})
  const [saving, setSaving]     = useState(false)
  const [erro, setErro]         = useState("")
  const [sucesso, setSucesso]   = useState("")

  const load = () => {
    api.getVehicles()
      .then(v => setVehicles(v.filter(x => ["retornado","retorno_analista","retorno_conferencia"].includes(x.state))))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSelect = async (v) => {
    setSelected(v)
    setRetornos({})
    setErro("")
    setSucesso("")
    const vols = await api.getVolumes(v.id).catch(() => [])
    setVolumes(vols)
  }

  const setRet = (volId, sku, val) =>
    setRetornos(prev => ({ ...prev, [volId]: { ...(prev[volId]||{}), [sku]: parseInt(val)||0 } }))

  const handleSalvar = async () => {
    setSaving(true); setErro(""); setSucesso("")
    try {
      const payload = volumes.filter(v => v.return_rule !== "none").map(v => ({
        volumeId:      v.id,
        returned_kg5:  retornos[v.id]?.kg5  || 0,
        returned_kg10: retornos[v.id]?.kg10 || 0,
        returned_kg20: retornos[v.id]?.kg20 || 0,
        returned_kg40: retornos[v.id]?.kg40 || 0,
      }))
      await api.retornoAnalista(selected.id, payload)
      setSucesso(`VDA ${selected.vda} — retorno registrado com sucesso.`)
      setSelected(null)
      load()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSaving(false)
    }
  }

  const STATE_LABEL = {
    retornado:           "Aguardando Victor",
    retorno_analista:    "Aguardando Eferson",
    retorno_conferencia: "Em conferência",
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.h1}>Retorno de Cargas</h1>
        <div className={styles.date}>Registre o retorno físico por volume</div>
      </div>

      {sucesso && <div className={styles.sucesso}>{sucesso}</div>}

      <div className={styles.layout}>
        {/* Lista */}
        <div className={styles.lista}>
          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : vehicles.length === 0 ? (
            <div className={styles.vazio}>Nenhum carro em processo de retorno</div>
          ) : vehicles.map(v => (
            <div key={v.id}
              className={`${styles.card} ${selected?.id === v.id ? styles.cardSel : ""}`}
              onClick={() => handleSelect(v)}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.cardVda}>{v.vda}</div>
                  <div className={styles.cardMeta}>{v.motorista_name} · {v.rota}</div>
                </div>
                <span className={styles.cardState}>{STATE_LABEL[v.state] || v.state}</span>
              </div>
              {v.km_saida && v.km_retorno && (
                <div className={styles.cardKm}>↩ {v.km_retorno - v.km_saida} km percorrido</div>
              )}
            </div>
          ))}
        </div>

        {/* Detalhe */}
        {selected && (
          <div className={styles.detalhe}>
            <div className={styles.detalheTitle}>{selected.vda} — {selected.motorista_name}</div>

            {volumes.filter(v => v.return_rule !== "none").map((vol, i) => (
              <div key={i} className={styles.volSection}>
                <div className={styles.volType}>{vol.volume_type}</div>
                {vol.return_rule === "full" && (
                  <div className={styles.volAlert}>⚠ Obrigatório retornar TUDO</div>
                )}
                <div className={styles.skuGrid}>
                  {vol.planned_kg5  > 0 && <SkuField label="5kg"  saiu={vol.planned_kg5}  value={retornos[vol.id]?.kg5}  onChange={v => setRet(vol.id,"kg5",v)}  />}
                  {vol.planned_kg10 > 0 && <SkuField label="10kg" saiu={vol.planned_kg10} value={retornos[vol.id]?.kg10} onChange={v => setRet(vol.id,"kg10",v)} />}
                  {vol.planned_kg20 > 0 && <SkuField label="20kg" saiu={vol.planned_kg20} value={retornos[vol.id]?.kg20} onChange={v => setRet(vol.id,"kg20",v)} />}
                  {vol.planned_kg40 > 0 && <SkuField label="40kg" saiu={vol.planned_kg40} value={retornos[vol.id]?.kg40} onChange={v => setRet(vol.id,"kg40",v)} />}
                </div>
              </div>
            ))}

            {erro && <div className={styles.erro}>{erro}</div>}

            <button className={styles.btnSalvar} onClick={handleSalvar} disabled={saving}>
              {saving ? "Salvando..." : "✓ Confirmar retorno analista"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SkuField({ label, saiu, value, onChange }) {
  return (
    <div className={styles.skuField}>
      <div className={styles.skuLabel}>{label}</div>
      <div className={styles.skuSaiu}>saiu: {saiu}</div>
      <input type="number" min={0} className={styles.skuInput}
        value={value ?? ""} placeholder="voltou"
        onChange={e => onChange(e.target.value)} />
    </div>
  )
}
