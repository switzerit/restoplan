import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()

  useEffect(()=>{
    supabase.auth.getSession().then(async({data})=>{
      if(data.session){
        const {data:profil} = await supabase.from('profils').select('role').eq('user_id',data.session.user.id).single()
        if(profil?.role==='super_admin') navigate('/admin')
        else if(profil?.role==='gerant') navigate('/gerant')
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
    if(profil?.role==='super_admin') navigate('/admin')
    else if(profil?.role==='gerant') navigate('/gerant')
    else navigate('/moi')
    setLoading(false)
  }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'var(--text2)'}}>
      Chargement...
    </div>
  )

  // MODAL LOGIN
  const loginModal = showLogin && (
    <div onClick={()=>setShowLogin(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:28,width:'100%',maxWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{width:48,height:48,background:'var(--accent)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,margin:'0 auto 12px'}}>⚡</div>
          <div style={{fontSize:20,fontWeight:800}}>Connexion</div>
          <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>Accédez à votre espace</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required
            style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:14,color:'var(--text)',outline:'none'}}
            onFocus={e=>e.target.style.borderColor='var(--accent)'}
            onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Mot de passe</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
            style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:14,color:'var(--text)',outline:'none'}}
            onFocus={e=>e.target.style.borderColor='var(--accent)'}
            onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
          </div>
          {error&&<div style={{padding:'10px 14px',background:'var(--red-bg)',borderRadius:10,fontSize:13,color:'var(--red)',marginBottom:16,fontWeight:600}}>{error}</div>}
          <button type="submit" style={{width:'100%',height:48,borderRadius:12,border:'none',background:'var(--accent)',color:'white',fontSize:15,fontWeight:700,cursor:'pointer'}}>
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )

  // LANDING PAGE
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'var(--font)',overflowX:'hidden'}}>

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:50,background:'rgba(255,255,255,.85)',backdropFilter:'blur(12px)',borderBottom:'1px solid var(--border)',padding:'0 32px',height:56,display:'flex',alignItems:'center',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
          <div style={{width:30,height:30,background:'var(--accent)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>⚡</div>
          <span style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>PlanPro</span>
        </div>
        <button onClick={()=>setShowLogin(true)} style={{padding:'8px 20px',borderRadius:10,border:'1px solid var(--border2)',background:'var(--surface)',color:'var(--text)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
          Connexion
        </button>
        <button onClick={()=>setShowLogin(true)} style={{padding:'8px 20px',borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Essai gratuit
        </button>
      </nav>

      {/* HERO */}
      <section style={{paddingTop:120,paddingBottom:80,textAlign:'center',padding:'120px 24px 80px'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:20,background:'var(--accent-bg)',border:'1px solid rgba(0,113,227,.2)',marginBottom:24}}>
          <span style={{fontSize:12,fontWeight:700,color:'var(--accent)'}}>✨ Planning • Badgeage • Présences</span>
        </div>
        <h1 style={{fontSize:'clamp(32px,6vw,58px)',fontWeight:900,lineHeight:1.1,color:'var(--text)',margin:'0 auto 20px',maxWidth:700}}>
          Gérez votre équipe,<br/>
          <span style={{color:'var(--accent)'}}>simplement.</span>
        </h1>
        <p style={{fontSize:'clamp(14px,2vw,18px)',color:'var(--text2)',maxWidth:560,margin:'0 auto 36px',lineHeight:1.6}}>
          Planning, badgeage QR code, suivi des présences — tout en un. Pour les restaurants, hôtels, garages, et toute entreprise avec des équipes terrain.
        </p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>setShowLogin(true)} style={{padding:'14px 32px',borderRadius:12,border:'none',background:'var(--accent)',color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.3)'}}>
            Commencer gratuitement
          </button>
          <button onClick={()=>setShowLogin(true)} style={{padding:'14px 32px',borderRadius:12,border:'1.5px solid var(--border2)',background:'var(--surface)',color:'var(--text)',fontSize:16,fontWeight:600,cursor:'pointer'}}>
            Se connecter
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{padding:'60px 24px',maxWidth:1000,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:800,color:'var(--text)',marginBottom:10}}>Tout ce dont vous avez besoin</div>
          <div style={{fontSize:15,color:'var(--text2)'}}>Une solution complète pour gérer vos équipes au quotidien</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
          {[
            {icon:'📅',title:'Planning intelligent',desc:'Créez et publiez le planning de votre équipe en quelques clics. Shifts simples ou coupés, postes personnalisables.'},
            {icon:'📷',title:'Badgeage QR Code',desc:'Vos employés badgent en scannant le QR code affiché sur la tablette. Sécurisé et instantané.'},
            {icon:'👥',title:'Suivi des présences',desc:'Visualisez qui est présent en temps réel. Comparez les heures planifiées vs pointées avec calcul automatique.'},
            {icon:'📄',title:'Export PDF',desc:'Générez des rapports de présence détaillés pour la paie. Export par période, par employé.'},
            {icon:'📱',title:'Application mobile',desc:'Chaque employé a son espace personnel pour consulter son planning et pointer depuis son téléphone.'},
            {icon:'⚡',title:'Multi-établissements',desc:'Gérez plusieurs restaurants, hôtels ou agences depuis un seul tableau de bord.'},
          ].map((f,i)=>(
            <div key={i} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'24px 22px',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,113,227,.08)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
              <div style={{fontSize:28,marginBottom:12}}>{f.icon}</div>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:8}}>{f.title}</div>
              <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.5}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTEURS */}
      <section style={{padding:'60px 24px',background:'var(--surface)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:'clamp(20px,3vw,28px)',fontWeight:800,marginBottom:12}}>Pour tous les secteurs</div>
          <div style={{fontSize:14,color:'var(--text2)',marginBottom:36}}>PlanPro s'adapte à n'importe quelle entreprise avec des équipes terrain</div>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            {['🍽️ Restaurants','🏨 Hôtels','🔧 Garages','🏪 Commerce','🏥 Cliniques','🏗️ BTP','💆 Spas & Salons','📦 Logistique'].map(s=>(
              <span key={s} style={{padding:'8px 16px',borderRadius:20,background:'var(--bg)',border:'1px solid var(--border)',fontSize:13,fontWeight:600,color:'var(--text2)'}}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:'80px 24px',textAlign:'center'}}>
        <div style={{maxWidth:600,margin:'0 auto'}}>
          <div style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:800,marginBottom:16}}>Prêt à simplifier votre gestion ?</div>
          <div style={{fontSize:15,color:'var(--text2)',marginBottom:32}}>Rejoignez les entreprises qui font confiance à PlanPro pour gérer leurs équipes.</div>
          <button onClick={()=>setShowLogin(true)} style={{padding:'16px 40px',borderRadius:14,border:'none',background:'var(--accent)',color:'white',fontSize:17,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.3)'}}>
            Commencer maintenant →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:'20px 32px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:24,height:24,background:'var(--accent)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>⚡</div>
          <span style={{fontSize:13,fontWeight:700}}>PlanPro</span>
        </div>
        <div style={{fontSize:12,color:'var(--text3)'}}>© 2026 PlanPro • Gestion d'équipes simplifiée</div>
        <button onClick={()=>setShowLogin(true)} style={{fontSize:12,fontWeight:600,color:'var(--accent)',background:'transparent',border:'none',cursor:'pointer'}}>Connexion →</button>
      </footer>

      {loginModal}
    </div>
  )
}
