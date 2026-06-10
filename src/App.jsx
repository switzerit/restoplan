import SetPassword from './pages/SetPassword'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Borne from './pages/Borne'
import Gerant from './pages/Gerant'
import Employe from './pages/Employe'
import Login from './pages/Login'
import Admin from './pages/Admin'
import { api } from './apiClient'

function getTokenRole() {
  try {
    const token = api.getTokens().access
    if (!token) return null
    return JSON.parse(atob(token.split('.')[1])).role
  } catch { return null }
}

function ProtectedGerant({ children }) {
  const role = getTokenRole()
  if (!role) return <Navigate to="/" />
  if (role !== 'gerant' && role !== 'super_admin') return <Navigate to="/" />
  return children
}

function ProtectedEmploye({ children }) {
  const role = getTokenRole()
  if (!role) return <Navigate to="/" />
  if (role !== 'employe' && role !== 'gerant' && role !== 'super_admin') return <Navigate to="/" />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/fonctionnalites" element={<Login />} />
        <Route path="/tarifs" element={<Login />} />
        <Route path="/contact" element={<Login />} />
        <Route path="/legal" element={<Login />} />
        <Route path="/faq" element={<Login />} />
        <Route path="/set-password" element={<SetPassword/>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/borne" element={<Borne />} />
        <Route path="/gerant" element={<ProtectedGerant><Gerant /></ProtectedGerant>} />
        <Route path="/moi" element={<ProtectedEmploye><Employe /></ProtectedEmploye>} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
