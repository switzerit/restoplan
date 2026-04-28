import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Vérifie si déjà connecté au chargement
  useEffect(()=>{
    supabase.auth.getSession().then(async({data})=>{
      if(data.session){
        const {data:profil} = await supabase.from('profils').select('role').eq('user_id',data.session.user.id).single()
        if(profil?.role==='gerant') navigate('/gerant')
        else navigate('/moi')
      } else {
        setLoading(false)
      }
    })
  },[])

  async function handleLogin(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    const {data,error} = await supabase.auth.signInWithPassword({email,password})
    if(error){setError('Email ou mot de passe incorrect');setLoading(false);return}
    const {data:profil} = await supabase.from('profils').select('role').eq('user_id',data.user.id).single()
    if(profil?.role==='gerant') navigate('/gerant')
    else navigate('/moi')
    setLoading(false)
  }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'var(--text2)'}}>
      Chargement...
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'var(--font)'}}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{width:60,height:60,background:'var(--accent)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 16px'}}>🍽️</div>
          <div style={{fontSize:26,fontWeight:800,color:'var(--text)'}}>RestoPlan</div>
          <div style={{fontSize:14,color:'var(--text2)',marginTop:6}}>Connectez-vous à votre espace</div>
        </div>
        <div style={{background:'var(--surface)',borderRadius:20,padding:28,border:'1px solid var(--border)',boxShadow:'0 4px 24px rgba(0,0,0,.06)'}}>
          <form onSubmit={handleLogin}>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required
              style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:14,color:'var(--text)',outline:'none',transition:'border-color .15s'}}
              onFocus={e=>e.target.style.borderColor='var(--accent)'}
              onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
              style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:14,color:'var(--text)',outline:'none',transition:'border-color .15s'}}
              onFocus={e=>e.target.style.borderColor='var(--accent)'}
              onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
            </div>
            {error&&<div style={{padding:'10px 14px',background:'var(--red-bg)',border:'1px solid rgba(255,59,48,.2)',borderRadius:10,fontSize:13,color:'var(--red)',marginBottom:16,fontWeight:600}}>{error}</div>}
            <button type="submit" disabled={loading} style={{width:'100%',height:48,borderRadius:12,border:'none',background:'var(--accent)',color:'white',fontSize:15,fontWeight:700,cursor:loading?'wait':'pointer',opacity:loading?.7:1}}>
              Se connecter
            </button>
          </form>
        </div>
        <div style={{textAlign:'center',marginTop:20,padding:'14px',background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)'}}>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:8}}>Accès tablette restaurant</div>
          <button onClick={()=>navigate('/borne')} style={{fontSize:13,fontWeight:600,color:'var(--accent)',background:'transparent',border:'none',cursor:'pointer'}}>
            → Ouvrir la borne de badgeage
          </button>
        </div>
      </div>
    </div>
  )
}
