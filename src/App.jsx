import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Borne from './pages/Borne'
import Gerant from './pages/Gerant'
import Employe from './pages/Employe'
import Login from './pages/Login'

function ProtectedGerant({ children }) {
  const [ok, setOk] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setOk(false); return }
      const { data: profil } = await supabase.from('profils').select('role').eq('user_id', data.session.user.id).single()
      setOk(profil?.role === 'gerant')
    })
  }, [])
  if (ok === null) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#6e6e73'}}>Chargement...</div>
  return ok ? children : <Navigate to="/login" />
}

function ProtectedEmploye({ children }) {
  const [ok, setOk] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setOk(!!data.session)
    })
  }, [])
  if (ok === null) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#6e6e73'}}>Chargement...</div>
  return ok ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/borne" element={<Borne />} />
        <Route path="/gerant" element={<ProtectedGerant><Gerant /></ProtectedGerant>} />
        <Route path="/moi" element={<ProtectedEmploye><Employe /></ProtectedEmploye>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
