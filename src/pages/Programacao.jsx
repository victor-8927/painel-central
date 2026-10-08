import { useState, useRef, useEffect } from "react"
import { api } from "../services/api"
import styles from "./Programacao.module.css"

const SKUS = ["kg3","kg5","kg10","kg20","kg40","kg50"]

const todayBR = () => {
  const d = new Date()
  return d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" })
}

function totalPeso(v) {
  return (
    (v.planned_kg3  || 0) *  3 +
    (v.planned_kg5  || 0) *  5 +
    (v.planned_kg10 || 0) * 10 +
    (v.planned_kg20 || 0) * 20 +
    (v.planned_kg40 || 0) * 40 +
    (v.planned_kg50 || 0) * 50
  )
}

export default function Programacao() {
  const [etapa, setEtapa]           = useState("carregando")  // carregando | upload | preview | enviando | ok | erro
  const [preview, setPreview]       = useState(null)           // { date, vehicles[] }
  const [erroMsg, setErroMsg]       = useState("")
  const [sucessoMsg, setSucessoMsg] = useState("")
  const fileRef = useRef(null)

  // ── Carrega programação do dia ao abrir ────────────────────────────────
  useEffect(() => {
    let cancelled = false
    api.getVehicles()
      .then(vehicles => {
        if (cancelled) return
        if (vehicles && vehicles.length > 0) {
          setPreview({ date: todayBR(), vehicles })
          setEtapa("preview")
        } else {
          setEtapa("upload")
        }
      })
      .catch(() => { if (!cancelled) setEtapa("upload") })
    return () => { cancelled = true }
  }, [])

  // ── Upload e parse via API ──────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return
    setEtapa("enviando")
    setErroMsg("")

    const form = new FormData()
    form.append("file", file)

    try {
      const data = await api.parseExcel(form)
      setPreview(data)
      setEtapa("preview")
    } catch (e) {
      setErroMsg(e.message || "Erro ao processar o arquivo")
      setEtapa("erro")
    }
  }

  // ── Confirmar envio para expedição ─────────────────────────────────────
  const handleConfirmar = async () => {
    setEtapa("enviando")
    setErroMsg("")
    try {
      await api.importarProgramacao(preview)
      setSucessoMsg(`Programação de ${preview.date} enviada — ${preview.vehicles.length} veículos liberados para a expedição.`)
      setEtapa("ok")
    } catch (e) {
      setErroMsg(e.message || "Erro ao importar programação")
      setEtapa("erro")
    }
  }

  const handleNova = () => {
    setEtapa("upload")
    setPreview(null)
    setErroMsg("")
    setSucessoMsg("")
    if (fileRef.current) fileRef.current.value = ""
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Programação do Dia</h1>
          <div className={styles.sub}>Importe a planilha Excel e libere o turno para a expedição</div>
        </div>
        {(etapa === "ok" || etapa === "preview") && (
          <button className={styles.btnNova} onClick={handleNova}>
            ↑ Reimportar Excel
          </button>
        )}
      </div>

      {/* ── CARREGANDO ── */}
      {etapa === "carregando" && (
        <div className={styles.statusBox}>
          <div className={styles.spinner} />
          <div className={styles.statusMsg}>Buscando programação do dia...</div>
        </div>
      )}

      {/* ── UPLOAD ── */}
      {etapa === "upload" && (
        <div
          className={styles.dropzone}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])}
          />
          <div className={styles.dropIcon}>📋</div>
          <div className={styles.dropTitle}>Arraste o arquivo Excel aqui</div>
          <div className={styles.dropSub}>ou clique para selecionar</div>
          <div className={styles.dropHint}>.xlsx · .xls</div>
        </div>
      )}

      {/* ── ENVIANDO ── */}
      {etapa === "enviando" && (
        <div className={styles.statusBox}>
          <div className={styles.spinner} />
          <div className={styles.statusMsg}>Processando...</div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {etapa === "preview" && preview && (
        <div className={styles.previewWrap}>
          <div className={styles.previewHeader}>
            <div className={styles.previewInfo}>
              <span className={styles.badge}>📅 {preview.date}</span>
              <span className={styles.badge}>{preview.vehicles.length} veículos</span>
              <span className={styles.badge}>
                {((preview.vehicles.reduce((a, v) => a + totalPeso(v), 0)) / 1000).toFixed(1)} t
              </span>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.btnCancelar} onClick={handleNova}>✕ Cancelar</button>
              <button className={styles.btnConfirmar} onClick={handleConfirmar}>
                ✓ Confirmar e enviar
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>VDA</th>
                  <th>Rota</th>
                  <th>Motorista</th>
                  <th>3kg</th>
                  <th>5kg</th>
                  <th>10kg</th>
                  <th>20kg</th>
                  <th>40kg</th>
                  <th>50kg</th>
                  <th>Peso total</th>
                  <th>OC</th>
                </tr>
              </thead>
              <tbody>
                {preview.vehicles.map((v, i) => (
                  <tr key={i}>
                    <td>{v.sequence || i + 1}</td>
                    <td className={styles.tdVda}>{v.vda}</td>
                    <td>{v.rota}</td>
                    <td>{v.motorista_name || "—"}</td>
                    <td>{v.planned_kg3  || "—"}</td>
                    <td>{v.planned_kg5  || "—"}</td>
                    <td>{v.planned_kg10 || "—"}</td>
                    <td>{v.planned_kg20 || "—"}</td>
                    <td>{v.planned_kg40 || "—"}</td>
                    <td>{v.planned_kg50 || "—"}</td>
                    <td className={styles.tdPeso}>
                      {(totalPeso(v) / 1000).toFixed(2)} t
                    </td>
                    <td className={v.oc_pending ? styles.tdOc : ""}>
                      {v.oc_number || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── OK ── */}
      {etapa === "ok" && (
        <div className={styles.statusBox}>
          <div className={styles.okIcon}>✅</div>
          <div className={styles.okMsg}>{sucessoMsg}</div>
          <div className={styles.okSub}>
            A expedição de Edinaldo já pode ver os veículos programados.
          </div>
        </div>
      )}

      {/* ── ERRO ── */}
      {etapa === "erro" && (
        <div className={styles.statusBox}>
          <div className={styles.errIcon}>⚠</div>
          <div className={styles.errMsg}>{erroMsg}</div>
          <button className={styles.btnNova} onClick={handleNova} style={{ marginTop: 16 }}>
            ↩ Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
