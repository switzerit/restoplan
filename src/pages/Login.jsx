import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

const LOGO = <svg width="28" height="20" viewBox="0 0 32 22" fill="none"><rect x="0" y="4" width="6" height="18" rx="3" fill="#0071e3"/><rect x="8.5" y="0" width="6" height="22" rx="3" fill="#0071e3"/><rect x="17" y="6" width="6" height="14" rx="3" fill="#0071e3" fillOpacity="0.4"/><rect x="25.5" y="3" width="6" height="10" rx="3" fill="#0071e3" fillOpacity="0.18"/></svg>
const LOGO_SM = <svg width="22" height="16" viewBox="0 0 32 22" fill="none"><rect x="0" y="4" width="6" height="18" rx="3" fill="#0071e3"/><rect x="8.5" y="0" width="6" height="22" rx="3" fill="#0071e3"/><rect x="17" y="6" width="6" height="14" rx="3" fill="#0071e3" fillOpacity="0.4"/><rect x="25.5" y="3" width="6" height="10" rx="3" fill="#0071e3" fillOpacity="0.18"/></svg>

// QR Code décoratif animé (faux QR qui change toutes les 30s)
function QRDisplay() {
  const [seed, setSeed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fade, setFade] = useState(false)
  useEffect(()=>{
    let p = 0
    const iv = setInterval(()=>{
      p += 100/300
      if(p >= 100){
        setFade(true)
        setTimeout(()=>{
          setSeed(s=>s+1)
          setProgress(0)
          setFade(false)
          p = 0
        }, 400)
      } else {
        setProgress(p)
      }
    }, 100)
    return ()=>clearInterval(iv)
  },[])

  // Génère une grille QR pseudo-aléatoire basée sur seed
  const rng = (x,y,s) => ((x*7+y*13+s*31)%17 > 7)
  const size = 11
  const cells = []
  for(let r=0;r<size;r++) for(let c=0;c<size;c++) cells.push({r,c,v:rng(r,c,seed)})

  // Zones fixes (coins QR)
  const isCorner = (r,c)=>{
    if(r<3&&c<3) return true
    if(r<3&&c>=size-3) return true
    if(r>=size-3&&c<3) return true
    return false
  }
  const isCornerInner = (r,c)=>{
    if(r>=1&&r<=1&&c>=1&&c<=1) return true
    if(r>=1&&r<=1&&c>=size-2&&c<=size-2) return true
    if(r>=size-2&&r<=size-2&&c>=1&&c<=1) return true
    return false
  }

  const cellSize = 6
  const total = size * cellSize + (size-1)

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
      <div style={{
        background:'white',
        borderRadius:12,
        padding:12,
        border:'1px solid #e5e5ea',
        opacity: fade ? 0.3 : 1,
        transition: fade ? 'opacity .3s' : 'none',
        boxShadow:'0 2px 12px rgba(0,0,0,.06)'
      }}>
        <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`}>
          {cells.map(({r,c,v})=>{
            const x = c*(cellSize+1)
            const y = r*(cellSize+1)
            let fill = '#1d1d1f'
            if(isCorner(r,c)) fill = (r===0||r===2||c===0||c===2) ? '#1d1d1f' : 'white'
            else if(!v) fill = 'white'
            else fill = '#1d1d1f'
            if(isCornerInner(r,c)) fill = '#1d1d1f'
            return <rect key={`${r}-${c}`} x={x} y={y} width={cellSize} height={cellSize} rx={1} fill={fill}/>
          })}
        </svg>
      </div>
      <div style={{width:120,display:'flex',flexDirection:'column',gap:4}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:11,fontWeight:600,color:'#6e6e73'}}>Se renouvelle dans</span>
          <span style={{fontSize:11,fontWeight:700,color:'#0071e3'}}>{Math.ceil(30-(progress*30/100))}s</span>
        </div>
        <div style={{height:3,background:'#e5e5ea',borderRadius:2}}>
          <div style={{height:'100%',background:'#0071e3',borderRadius:2,width:`${progress}%`,transition:'width .1s linear'}}/>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [legalSection, setLegalSection] = useState('cgu')
  const [contactForm, setContactForm] = useState({nom:'',email:'',entreprise:'',secteur:'',message:''})
  const [contactSent, setContactSent] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768)
    window.addEventListener('resize',h)
    return()=>window.removeEventListener('resize',h)
  },[])

  useEffect(()=>{
    supabase.auth.getSession().then(async({data})=>{
      if(data.session){
        const {data:profil} = await supabase.from('profils').select('role').eq('user_id',data.session.user.id).single()
        if(profil?.role==='super_admin') navigate('/admin')
        else if(profil?.role==='gerant') navigate('/gerant')
        else navigate('/moi')
      } else { setLoading(false); if(location.pathname==='/login') setShowLogin(true) }
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

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#fff',color:'#888',fontFamily:'var(--font)'}}>Chargement...</div>

  const A='#0071e3', BG='#f5f5f7', SURF='#ffffff', BORDER='#e5e5ea'
  const TEXT='#1d1d1f', TEXT2='#6e6e73', TEXT3='#aeaeb2', GREEN='#34c759'

  const scrollTop=()=>window.scrollTo({top:0,behavior:'smooth'})
  const pageMap={'home':'/','fonctionnalites':'/fonctionnalites','tarifs':'/tarifs','contact':'/contact','legal':'/legal'}
  const goPage=(p)=>{navigate(pageMap[p]||'/'+p);scrollTop();setMenuOpen(false)}
  const path=location.pathname.replace('/','') || 'home'
  const page=path==='login'?'home':path||'home'
  const inp={width:'100%',padding:'12px 14px',borderRadius:10,border:`1.5px solid ${BORDER}`,background:BG,fontSize:15,color:TEXT,outline:'none',boxSizing:'border-box'}

  const Nav=()=>(
    <>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:56,background:'rgba(255,255,255,.95)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',padding:'0 24px',gap:8}}>
        <div onClick={()=>goPage('home')} style={{display:'flex',alignItems:'center',gap:8,flex:1,cursor:'pointer'}}>
          {LOGO_SM}
          <span style={{fontSize:17,fontWeight:800,color:TEXT,letterSpacing:'-.03em'}}>Kronvo</span>
          <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'#e8f2fd',color:A}}>Beta</span>
        </div>
        {isMobile ? (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={()=>setShowLogin(true)} style={{padding:'8px 16px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Connexion</button>
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{width:38,height:38,borderRadius:9,border:`1px solid ${BORDER}`,background:SURF,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}>
              <span style={{width:18,height:2,background:TEXT,borderRadius:2,display:'block'}}></span>
              <span style={{width:18,height:2,background:TEXT,borderRadius:2,display:'block'}}></span>
              {!menuOpen&&<span style={{width:18,height:2,background:TEXT,borderRadius:2,display:'block'}}></span>}
            </button>
          </div>
        ) : (
          <div style={{display:'flex',gap:2,alignItems:'center'}}>
            {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([label,id])=>(
              <button key={id} onClick={()=>goPage(id)} style={{padding:'6px 12px',borderRadius:8,border:'none',background:page===id?'#e8f2fd':'transparent',color:page===id?A:TEXT2,fontSize:13,fontWeight:600,cursor:'pointer'}}>{label}</button>
            ))}
            <div style={{width:1,height:20,background:BORDER,margin:'0 8px'}}/>
            <button onClick={()=>setShowLogin(true)} style={{padding:'7px 14px',borderRadius:9,border:`1px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Connexion</button>
            <button onClick={()=>goPage('contact')} style={{padding:'7px 14px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Demander une démo</button>
          </div>
        )}
      </nav>
      {isMobile&&menuOpen&&(
        <div style={{position:'fixed',top:56,left:0,right:0,zIndex:99,background:SURF,borderBottom:`1px solid ${BORDER}`,boxShadow:'0 8px 24px rgba(0,0,0,.08)',padding:'8px 0 16px'}}>
          {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([label,id])=>(
            <button key={id} onClick={()=>goPage(id)} style={{width:'100%',padding:'14px 24px',border:'none',background:page===id?'#e8f2fd':'transparent',color:page===id?A:TEXT,fontSize:15,fontWeight:page===id?700:500,cursor:'pointer',textAlign:'left',display:'block'}}>{label}</button>
          ))}
          <div style={{borderTop:`1px solid ${BORDER}`,margin:'8px 16px 0',paddingTop:12}}>
            <button onClick={()=>{goPage('contact');setMenuOpen(false)}} style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
          </div>
        </div>
      )}
    </>
  )

  const Footer=()=>(
    <footer style={{background:TEXT,color:'white',padding:isMobile?'36px 20px 28px':'44px 32px 28px'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr 1fr 1fr',gap:isMobile?24:40,marginBottom:28}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              {LOGO_SM}
              <span style={{fontSize:16,fontWeight:800}}>Kronvo</span>
            </div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.7,maxWidth:240}}>La solution de gestion d'équipes pour tous les professionnels.</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.3)',marginTop:10}}>Propulsé par <a href="https://switzerit.com" target="_blank" rel="noreferrer" style={{color:'rgba(255,255,255,.5)',textDecoration:'none',fontWeight:600}}>SwitzerIT</a></div>
          </div>
          {isMobile ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
              {[
                {title:'Produit',links:[['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']]},
                {title:'Support',links:[['Contact','contact'],['Démo Teams','contact']]},
                {title:'Légal',links:[['CGU','legal'],['Confidentialité','legal'],['RGPD','legal']]},
              ].map(col=>(
                <div key={col.title}>
                  <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>{col.title}</div>
                  {col.links.map(([l,p])=><div key={l} onClick={()=>goPage(p)} style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:8,cursor:'pointer'}}>{l}</div>)}
                </div>
              ))}
            </div>
          ) : (
            [
              {title:'Produit',links:[['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']]},
              {title:'Support',links:[['Contact','contact'],['Démo Teams','contact']]},
              {title:'Légal',links:[['CGU','legal'],['Confidentialité','legal'],['RGPD','legal'],['Cookies','legal']]},
            ].map(col=>(
              <div key={col.title}>
                <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.4)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:14}}>{col.title}</div>
                {col.links.map(([l,p])=><div key={l} onClick={()=>goPage(p)} style={{fontSize:13,color:'rgba(255,255,255,.5)',marginBottom:9,cursor:'pointer'}}>{l}</div>)}
              </div>
            ))
          )}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:20,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>© 2026 Kronvo by SwitzerIT · Suisse</div>
          <div style={{display:'flex',gap:14,fontSize:11}}>
            {[['Confidentialité','legal'],['CGU','legal'],['RGPD','legal'],['Cookies','legal']].map(([l,p])=>(
              <span key={l} onClick={()=>goPage(p)} style={{color:'rgba(255,255,255,.3)',cursor:'pointer'}}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )

  const PageHome=()=>(
    <>
      {/* HERO 2 colonnes */}
      <section style={{paddingTop:56,background:SURF,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:isMobile?'40px 20px':'56px 40px',display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center'}}>
          {/* Gauche */}
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 12px',borderRadius:20,background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',marginBottom:22}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:GREEN,display:'inline-block'}}></span>
              <span style={{fontSize:12,fontWeight:600,color:A}}>Badgeage QR · Planning · Présences</span>
            </div>
            <h1 style={{fontSize:isMobile?'36px':'50px',fontWeight:900,lineHeight:1.08,margin:'0 0 18px',letterSpacing:'-.04em',color:TEXT}}>
              La gestion<br/>d'équipes,<br/><span style={{color:A}}>simplifiée.</span>
            </h1>
            <p style={{fontSize:16,color:TEXT2,lineHeight:1.7,marginBottom:28,maxWidth:400}}>
              Kronvo centralise le planning, le badgeage QR et le suivi des présences pour toutes vos équipes terrain.
            </p>
            <div style={{display:'flex',gap:10,flexDirection:isMobile?'column':'row',marginBottom:24}}>
              <button onClick={()=>goPage('contact')} style={{padding:'14px 26px',borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.25)'}}>Demander une démo →</button>
              <button onClick={()=>goPage('fonctionnalites')} style={{padding:'14px 22px',borderRadius:12,border:`1.5px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:15,fontWeight:600,cursor:'pointer'}}>Voir les fonctionnalités</button>
            </div>
            <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
              {['✓ Sans engagement','✓ Déploiement 5 min','✓ Accompagnement inclus'].map(t=>(
                <span key={t} style={{fontSize:12,color:TEXT3,fontWeight:500}}>{t}</span>
              ))}
            </div>
          </div>

          {/* Droite — Dashboard mockup */}
          {!isMobile && (
            <div style={{background:BG,borderRadius:20,padding:20,border:`1px solid ${BORDER}`}}>
              {/* Présences */}
              <div style={{background:SURF,borderRadius:14,padding:16,marginBottom:12,border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:11,fontWeight:700,color:TEXT3,letterSpacing:'.06em',textTransform:'uppercase',marginBottom:12}}>Présences aujourd'hui</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                  <div style={{background:'#f0faf3',borderRadius:10,padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:800,color:'#1a6b35'}}>8</div>
                    <div style={{fontSize:11,color:'#1a6b35',fontWeight:600}}>Présents</div>
                  </div>
                  <div style={{background:'#fff2f1',borderRadius:10,padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:800,color:'#b02020'}}>3</div>
                    <div style={{fontSize:11,color:'#b02020',fontWeight:600}}>Absents</div>
                  </div>
                  <div style={{background:'#e8f2fd',borderRadius:10,padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:800,color:A}}>2</div>
                    <div style={{fontSize:11,color:A,fontWeight:600}}>En pause</div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {[{n:'Sophie Martin',p:'Cuisine',h:'09:02',s:GREEN},{n:'Marc Dupont',p:'Salle',h:'09:15',s:GREEN},{n:'Julie Bernard',p:'Bar',h:'pause',s:'#ff9500'}].map((e,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:BG,borderRadius:8}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:e.s,flexShrink:0}}></div>
                      <span style={{fontSize:12,fontWeight:600,flex:1,color:TEXT}}>{e.n}</span>
                      <span style={{fontSize:11,color:TEXT2}}>{e.p} · {e.h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              <div style={{background:SURF,borderRadius:14,padding:16,border:`1px solid ${BORDER}`,display:'flex',alignItems:'center',gap:16}}>
                <QRDisplay/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:4}}>QR Code actif</div>
                  <div style={{fontSize:12,color:TEXT2,lineHeight:1.5}}>Changement toutes les 30s.<br/>Sécurisé par établissement.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STATS bande sombre */}
      <section style={{background:TEXT,padding:'28px 24px'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
          {[{v:'< 5 min',l:'déploiement'},{v:'100%',l:'mobile-first'},{v:'24/7',l:'disponibilité'},{v:'CHF',l:'tarification locale'}].map((s,i)=>(
            <div key={i} style={{textAlign:'center',borderRight:i<3?'1px solid rgba(255,255,255,.08)':'none',padding:'0 16px'}}>
              <div style={{fontSize:isMobile?20:26,fontWeight:900,color:i===0?A:'white',letterSpacing:'-.03em'}}>{s.v}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES 3 colonnes */}
      <section style={{padding:isMobile?'40px 20px':'56px 48px',background:BG}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:40}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Fonctionnalités</div>
            <div style={{fontSize:isMobile?26:34,fontWeight:800,color:TEXT,marginBottom:8,letterSpacing:'-.03em'}}>Tout ce dont vous avez besoin</div>
            <div style={{fontSize:14,color:TEXT2}}>Une solution complète, sans complexité inutile</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':isMobile?'1fr 1fr':'repeat(3,1fr)',gap:14}}>
            {[
              {icon:'📅',color:'#e8f2fd',title:'Planning intelligent',desc:'Shifts simples ou coupés, vue semaine, postes personnalisables selon le secteur.'},
              {icon:'📷',color:'#f0faf3',title:'Badgeage QR Code',desc:'QR dynamique toutes les 30s. Scan depuis le téléphone. Sécurisé par établissement.'},
              {icon:'👥',color:'#fff8ee',title:'Présences en direct',desc:'Heures prévues vs pointées, écarts calculés automatiquement en temps réel.'},
              {icon:'📱',color:'#f0f0fc',title:'App mobile employé',desc:'Planning perso, badgeage mobile. Installable sur iPhone et Android.'},
              {icon:'📄',color:'#fff2f1',title:'Rapports PDF',desc:'Export PDF pour la paie, par période et par employé, avec totaux heures inclus.'},
              {icon:'🏢',color:'#fdf0f8',title:'Multi-établissements',desc:'Gérez plusieurs sites depuis un seul tableau de bord gérant.'},
            ].map((f,i)=>(
              <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'22px 20px',transition:'border-color .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=A}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER}}>
                <div style={{width:46,height:46,background:f.color,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14}}>{f.icon}</div>
                <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:7}}>{f.title}</div>
                <div style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:28}}>
            <button onClick={()=>goPage('fonctionnalites')} style={{padding:'11px 22px',borderRadius:10,border:`1px solid ${BORDER}`,background:SURF,color:A,fontSize:13,fontWeight:700,cursor:'pointer'}}>Voir toutes les fonctionnalités →</button>
          </div>
        </div>
      </section>

      {/* SECTEURS */}
      <section style={{padding:isMobile?'32px 20px':'40px 40px',background:SURF,borderTop:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Secteurs</div>
          <div style={{fontSize:isMobile?22:28,fontWeight:800,color:TEXT,marginBottom:6,letterSpacing:'-.03em'}}>Pour tous les professionnels</div>
          <div style={{fontSize:13,color:TEXT2,marginBottom:22}}>Kronvo s'adapte à n'importe quel secteur avec des équipes terrain</div>
          <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
            {['🍽️ Restaurants','🏨 Hôtels','🔧 Garages','🏪 Commerce','🏥 Cliniques','💆 Spas','🏗️ BTP','📦 Logistique','🎓 Éducation','🛡️ Sécurité'].map(s=>(
              <span key={s} style={{padding:'7px 14px',borderRadius:20,background:BG,border:`1px solid ${BORDER}`,fontSize:12,fontWeight:600,color:TEXT2}}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section style={{padding:isMobile?'40px 20px':'56px 48px',background:BG}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:36}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Mise en place</div>
            <div style={{fontSize:isMobile?22:32,fontWeight:800,color:TEXT,letterSpacing:'-.03em'}}>Opérationnel en 5 minutes</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:12}}>
            {[
              {n:'1',title:'Contactez-nous',desc:'Démo Teams gratuite pour présenter la solution.'},
              {n:'2',title:'On installe ensemble',desc:'Notre équipe configure tout pour vous.'},
              {n:'3',title:'Formation incluse',desc:'Gérants et employés formés en 30 min.'},
              {n:'4',title:"C'est parti !",desc:'Scannez le QR code. Suivez en direct.'},
            ].map((s,i)=>(
              <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'18px 16px'}}>
                <div style={{width:32,height:32,borderRadius:9,background:'#e8f2fd',color:A,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,marginBottom:12}}>{s.n}</div>
                <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:12,color:TEXT2,lineHeight:1.5}}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL fond bleu */}
      <section style={{padding:isMobile?'48px 20px':'56px 40px',background:A}}>
        <div style={{maxWidth:560,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:isMobile?26:36,fontWeight:800,color:'white',marginBottom:14,letterSpacing:'-.03em'}}>Prêt à moderniser votre gestion ?</div>
          <div style={{fontSize:15,color:'rgba(255,255,255,.75)',marginBottom:28,lineHeight:1.6}}>Réservez une démo Teams gratuite. Notre équipe vous présente Kronvo en 30 minutes.</div>
          <button onClick={()=>goPage('contact')} style={{padding:'15px 32px',borderRadius:12,border:'none',background:'white',color:A,fontSize:16,fontWeight:700,cursor:'pointer',width:isMobile?'100%':'auto'}}>
            Réserver ma démo →
          </button>
          <div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginTop:12}}>Démo gratuite · Sans engagement · Réponse sous 24h</div>
        </div>
      </section>
    </>
  )

  const PageFeatures=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:960,margin:'0 auto',padding:isMobile?'32px 20px':'56px 24px'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Fonctionnalités</div>
          <h1 style={{fontSize:isMobile?28:46,fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:12}}>Tout ce que Kronvo peut faire</h1>
          <p style={{fontSize:15,color:TEXT2,maxWidth:540,margin:'0 auto'}}>Une solution pensée pour les équipes terrain.</p>
        </div>
        {[
          {icon:'📅',title:'Planning intelligent',color:'#e8f2fd',ic:A,items:['Shifts simples (9h-17h) ou coupés (10h-15h puis 18h-22h)','Vue semaine sur desktop, jour par jour sur mobile','Postes personnalisables selon le secteur','Publication du planning en un clic','Modification rapide par clic']},
          {icon:'📷',title:'Badgeage QR Code sécurisé',color:'#f0faf3',ic:'#1a6b35',items:['QR code dynamique toutes les 30 secondes','Scan depuis le smartphone','Vérification de l\'établissement','Badgeage multiple dans la journée','Borne tablette avec PIN sécurisé']},
          {icon:'👥',title:'Suivi des présences',color:'#fff8ee',ic:'#8a4a00',items:['Temps réel — qui est présent maintenant','Heures planifiées vs pointées','Calcul automatique des écarts','Historique complet par date','Correction manuelle par le gérant']},
          {icon:'📄',title:'Rapports et export PDF',color:'#fff2f1',ic:'#b02020',items:['Rapports PDF professionnels','Filtrage par période','Détail par employé','Total des heures et écarts','Export en un clic']},
          {icon:'📱',title:'Espace employé mobile',color:'#f0f0fc',ic:'#3a3880',items:['Installable sur iPhone et Android','Planning personnel','Bouton scan QR intégré','Historique des pointages','Fonctionne hors connexion']},
          {icon:'🏢',title:'Multi-établissements',color:'#fdf0f8',ic:'#8a2060',items:['Plusieurs sites, un tableau de bord','Données isolées par établissement','Dashboard super admin','Ajout de sites en quelques clics']},
        ].map((f,i)=>(
          <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:isMobile?'20px':'28px',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:48,height:48,background:f.color,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{f.icon}</div>
              <div style={{fontSize:isMobile?17:20,fontWeight:800,color:TEXT}}>{f.title}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(220px,1fr))',gap:8}}>
              {f.items.map((item,j)=>(
                <div key={j} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'9px 12px',background:f.color,borderRadius:9}}>
                  <span style={{color:f.ic,fontWeight:700,flexShrink:0}}>✓</span>
                  <span style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:`linear-gradient(135deg,#e8f2fd,#f0f0fc)`,borderRadius:16,padding:'28px 20px',textAlign:'center',marginTop:8}}>
          <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:10}}>Fonctionnalités à venir</div>
          <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:18}}>
            {['📧 Notifications email','📊 Analytics','🔗 Intégration paie','💬 Messagerie équipe','🌍 Multi-langue'].map(f=>(
              <span key={f} style={{padding:'6px 12px',borderRadius:20,background:'rgba(0,113,227,.08)',border:'1px solid rgba(0,113,227,.15)',fontSize:12,fontWeight:600,color:A}}>{f}</span>
            ))}
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'12px 24px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
        </div>
      </div>
    </div>
  )

  const PagePricing=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:900,margin:'0 auto',padding:isMobile?'32px 20px':'56px 24px'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Tarifs</div>
          <h1 style={{fontSize:isMobile?28:46,fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:12}}>Tarification sur mesure</h1>
          <p style={{fontSize:15,color:TEXT2,maxWidth:520,margin:'0 auto',lineHeight:1.6}}>Chaque entreprise est unique. Devis personnalisé selon vos besoins. Démo gratuite via Teams incluse.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:14,marginBottom:24}}>
          {[
            {name:'Mise en place',icon:'🚀',color:'#e8f2fd',ic:A,desc:'Installation et configuration complète par SwitzerIT.',items:['Création du compte','Paramétrage des établissements','Import des employés','Installation borne tablette','Formation gérant (1h)','Documentation fournie'],tag:'Sur devis'},
            {name:'Abonnement mensuel',icon:'📅',color:'#f0faf3',ic:'#1a6b35',desc:'Accès complet à Kronvo pour votre établissement.',items:['Planning & badgeage illimités','Tous les employés inclus','Rapports PDF','Support email','Mises à jour incluses','Hébergement sécurisé Suisse'],tag:'Sur devis · en CHF'},
            {name:'Support & maintenance',icon:'🛡️',color:'#fff8ee',ic:'#8a4a00',desc:"Accompagnement continu pour votre tranquillité.",items:['Support prioritaire','Intervention sous 4h','Formations supplémentaires','Évolutions personnalisées','Suivi trimestriel','SLA garanti'],tag:'Options disponibles'},
          ].map((plan,i)=>(
            <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'24px',display:'flex',flexDirection:'column'}}>
              <div style={{width:48,height:48,background:plan.color,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:12}}>{plan.icon}</div>
              <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:5}}>{plan.name}</div>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.5,marginBottom:14}}>{plan.desc}</div>
              <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:16,flex:1}}>
                {plan.items.map(f=>(
                  <div key={f} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:TEXT2}}>
                    <span style={{color:plan.ic,fontWeight:700,flexShrink:0}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <div style={{padding:'9px 14px',background:plan.color,borderRadius:9,fontSize:13,fontWeight:700,color:plan.ic,textAlign:'center',marginBottom:12}}>{plan.tag}</div>
              <button onClick={()=>goPage('contact')} style={{width:'100%',height:42,borderRadius:10,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Demander un devis</button>
            </div>
          ))}
        </div>
        <div style={{background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',borderRadius:14,padding:'20px',display:'flex',alignItems:isMobile?'flex-start':'center',gap:14,flexDirection:isMobile?'column':'row'}}>
          <div style={{fontSize:32,flexShrink:0}}>📹</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:4}}>Démo gratuite via Teams</div>
            <div style={{fontSize:13,color:TEXT2}}>30 minutes pour voir Kronvo en action. Repartez avec un devis personnalisé.</div>
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'12px 20px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',flexShrink:0,width:isMobile?'100%':'auto'}}>Réserver ma démo →</button>
        </div>
      </div>
    </div>
  )

  const PageContact=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:800,margin:'0 auto',padding:isMobile?'32px 20px':'56px 24px'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Contact</div>
          <h1 style={{fontSize:isMobile?28:44,fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:12}}>Parlons de votre projet</h1>
          <p style={{fontSize:15,color:TEXT2,maxWidth:480,margin:'0 auto'}}>Remplissez le formulaire, nous vous recontacterons sous 24h pour une démo Teams gratuite.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:20}}>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'24px'}}>
            {contactSent?(
              <div style={{textAlign:'center',padding:'32px 16px'}}>
                <div style={{fontSize:48,marginBottom:14}}>✅</div>
                <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:8}}>Demande envoyée !</div>
                <div style={{fontSize:14,color:TEXT2,lineHeight:1.6}}>Notre équipe vous contactera sous 24h pour organiser la démo Teams.</div>
                <button onClick={()=>{setContactSent(false);setContactForm({nom:'',email:'',entreprise:'',secteur:'',message:''})}} style={{marginTop:18,padding:'10px 20px',borderRadius:9,border:`1px solid ${BORDER}`,background:BG,color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Nouvelle demande</button>
              </div>
            ):(
              <>
                <div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:4}}>Demander une démo Teams</div>
                <div style={{fontSize:12,color:TEXT2,marginBottom:18}}>Démo gratuite · 30 minutes · Sans engagement</div>
                {[{f:'nom',l:'Nom complet *',ph:'Jean Dupont',t:'text'},{f:'email',l:'Email *',ph:'jean@exemple.fr',t:'email'},{f:'entreprise',l:"Établissement *",ph:'Mon Établissement',t:'text'}].map(({f,l,ph,t})=>(
                  <div key={f} style={{marginBottom:12}}>
                    <label style={{display:'block',fontSize:12,fontWeight:700,color:TEXT2,marginBottom:5}}>{l}</label>
                    <input type={t} placeholder={ph} value={contactForm[f]} onChange={e=>setContactForm(ff=>({...ff,[f]:e.target.value}))} style={inp}
                    onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                  </div>
                ))}
                <div style={{marginBottom:12}}>
                  <label style={{display:'block',fontSize:12,fontWeight:700,color:TEXT2,marginBottom:5}}>Secteur</label>
                  <select value={contactForm.secteur} onChange={e=>setContactForm(f=>({...f,secteur:e.target.value}))} style={{...inp,appearance:'auto'}}>
                    <option value="">Sélectionner...</option>
                    {['Restaurant','Hôtel','Garage','Commerce','Clinique','Spa & Salon','BTP','Logistique','Éducation','Autre'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={{display:'block',fontSize:12,fontWeight:700,color:TEXT2,marginBottom:5}}>Message (optionnel)</label>
                  <textarea placeholder="Décrivez votre besoin..." value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} rows={3}
                  style={{...inp,resize:'vertical',fontFamily:'var(--font)'}}
                  onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                </div>
                <button onClick={()=>{if(!contactForm.nom||!contactForm.email||!contactForm.entreprise){alert('Remplis les champs obligatoires');return}setContactSent(true)}}
                style={{width:'100%',height:50,borderRadius:12,border:'none',background:A,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,113,227,.2)'}}>
                  Envoyer la demande →
                </button>
                <div style={{fontSize:11,color:TEXT3,textAlign:'center',marginTop:8}}>Réponse sous 24h · Démo Teams offerte</div>
              </>
            )}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[{icon:'📹',title:'Démo Teams offerte',desc:'30 minutes pour voir Kronvo adapté à votre secteur.'},
              {icon:'🚀',title:'Mise en place par SwitzerIT',desc:"Notre équipe s'occupe de tout."},
              {icon:'🇨🇭',title:'Facturation en CHF',desc:'Tarification locale, sans surprise.'},
            ].map((info,i)=>(
              <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:13,padding:'16px',display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{width:40,height:40,background:'#e8f2fd',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{info.icon}</div>
                <div><div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:3}}>{info.title}</div><div style={{fontSize:13,color:TEXT2,lineHeight:1.4}}>{info.desc}</div></div>
              </div>
            ))}
            <div style={{background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',borderRadius:13,padding:'16px'}}>
              <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:5}}>Déjà client ?</div>
              <div style={{fontSize:12,color:TEXT2,marginBottom:10}}>Connectez-vous à votre espace gérant.</div>
              <button onClick={()=>setShowLogin(true)} style={{padding:'9px 18px',borderRadius:8,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Se connecter →</button>
            </div>
            <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:13,padding:'16px'}}>
              <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:8}}>Contact direct</div>
              <div style={{fontSize:13,color:TEXT2,marginBottom:5}}>📧 contact@switzerit.com</div>
              <div style={{fontSize:13,color:TEXT2,marginBottom:5}}>🌐 switzerit.com</div>
              <div style={{fontSize:13,color:TEXT2}}>🇨🇭 Basé en Suisse</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const PageLegal=()=>{
    const sections={
      cgu:{title:"Conditions Générales d'Utilisation",last:"11 mai 2026",content:[
        {h:"1. Objet",t:"Les présentes CGU régissent l'accès et l'utilisation de la plateforme Kronvo, éditée par SwitzerIT, basée en Suisse."},
        {h:"2. Description du service",t:"Kronvo est une solution SaaS de gestion d'équipes permettant la création de plannings, le badgeage par QR code, le suivi des présences et l'export de rapports."},
        {h:"3. Accès au service",t:"L'accès est réservé aux professionnels. Chaque compte est associé à un établissement, géré par un gérant désigné."},
        {h:"4. Obligations de l'utilisateur",t:"L'utilisateur s'engage à fournir des informations exactes, maintenir la confidentialité de ses identifiants, utiliser le service conformément à sa destination."},
        {h:"5. Responsabilité",t:"SwitzerIT s'engage à assurer la disponibilité du service. Sa responsabilité est limitée au montant des sommes versées au cours des 12 derniers mois."},
        {h:"6. Propriété intellectuelle",t:"L'ensemble des éléments de Kronvo est la propriété exclusive de SwitzerIT. Toute reproduction non autorisée est interdite."},
        {h:"7. Résiliation",t:"Chaque partie peut résilier avec un préavis de 30 jours."},
        {h:"8. Droit applicable",t:"Les CGU sont soumises au droit suisse. Les tribunaux du canton de Vaud sont seuls compétents."},
      ]},
      confidentialite:{title:"Politique de Confidentialité",last:"11 mai 2026",content:[
        {h:"1. Responsable",t:"SwitzerIT, basé en Suisse. Contact : contact@switzerit.com"},
        {h:"2. Données collectées",t:"Données d'identification (nom, prénom, email), données professionnelles (établissement, poste), données de pointage."},
        {h:"3. Finalités",t:"Gestion des comptes, fonctionnement du service de planning et badgeage, génération de rapports."},
        {h:"4. Base légale",t:"Exécution du contrat (accès au service), intérêt légitime (amélioration du service)."},
        {h:"5. Conservation",t:"Durée du contrat + 3 ans pour la facturation. Données de pointage conservées 5 ans."},
        {h:"6. Partage",t:"Les données ne sont jamais vendues. Partagées uniquement avec nos sous-traitants (Supabase, Vercel) avec garanties contractuelles."},
        {h:"7. Vos droits",t:"Conformément à la LPD suisse et au RGPD, vous disposez des droits d'accès, rectification, effacement, portabilité. Contact : contact@switzerit.com"},
        {h:"8. Sécurité",t:"Données chiffrées en transit (HTTPS/TLS) et au repos. Authentification sécurisée."},
      ]},
      rgpd:{title:"Conformité RGPD",last:"11 mai 2026",content:[
        {h:"Engagement",t:"Kronvo respecte le RGPD (UE 2016/679) pour les utilisateurs UE, ainsi que la nLPD suisse."},
        {h:"Données traitées",t:"Noms et prénoms des employés, emails professionnels, données de badgeage, informations sur le poste et l'établissement."},
        {h:"Conservation",t:"Employés actifs : durée du contrat. Facturation : 10 ans. Logs sécurité : 12 mois."},
        {h:"Sous-traitants",t:"Supabase Inc. (USA - clauses contractuelles types), Vercel Inc. (USA - clauses contractuelles types)."},
        {h:"Transferts hors UE",t:"Encadrés par des clauses contractuelles types approuvées par la Commission Européenne."},
        {h:"Contact DPO",t:"contact@switzerit.com — réponse sous 30 jours."},
        {h:"Réclamation",t:"Auprès du PFPDT (Suisse) ou de l'autorité de contrôle de votre pays UE."},
      ]},
      cookies:{title:"Politique de Cookies",last:"11 mai 2026",content:[
        {h:"Qu'est-ce qu'un cookie ?",t:"Un petit fichier texte déposé sur votre appareil lors de la visite du site."},
        {h:"Cookies nécessaires",t:"Cookies d'authentification (sb-access-token), préférences de langue, sécurité CSRF. Ils ne peuvent pas être désactivés."},
        {h:"Cookies fonctionnels",t:"Établissement sélectionné, état de la borne, préférences d'affichage."},
        {h:"Cookies analytiques",t:"Nous n'utilisons pas de cookies analytiques tiers."},
        {h:"Cookies tiers",t:"Supabase et Vercel déposent leurs propres cookies techniques nécessaires à l'infrastructure."},
        {h:"Gestion",t:"Contrôlables via les paramètres de votre navigateur."},
        {h:"Durée",t:"Session : supprimés à la fermeture du navigateur. Persistants : maximum 12 mois."},
      ]},
    }
    const s=sections[legalSection]
    return (
      <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
        <div style={{maxWidth:900,margin:'0 auto',padding:isMobile?'24px 20px':'56px 24px'}}>
          {isMobile ? (
            <>
              <div style={{display:'flex',gap:8,marginBottom:20,overflowX:'auto',paddingBottom:4}}>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{padding:'8px 16px',borderRadius:20,border:'none',background:legalSection===id?A:'transparent',color:legalSection===id?'white':TEXT2,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{label}</button>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'24px 20px'}}>
                <div style={{fontSize:11,color:TEXT3,marginBottom:6}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:24,fontWeight:900,color:TEXT,marginBottom:20}}>{s.title}</h1>
                {s.content.map((block,i)=>(
                  <div key={i} style={{marginBottom:20}}>
                    <h2 style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>{block.h}</h2>
                    <p style={{fontSize:13,color:TEXT2,lineHeight:1.7,margin:0}}>{block.t}</p>
                  </div>
                ))}
                <div style={{marginTop:24,padding:'14px 16px',background:'#e8f2fd',borderRadius:10,fontSize:13,color:A}}>
                  <strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a>
                </div>
              </div>
            </>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:24,alignItems:'start'}}>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'18px 14px',position:'sticky',top:72}}>
                <div style={{fontSize:11,fontWeight:700,color:TEXT3,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Légal</div>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'none',background:legalSection===id?'#e8f2fd':'transparent',color:legalSection===id?A:TEXT2,fontSize:13,fontWeight:legalSection===id?700:500,cursor:'pointer',textAlign:'left',marginBottom:3,display:'block'}}>{label}</button>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'32px'}}>
                <div style={{fontSize:11,color:TEXT3,marginBottom:6}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:28,fontWeight:900,color:TEXT,letterSpacing:'-.02em',marginBottom:22}}>{s.title}</h1>
                {s.content.map((block,i)=>(
                  <div key={i} style={{marginBottom:22}}>
                    <h2 style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:7}}>{block.h}</h2>
                    <p style={{fontSize:14,color:TEXT2,lineHeight:1.7,margin:0}}>{block.t}</p>
                  </div>
                ))}
                <div style={{marginTop:28,padding:'14px 18px',background:'#e8f2fd',borderRadius:11,fontSize:13,color:A}}>
                  <strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:BG,fontFamily:'var(--font)',color:TEXT}}>
      <Nav/>
      {page==='home'&&<PageHome/>}
      {page==='fonctionnalites'&&<PageFeatures/>}
      {page==='tarifs'&&<PagePricing/>}
      {page==='contact'&&<PageContact/>}
      {page==='legal'&&<PageLegal/>}
      <Footer/>

      {showLogin&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:SURF,borderRadius:20,padding:isMobile?'24px 20px':32,width:'100%',maxWidth:380,boxShadow:'0 24px 64px rgba(0,0,0,.15)',border:`1px solid ${BORDER}`,position:'relative'}}>
            <button onClick={()=>setShowLogin(false)} style={{position:'absolute',top:14,right:14,width:32,height:32,borderRadius:'50%',border:`1px solid ${BORDER}`,background:BG,color:TEXT2,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✕</button>
            <div style={{textAlign:'center',marginBottom:22}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>{LOGO}</div>
              <div style={{fontSize:20,fontWeight:800,color:TEXT}}>Connexion</div>
              <div style={{fontSize:13,color:TEXT2,marginTop:4}}>Accédez à votre espace Kronvo</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:13,fontWeight:700,color:TEXT2,marginBottom:6}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required style={inp}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:13,fontWeight:700,color:TEXT2,marginBottom:6}}>Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={inp}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              {error&&<div style={{padding:'10px 14px',background:'#fff2f1',border:'1px solid rgba(255,59,48,.2)',borderRadius:10,fontSize:13,color:'#b02020',marginBottom:16,fontWeight:600}}>{error}</div>}
              <button type="submit" style={{width:'100%',height:50,borderRadius:12,border:'none',background:A,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,113,227,.25)'}}>Se connecter</button>
            </form>
            <div style={{textAlign:'center',marginTop:14}}>
              <span style={{fontSize:13,color:TEXT3}}>Pas encore client ? </span>
              <span style={{fontSize:13,color:A,fontWeight:600,cursor:'pointer'}} onClick={()=>{setShowLogin(false);goPage('contact')}}>Demander une démo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
