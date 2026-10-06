import styles from "./Sidebar.module.css"

const NAV = [
  { key: "dashboard", icon: "◈", label: "Dashboard" },
  { key: "planeado",  icon: "⊟", label: "Planeado vs Real" },
  { key: "atrasos",   icon: "⚠", label: "Atrasos" },
  { key: "retorno",   icon: "↩", label: "Retorno de Cargas" },
]

export default function Sidebar({ page, onNav, online }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>🧊</div>
        <div>
          <div className={styles.brandName}>GELOCRIM</div>
          <div className={styles.brandSub}>Painel Operacional</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV.map(n => (
          <button key={n.key}
            className={`${styles.navItem} ${page === n.key ? styles.navActive : ""}`}
            onClick={() => onNav(n.key)}>
            <span className={styles.navIcon}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={`${styles.ws} ${online ? styles.wsOn : styles.wsOff}`}>
          <div className={styles.wsDot} />
          <span>{online ? "Tempo real ativo" : "Reconectando..."}</span>
        </div>
        <div className={styles.actor}>Victor Mosquera</div>
        <div className={styles.date}>
          {new Date().toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit", month:"short" })}
        </div>
      </div>
    </aside>
  )
}
