import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Borne from './pages/Borne'
import Gerant from './pages/Gerant'
import Employe from './pages/Employe'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/borne" element={<Borne />} />
        <Route path="/gerant" element={<Gerant />} />
        <Route path="/moi" element={<Employe />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/borne" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
