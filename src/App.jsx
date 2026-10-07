import { useState } from "react"
import Sidebar       from "./components/ui/Sidebar"
import Dashboard     from "./pages/Dashboard"
import Planeado      from "./pages/Planeado"
import Atrasos       from "./pages/Atrasos"
import Retorno       from "./pages/Retorno"
import Programacao   from "./pages/Programacao"
import VehicleDetail from "./components/dashboard/VehicleDetail"
import "./index.css"
import styles from "./App.module.css"

export default function App() {
  const [page, setPage]         = useState("dashboard")
  const [online, setOnline]     = useState(false)
  const [selected, setSelected] = useState(null)

  return (
    <div className={styles.layout}>
      <Sidebar page={page} onNav={setPage} online={online} />
      <div className={styles.main}>
        {page === "programacao" && <Programacao />}
        {page === "dashboard"   && (
          <Dashboard onSelectVehicle={setSelected} setOnline={setOnline} />
        )}
        {page === "planeado"    && <Planeado />}
        {page === "atrasos"     && <Atrasos />}
        {page === "retorno"     && <Retorno />}
      </div>
      {selected && (
        <VehicleDetail vehicle={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
