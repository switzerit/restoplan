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
      } else { setLoading(false) }
    })
  },[])

  async function handleLogin(e){
    e.preventDefault()
    setLoading(true); setError('')
    const {data,error} = await supabase.auth.signInWithPassword({email,password})
    if(error){setError('Email ou mot de passe incorrect');setLoading(false);return}
    const {data:profil} = await supabase.from('profils').select('role').eq('user_id',data.user.id).single()
    if(profil?.role==='super_admin') navigate('/admin')
    else if(profil?.role==='gerant') navigate('/gerant')
    else navigate('/moi')
    setLoading(false)
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0f',color:'#888',fontFamily:'var(--font)'}}>Chargement...</div>

  const NAV_H = 64
  const DARK = '#0a0a0f'
  const DARK2 = '#12121a'
  const BORDER = 'rgba(255,255,255,.08)'
  const ACCENT = '#6366f1'
  const ACCENT2 = '#8b5cf6'
  const TEXT = '#f0f0f5'
  const TEXT2 = 'rgba(240,240,245,.55)'
  const TEXT3 = 'rgba(240,240,245,.3)'

  return (
    <div style={{minHeight:'100vh',background:DARK,fontFamily:'var(--font)',color:TEXT,overflowX:'hidden'}}>

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:NAV_H,background:'rgba(10,10,15,.85)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',padding:'0 32px',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
          <div style={{width:32,height:32,background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>⚡</div>
          <span style={{fontSize:17,fontWeight:800,letterSpacing:'-.02em'}}>PlanPro</span>
          <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'rgba(99,102,241,.15)',color:ACCENT,border:'1px solid rgba(99,102,241,.25)',marginLeft:4}}>Beta</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setShowLogin(true)} style={{padding:'8px 18px',borderRadius:9,border:`1px solid ${BORDER}`,background:'rgba(255,255,255,.05)',color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Connexion</button>
          <button onClick={()=>setShowLogin(true)} style={{padding:'8px 18px',borderRadius:9,border:'none',background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 0 20px rgba(99,102,241,.3)'}}>Démo gratuite →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{paddingTop:NAV_H+80,paddingBottom:100,textAlign:'center',padding:`${NAV_H+80}px 24px 100px`,position:'relative',overflow:'hidden'}}>
        {/* Glow bg */}
        <div style={{position:'absolute',top:'20%',left:'50%',transform:'translateX(-50%)',width:600,height:400,background:`radial-gradient(ellipse,rgba(99,102,241,.15) 0%,transparent 70%)`,pointerEvents:'none'}}/>
        
        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:20,background:'rgba(99,102,241,.1)',border:'1px solid rgba(99,102,241,.25)',marginBottom:28}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:ACCENT,boxShadow:`0 0 8px ${ACCENT}`,display:'inline-block'}}></span>
            <span style={{fontSize:12,fontWeight:600,color:ACCENT}}>Badgeage • Planning • Présences en temps réel</span>
          </div>
          <h1 style={{fontSize:'clamp(36px,6vw,64px)',fontWeight:900,lineHeight:1.08,margin:'0 auto 24px',maxWidth:750,letterSpacing:'-.03em',background:`linear-gradient(135deg,${TEXT} 0%,rgba(240,240,245,.7) 100%)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Gérez vos équipes.<br/>Sans friction.
          </h1>
          <p style={{fontSize:'clamp(15px,2vw,18px)',color:TEXT2,maxWidth:520,margin:'0 auto 40px',lineHeight:1.7}}>
            PlanPro centralise le planning, le badgeage QR code et le suivi des présences pour toutes vos équipes terrain — restaurants, hôtels, commerces et plus.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:56}}>
            <button onClick={()=>setShowLogin(true)} style={{padding:'14px 32px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:`0 4px 24px rgba(99,102,241,.4)`,display:'flex',alignItems:'center',gap:8}}>
              Commencer gratuitement <span style={{fontSize:16}}>→</span>
            </button>
            <button onClick={()=>setShowLogin(true)} style={{padding:'14px 28px',borderRadius:12,border:`1px solid ${BORDER}`,background:'rgba(255,255,255,.04)',color:TEXT,fontSize:15,fontWeight:600,cursor:'pointer'}}>
              Se connecter
            </button>
          </div>
          {/* Social proof */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexWrap:'wrap'}}>
            {['✅ Sans engagement','⚡ Déploiement immédiat','📱 iOS & Android','🔒 Données sécurisées'].map(t=>(
              <span key={t} style={{fontSize:12,color:TEXT3,fontWeight:500}}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{padding:'80px 24px',maxWidth:1060,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <div style={{fontSize:12,fontWeight:700,color:ACCENT,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Fonctionnalités</div>
          <div style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:800,letterSpacing:'-.02em',marginBottom:12}}>Tout ce qu'il vous faut,<br/>rien de superflu</div>
          <div style={{fontSize:15,color:TEXT2,maxWidth:480,margin:'0 auto'}}>Une solution complète pensée pour les équipes terrain</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:2}}>
          {[
            {icon:'📅',title:'Planning intelligent',desc:'Créez des plannings en quelques clics. Shifts simples ou coupés, postes personnalisables, vue semaine ou jour.'},
            {icon:'📷',title:'Badgeage QR Code',desc:'Un QR code dynamique affiché sur la tablette. L\'employé scanne depuis son téléphone. Instantané et sécurisé.'},
            {icon:'👥',title:'Présences en temps réel',desc:'Visualisez qui est là maintenant. Comparez heures planifiées vs pointées avec calcul automatique de l\'écart.'},
            {icon:'📱',title:'App mobile employé',desc:'Chaque employé consulte son planning et badge depuis son espace personnel sur smartphone.'},
            {icon:'📄',title:'Rapports PDF',desc:'Exportez des rapports détaillés pour la paie. Par période, par employé, avec totaux d\'heures.'},
            {icon:'🏢',title:'Multi-établissements',desc:'Un gérant peut gérer plusieurs sites depuis un seul tableau de bord. Idéal pour les groupes.'},
          ].map((f,i)=>(
            <div key={i} style={{background:DARK2,border:`1px solid ${BORDER}`,padding:'28px 26px',transition:'all .2s',cursor:'default',borderRadius:i===0?'14px 0 0 0':i===1?'0':i===2?'0 14px 0 0':i===3?'0 0 0 14px':i===4?'0':i===5?'0 0 14px 0':'0'}}
            onMouseEnter={e=>{e.currentTarget.style.background='#16161f';e.currentTarget.style.borderColor='rgba(99,102,241,.3)'}}
            onMouseLeave={e=>{e.currentTarget.style.background=DARK2;e.currentTarget.style.borderColor=BORDER}}>
              <div style={{width:44,height:44,background:'rgba(99,102,241,.1)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:16}}>{f.icon}</div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:8,letterSpacing:'-.01em'}}>{f.title}</div>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTEURS */}
      <section style={{padding:'80px 24px',borderTop:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:12,fontWeight:700,color:ACCENT,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Secteurs</div>
          <div style={{fontSize:'clamp(22px,3.5vw,32px)',fontWeight:800,marginBottom:12,letterSpacing:'-.02em'}}>Adapté à tous les professionnels</div>
          <div style={{fontSize:14,color:TEXT2,marginBottom:40}}>PlanPro s'adapte à n'importe quel secteur avec des équipes terrain</div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            {[{e:'🍽️',l:'Restaurants'},{e:'🏨',l:'Hôtels'},{e:'🔧',l:'Garages'},{e:'🏪',l:'Commerce'},{e:'🏥',l:'Cliniques'},{e:'💆',l:'Spas & Salons'},{e:'🏗️',l:'BTP'},{e:'📦',l:'Logistique'},{e:'🎓',l:'Éducation'},{e:'🛡️',l:'Sécurité'}].map(s=>(
              <span key={s.l} style={{padding:'8px 16px',borderRadius:20,background:'rgba(255,255,255,.04)',border:`1px solid ${BORDER}`,fontSize:13,fontWeight:600,color:TEXT2,display:'flex',alignItems:'center',gap:6}}>{s.e} {s.l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'100px 24px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:500,height:300,background:`radial-gradient(ellipse,rgba(99,102,241,.12) 0%,transparent 70%)`,pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1,maxWidth:560,margin:'0 auto'}}>
          <div style={{fontSize:'clamp(26px,4vw,42px)',fontWeight:800,marginBottom:16,letterSpacing:'-.02em'}}>Prêt à simplifier<br/>votre gestion ?</div>
          <div style={{fontSize:15,color:TEXT2,marginBottom:36,lineHeight:1.6}}>Rejoignez les entreprises qui utilisent PlanPro pour gérer leurs équipes plus efficacement.</div>
          <button onClick={()=>setShowLogin(true)} style={{padding:'16px 40px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:`0 8px 32px rgba(99,102,241,.4)`}}>
            Commencer maintenant →
          </button>
          <div style={{fontSize:12,color:TEXT3,marginTop:16}}>Sans carte bancaire • Déploiement en 5 minutes</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${BORDER}`,padding:'40px 32px 32px'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:32,flexWrap:'wrap',marginBottom:40}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:32,height:32,background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>⚡</div>
                <span style={{fontSize:17,fontWeight:800}}>PlanPro</span>
              </div>
              <div style={{fontSize:13,color:TEXT2,maxWidth:240,lineHeight:1.6}}>Gestion d'équipes simplifiée pour tous les professionnels.</div>
              <div style={{fontSize:12,color:TEXT3,marginTop:8}}>Propulsé par <a href="https://switzerit.com" target="_blank" style={{color:ACCENT,textDecoration:'none',fontWeight:600}}>SwitzerIT</a></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:32,fontSize:13}}>
              <div>
                <div style={{fontWeight:700,marginBottom:12,color:TEXT}}>Produit</div>
                {['Fonctionnalités','Tarifs','Mises à jour','Roadmap'].map(l=><div key={l} style={{color:TEXT2,marginBottom:8,cursor:'pointer'}}>{l}</div>)}
              </div>
              <div>
                <div style={{fontWeight:700,marginBottom:12,color:TEXT}}>Support</div>
                {['Documentation','Contact','FAQ','Statut'].map(l=><div key={l} style={{color:TEXT2,marginBottom:8,cursor:'pointer'}}>{l}</div>)}
              </div>
              <div>
                <div style={{fontWeight:700,marginBottom:12,color:TEXT}}>Légal</div>
                {['Conditions d\'utilisation','Politique de confidentialité','RGPD','Cookies'].map(l=><div key={l} style={{color:TEXT2,marginBottom:8,cursor:'pointer'}}>{l}</div>)}
              </div>
            </div>
          </div>
          <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <div style={{fontSize:12,color:TEXT3}}>© 2026 PlanPro by SwitzerIT. Tous droits réservés.</div>
            <div style={{display:'flex',gap:16,fontSize:12,color:TEXT3}}>
              <span style={{cursor:'pointer'}}>Confidentialité</span>
              <span style={{cursor:'pointer'}}>CGU</span>
              <span style={{cursor:'pointer'}}>RGPD</span>
            </div>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {showLogin&&(
        <div onClick={()=>setShowLogin(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#16161f',border:`1px solid ${BORDER}`,borderRadius:20,padding:32,width:'100%',maxWidth:380,boxShadow:'0 24px 64px rgba(0,0,0,.5)'}}>
            <div style={{textAlign:'center',marginBottom:28}}>
              <div style={{width:48,height:48,background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,margin:'0 auto 16px'}}>⚡</div>
              <div style={{fontSize:20,fontWeight:800,color:TEXT}}>Connexion</div>
              <div style={{fontSize:13,color:TEXT2,marginTop:6}}>Accédez à votre espace PlanPro</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:TEXT2,marginBottom:6,letterSpacing:'.04em'}}>EMAIL</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required
                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1.5px solid rgba(255,255,255,.1)`,background:'rgba(255,255,255,.05)',fontSize:14,color:TEXT,outline:'none',transition:'border-color .15s'}}
                onFocus={e=>e.target.style.borderColor=ACCENT}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:TEXT2,marginBottom:6,letterSpacing:'.04em'}}>MOT DE PASSE</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1.5px solid rgba(255,255,255,.1)`,background:'rgba(255,255,255,.05)',fontSize:14,color:TEXT,outline:'none',transition:'border-color .15s'}}
                onFocus={e=>e.target.style.borderColor=ACCENT}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}/>
              </div>
              {error&&<div style={{padding:'10px 14px',background:'rgba(255,59,48,.1)',border:'1px solid rgba(255,59,48,.2)',borderRadius:10,fontSize:13,color:'#ff6b6b',marginBottom:16,fontWeight:600}}>{error}</div>}
              <button type="submit" style={{width:'100%',height:48,borderRadius:12,border:'none',background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:`0 4px 20px rgba(99,102,241,.4)`}}>
                Se connecter
              </button>
            </form>
            <div style={{textAlign:'center',marginTop:16}}>
              <span style={{fontSize:12,color:TEXT3}}>Pas encore client ? </span>
              <span style={{fontSize:12,color:ACCENT,fontWeight:600,cursor:'pointer'}} onClick={()=>setShowLogin(false)}>Contactez-nous</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
