import { useState, useEffect } from 'react'
import Logo from '../components/Logo'
import { useNavigate } from 'react-router-dom'
import { api } from '../apiClient'

export default function SetPassword() {
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    if (!token) navigate('/login')
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (pwd.length < 6) { setError('Minimum 6 caractères'); return }
    if (pwd !== pwd2) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    setError('')
    const result = await api.post('/auth/set-password', { token, password: pwd })
    if (result?.error) { setError(result.error); setLoading(false); return }
    // Déconnecter l'utilisateur actuel avant de connecter le nouveau
    api.clearTokens()
    // Login automatique
    const loginResult = await api.login(result.email, pwd)
    if (loginResult?.access) {
      setDone(true)
      setTimeout(() => {
        if(loginResult.role === 'gerant') window.location.href='/gerant'
        else if(loginResult.role === 'employe') window.location.href='/moi'
        else window.location.href='/login'
      }, 1500)
    } else {
      setDone(true)
      setTimeout(() => { window.location.href='/login' }, 1500)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f1f5f9',fontFamily:'-apple-system,sans-serif',padding:16}}>
      <div style={{background:'white',borderRadius:20,padding:40,width:'100%',maxWidth:400,boxShadow:'0 20px 60px rgba(0,0,0,.1)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <Logo size={28}/>
          <div style={{fontSize:20,fontWeight:700,color:'#0C1A35',marginTop:8}}>Créer votre mot de passe</div>
          <div style={{fontSize:13,color:'#94a3b8',marginTop:4}}>Choisissez un mot de passe sécurisé</div>
        </div>
        {done ? (
          <div style={{textAlign:'center',color:'#16a34a',fontSize:15,fontWeight:600}}>✅ Mot de passe créé — redirection...</div>
        ) : (
          <div>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#64748b',marginBottom:6}}>Mot de passe</label>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Min. 6 caractères" style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#64748b',marginBottom:6}}>Confirmer</label>
              <input type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} placeholder="Répétez le mot de passe" style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
            </div>
            {error && <div style={{color:'#dc2626',fontSize:13,marginBottom:12}}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:'#E11D48',color:'white',fontSize:15,fontWeight:700,cursor:'pointer'}}>
              {loading ? 'Enregistrement...' : 'Créer mon mot de passe →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
