import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

const LOGO_SM = <svg width="26" height="18" viewBox="0 0 34 34" fill="none"><rect width="34" height="34" rx="10" fill="#3b9eff"/><path d="M10 9v16M10 17l7-8M10 17l8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="17" r="2.5" fill="white"/></svg>

const Arr = ({size=16,color='white'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const Chk = ({size=14,color='#3b9eff'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

// Animation hero — apparaît dès le chargement
function HeroReveal({children, delay=0}) {
  const [visible, setVisible] = useState(false)
  useEffect(()=>{ const t=setTimeout(()=>setVisible(true), delay); return()=>clearTimeout(t) },[])
  return (
    <div style={{
      opacity: visible?1:0,
      transform: visible?'none':'translateY(20px)',
      transition:`opacity 1.1s cubic-bezier(.16,1,.3,1) 0ms, transform 1.1s cubic-bezier(.16,1,.3,1) 0ms`
    }}>{children}</div>
  )
}

// Animation scroll — uniquement sur titres + cards, pas sur tout
function Reveal({children, delay=0}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(()=>{
    const el=ref.current; if(!el) return
    const obs=new IntersectionObserver(([e])=>{ if(e.isIntersecting){setVisible(true);obs.disconnect()} },{threshold:0.08})
    obs.observe(el); return()=>obs.disconnect()
  },[])
  return (
    <div ref={ref} style={{
      opacity:visible?1:0,
      transform:visible?'none':'translateY(24px)',
      transition:`opacity 1s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 1s cubic-bezier(.16,1,.3,1) ${delay}ms`
    }}>{children}</div>
  )
}

function QRDisplay() {
  const [seed,setSeed]=useState(0)
  const [progress,setProgress]=useState(0)
  const [fade,setFade]=useState(false)
  useEffect(()=>{
    let p=0
    const iv=setInterval(()=>{
      p+=100/300
      if(p>=100){setFade(true);setTimeout(()=>{setSeed(s=>s+1);setProgress(0);setFade(false);p=0},300)}
      else setProgress(p)
    },100)
    return()=>clearInterval(iv)
  },[])
  const rng=(x,y,s)=>((x*7+y*13+s*31)%17>7)
  const sz=11,cs=5,tot=sz*cs+(sz-1)
  const cells=[]
  for(let r=0;r<sz;r++) for(let c=0;c<sz;c++) cells.push({r,c,v:rng(r,c,seed)})
  const isFixed=(r,c)=>(r<3&&c<3)||(r<3&&c>=sz-3)||(r>=sz-3&&c<3)
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <div style={{background:'white',borderRadius:6,padding:8,opacity:fade?.15:1,transition:fade?'opacity .25s':'none',border:'1px solid rgba(255,255,255,.1)'}}>
        <svg width={tot} height={tot} viewBox={`0 0 ${tot} ${tot}`}>
          {cells.map(({r,c,v})=>{
            const x=c*(cs+1),y=r*(cs+1)
            const fill=isFixed(r,c)?(r===0||r===2||c===0||c===2||(r>=sz-3&&(c===0||c===2))?'#1d1d1f':'white'):(v?'#1d1d1f':'white')
            return <rect key={`${r}-${c}`} x={x} y={y} width={cs} height={cs} rx={0.5} fill={fill}/>
          })}
        </svg>
      </div>
      <div style={{width:76}}>
        <div style={{height:2,background:'rgba(255,255,255,.15)',borderRadius:1}}>
          <div style={{height:'100%',background:'#3b9eff',borderRadius:1,width:`${progress}%`,transition:'width .1s linear'}}/>
        </div>
        <div style={{fontSize:9,color:'rgba(255,255,255,.35)',textAlign:'center',marginTop:3,fontWeight:600}}>Renouvellement {Math.ceil(30-(progress*30/100))}s</div>
      </div>
    </div>
  )
}

function RoiCalc({isMobile,A,SURF,BORDER,TEXT,TEXT2,BG}) {
  const [emp,setEmp]=useState(10)
  const [hrs,setHrs]=useState(3)
  const pertes=emp*hrs*4, cout=pertes*60, eco=cout*12
  return (
    <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:24,padding:isMobile?'28px':'48px',maxWidth:660,margin:'0 auto'}}>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:32,marginBottom:32}}>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:TEXT2,marginBottom:12}}>
            Nombre d'employés — <strong style={{color:TEXT}}>{emp}</strong>
          </label>
          <input type="range" min="2" max="80" value={emp} onChange={e=>setEmp(Number(e.target.value))} style={{width:'100%',accentColor:A,cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:TEXT2,marginTop:5,opacity:.5}}><span>2</span><span>80</span></div>
        </div>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:TEXT2,marginBottom:12}}>
            Heures perdues / semaine — <strong style={{color:TEXT}}>{hrs}h</strong>
          </label>
          <input type="range" min="1" max="15" value={hrs} onChange={e=>setHrs(Number(e.target.value))} style={{width:'100%',accentColor:A,cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:TEXT2,marginTop:5,opacity:.5}}><span>1h</span><span>15h</span></div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
        {[
          {v:`${pertes}h`,l:'perdues / mois',bg:'rgba(176,32,32,.12)',bc:'rgba(176,32,32,.25)',c:'#ff6b6b'},
          {v:cout.toLocaleString('fr-CH'),l:'CHF perdus / mois',bg:'rgba(138,90,0,.12)',bc:'rgba(138,90,0,.25)',c:'#ffb347'},
          {v:eco.toLocaleString('fr-CH'),l:'CHF économisés / an',bg:'rgba(26,107,53,.15)',bc:'rgba(52,199,89,.25)',c:'#4cd964'}
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.bc}`,borderRadius:16,padding:'20px 12px',textAlign:'center'}}>
            <div style={{fontSize:isMobile?22:28,fontWeight:900,color:s.c,letterSpacing:'-.03em',lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:11,color:s.c,marginTop:6,fontWeight:500,opacity:.8,lineHeight:1.4}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:'rgba(59,158,255,.1)',border:'1px solid rgba(59,158,255,.2)',borderRadius:14,padding:'16px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <span style={{fontSize:13,color:'rgba(59,158,255,.9)',fontWeight:500}}>Économie estimée : <strong>{eco.toLocaleString('fr-CH')} CHF / an</strong> pour {emp} employés</span>
        <a href="/contact" style={{padding:'10px 20px',borderRadius:10,background:A,color:'white',fontSize:13,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:6}}>
          Obtenir mon devis <Arr size={13}/>
        </a>
      </div>
    </div>
  )
}

function FaqSection({TEXT,TEXT2,BORDER,A}) {
  const [open,setOpen]=useState(null)
  const faqs=[
    {q:"Combien de temps prend la mise en place ?",a:"En moyenne 2 à 4 heures avec notre équipe SwitzerIT. Configuration, import des employés, installation de la borne et formation. Vous n'avez rien à faire techniquement."},
    {q:"Faut-il une tablette pour le badgeage ?",a:"Non, c'est optionnel. Vos employés scannent depuis leur smartphone. La borne tablette fixe est recommandée pour les établissements avec une entrée unique."},
    {q:"Un employé a oublié de badger — que faire ?",a:"Le gérant corrige manuellement les pointages depuis son tableau de bord. L'historique complet est conservé pour chaque employé."},
    {q:"Nos données sont-elles sécurisées ?",a:"Oui. Données chiffrées en transit et au repos. Chaque établissement a ses données isolées. Conforme au RGPD et à la LPD suisse."},
    {q:"Peut-on personnaliser les postes ?",a:"Oui, chaque établissement configure ses propres postes. Restaurant : Cuisine, Salle, Bar. Clinique : Médecin, Infirmier, Accueil."},
    {q:"Y a-t-il un engagement minimum ?",a:"Non. Sans engagement de durée. Arrêt avec un préavis de 30 jours. La démo est gratuite et sans obligation."},
    {q:"Comment fonctionne le support ?",a:"Support assuré par l'équipe SwitzerIT — des humains. Réponse par email sous 24h ouvrées. Les clients maintenance bénéficient d'une intervention sous 4 heures."},
  ]
  return (
    <div>
      {faqs.map((faq,i)=>(
        <div key={i} style={{borderBottom:`1px solid ${BORDER}`}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 0',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:16}}>
            <span style={{fontSize:15,fontWeight:600,color:TEXT,lineHeight:1.4}}>{faq.q}</span>
            <span style={{fontSize:22,color:A,flexShrink:0,fontWeight:300,transform:open===i?'rotate(45deg)':'none',transition:'transform .2s',display:'inline-block',lineHeight:1}}>{open===i?'−':'+'}</span>
          </button>
          {open===i&&<div style={{paddingBottom:18}}><p style={{fontSize:14,color:TEXT2,lineHeight:1.8,margin:0}}>{faq.a}</p></div>}
        </div>
      ))}
      <div style={{textAlign:'center',marginTop:28,paddingTop:20,borderTop:`1px solid ${BORDER}`}}>
        <span style={{fontSize:14,color:TEXT2}}>Une autre question ? </span>
        <a href="/contact" style={{fontSize:14,color:A,fontWeight:600,textDecoration:'none'}}>On vous répond →</a>
      </div>
    </div>
  )
}

export default function Login() {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [showLogin,setShowLogin]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [legalSection,setLegalSection]=useState('cgu')
  const [contactForm,setContactForm]=useState({nom:'',email:'',entreprise:'',secteur:'',message:''})
  const [contactSent,setContactSent]=useState(false)
  const [isMobile,setIsMobile]=useState(window.innerWidth<900)
  const navigate=useNavigate()
  const location=useLocation()

  useEffect(()=>{ const h=()=>setIsMobile(window.innerWidth<900); window.addEventListener('resize',h); return()=>window.removeEventListener('resize',h) },[])

  useEffect(()=>{
    supabase.auth.getSession().then(async({data})=>{
      if(data.session){
        const {data:profil}=await supabase.from('profils').select('role').eq('user_id',data.session.user.id).single()
        if(profil?.role==='super_admin') navigate('/admin')
        else if(profil?.role==='gerant') navigate('/gerant')
        else navigate('/moi')
      } else {setLoading(false);if(location.pathname==='/login')setShowLogin(true)}
    })
  },[])

  async function handleLogin(e){
    e.preventDefault();setLoading(true);setError('')
    const {data,error}=await supabase.auth.signInWithPassword({email,password})
    if(error){setError('Email ou mot de passe incorrect');setLoading(false);return}
    const {data:profil}=await supabase.from('profils').select('role').eq('user_id',data.user.id).single()
    if(profil?.role==='super_admin') navigate('/admin')
    else if(profil?.role==='gerant') navigate('/gerant')
    else navigate('/moi')
    setLoading(false)
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a1628',color:'rgba(255,255,255,.4)',fontFamily:'var(--font)'}}>Chargement...</div>

  const A='#3b9eff'
  const SURF='#0e1f38'
  const BORDER='rgba(255,255,255,.08)'
  const BG='#0a1628'
  const TEXT='#eef2ff'
  const TEXT2='#7a9ec4'
  const TEXT3='#3d5a7a'
  const DARK='#060f1a'
  const CARD='#112236'

  const W={maxWidth:1080,margin:'0 auto',padding:isMobile?'0 24px':'0 56px'}
  const WM={maxWidth:860,margin:'0 auto',padding:isMobile?'0 24px':'0 56px'}
  const SEC=isMobile?'72px 24px':'108px 0'

  const scrollTop=()=>{setTimeout(()=>window.scrollTo({top:0,left:0,behavior:'instant'}),20)}
  const pageMap={'home':'/','fonctionnalites':'/fonctionnalites','tarifs':'/tarifs','contact':'/contact','legal':'/legal'}
  const goPage=(p)=>{navigate(pageMap[p]||'/'+p);setMenuOpen(false);scrollTop()}
  const path=location.pathname.replace('/','') || 'home'
  const page=path==='login'?'home':path||'home'
  const inp={width:'100%',padding:'13px 16px',borderRadius:11,border:`1.5px solid ${BORDER}`,background:'rgba(255,255,255,.06)',fontSize:15,color:TEXT,outline:'none',boxSizing:'border-box',transition:'border-color .2s'}

  const Nav=()=>(
    <>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:64,background:'rgba(10,22,40,.95)',backdropFilter:'blur(24px)',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',padding:'0 40px'}}>
        <div onClick={()=>goPage('home')} style={{display:'flex',alignItems:'center',gap:10,flex:1,cursor:'pointer',userSelect:'none'}}>
          {LOGO_SM}
          <span style={{fontSize:17,fontWeight:800,color:'white',letterSpacing:'-.04em'}}>Kronvo</span>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'rgba(59,158,255,.15)',color:A,letterSpacing:'.04em',marginLeft:2,border:'1px solid rgba(59,158,255,.2)'}}>BETA</span>
        </div>
        {isMobile?(
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowLogin(true)} style={{padding:'8px 16px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Connexion</button>
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{width:38,height:38,borderRadius:9,border:`1px solid ${BORDER}`,background:'rgba(255,255,255,.06)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4.5}}>
              {[0,1,2].map(i=><span key={i} style={{width:15,height:1.5,background:'rgba(255,255,255,.6)',borderRadius:1,display:'block'}}></span>)}
            </button>
          </div>
        ):(
          <div style={{display:'flex',gap:1,alignItems:'center'}}>
            {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([l,id])=>(
              <button key={id} onClick={()=>goPage(id)} style={{padding:'7px 15px',borderRadius:9,border:'none',background:page===id?'rgba(59,158,255,.12)':'transparent',color:page===id?A:'rgba(255,255,255,.55)',fontSize:13,fontWeight:page===id?600:500,cursor:'pointer',transition:'all .15s'}}>{l}</button>
            ))}
            <div style={{width:1,height:18,background:BORDER,margin:'0 14px'}}/>
            <button onClick={()=>setShowLogin(true)} style={{padding:'8px 18px',borderRadius:9,border:`1px solid ${BORDER}`,background:'transparent',color:'rgba(255,255,255,.6)',fontSize:13,fontWeight:500,cursor:'pointer',transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.06)';e.currentTarget.style.color='white'}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,.6)'}}>Connexion</button>
            <button onClick={()=>goPage('contact')} style={{padding:'8px 18px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',marginLeft:6,transition:'opacity .15s'}}
            onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Demander une démo</button>
          </div>
        )}
      </nav>
      {isMobile&&menuOpen&&(
        <div style={{position:'fixed',top:64,left:0,right:0,zIndex:99,background:'#0a1628',borderBottom:`1px solid ${BORDER}`,padding:'8px 0 20px'}}>
          {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([l,id])=>(
            <button key={id} onClick={()=>goPage(id)} style={{width:'100%',padding:'14px 28px',border:'none',background:'transparent',color:'rgba(255,255,255,.7)',fontSize:14,fontWeight:500,cursor:'pointer',textAlign:'left',display:'block'}}>{l}</button>
          ))}
          <div style={{margin:'10px 24px 0',paddingTop:14,borderTop:`1px solid ${BORDER}`}}>
            <button onClick={()=>{goPage('contact');setMenuOpen(false)}} style={{width:'100%',padding:'15px',borderRadius:11,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
          </div>
        </div>
      )}
    </>
  )

  const Footer=()=>(
    <footer style={{background:DARK,borderTop:`1px solid ${BORDER}`,color:'white',padding:isMobile?'56px 24px 36px':'72px 0 40px'}}>
      <div style={W}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2.5fr 1fr 1fr 1fr',gap:isMobile?32:56,marginBottom:48}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>{LOGO_SM}<span style={{fontSize:16,fontWeight:800,color:'white',letterSpacing:'-.03em'}}>Kronvo</span></div>
            <div style={{fontSize:14,color:'rgba(255,255,255,.35)',lineHeight:1.85,maxWidth:240,marginBottom:20}}>La solution de gestion d'équipes pour les professionnels terrain.</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.2)'}}>Propulsé par <a href="https://switzerit.com" target="_blank" rel="noreferrer" style={{color:'rgba(255,255,255,.4)',textDecoration:'none',fontWeight:600}}>SwitzerIT</a></div>
          </div>
          {[
            {title:'Produit',links:[['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']]},
            {title:'Support',links:[['Contact','contact'],['Démo Teams','contact']]},
            {title:'Légal',links:[['CGU','legal'],['Confidentialité','legal'],['RGPD','legal']]},
          ].map(col=>(
            <div key={col.title}>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.2)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:18}}>{col.title}</div>
              {col.links.map(([l,p])=>(
                <div key={l} onClick={()=>goPage(p)} style={{fontSize:13,color:'rgba(255,255,255,.35)',marginBottom:12,cursor:'pointer',transition:'color .15s'}}
                onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.7)'}
                onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.35)'}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,.2)'}}>© 2026 Kronvo by SwitzerIT · Suisse</div>
          <div style={{display:'flex',gap:20,fontSize:12}}>
            {[['Confidentialité','legal'],['CGU','legal'],['RGPD','legal']].map(([l,p])=>(
              <span key={l} onClick={()=>goPage(p)} style={{color:'rgba(255,255,255,.2)',cursor:'pointer'}}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )

  const PageHome=()=>(
    <>
      {/* HERO */}
      <section style={{paddingTop:64,background:BG}}>
        <div style={{...W,padding:isMobile?'80px 24px 72px':'100px 56px 96px',display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center'}}>
          <div>
            <HeroReveal delay={100}>
              <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'6px 14px',borderRadius:20,background:'rgba(59,158,255,.1)',border:'1px solid rgba(59,158,255,.2)',marginBottom:32}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'#34c759',boxShadow:'0 0 0 3px rgba(52,199,89,.2)',display:'inline-block'}}></span>
                <span style={{fontSize:12,fontWeight:600,color:A}}>Badgeage QR · Planning · Présences</span>
              </div>
            </HeroReveal>
            <HeroReveal delay={200}>
              <h1 style={{fontSize:isMobile?40:64,fontWeight:900,lineHeight:1.02,margin:'0 0 6px',letterSpacing:'-.06em',color:TEXT}}>Le planning qui</h1>
              <h1 style={{fontSize:isMobile?40:64,fontWeight:900,lineHeight:1.02,margin:'0 0 28px',letterSpacing:'-.06em',color:A}}>se gère tout seul.</h1>
            </HeroReveal>
            <HeroReveal delay={320}>
              <p style={{fontSize:isMobile?16:18,color:TEXT2,lineHeight:1.8,marginBottom:40,maxWidth:420}}>
                Badgeage QR, présences en direct, export paie automatique. Tout ce dont votre équipe terrain a besoin — sans la paperasse.
              </p>
            </HeroReveal>
            <HeroReveal delay={420}>
              <div style={{display:'flex',gap:12,flexDirection:isMobile?'column':'row',marginBottom:32}}>
                <button onClick={()=>goPage('contact')} style={{padding:'16px 28px',borderRadius:13,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:9,justifyContent:'center',boxShadow:'0 4px 24px rgba(59,158,255,.25)',transition:'transform .2s,box-shadow .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(59,158,255,.35)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 24px rgba(59,158,255,.25)'}}>
                  Demander une démo gratuite <Arr/>
                </button>
                <button onClick={()=>goPage('fonctionnalites')} style={{padding:'16px 22px',borderRadius:13,border:`1.5px solid ${BORDER}`,background:'transparent',color:'rgba(255,255,255,.7)',fontSize:15,fontWeight:600,cursor:'pointer',transition:'border-color .2s,color .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.3)';e.currentTarget.style.color='white'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color='rgba(255,255,255,.7)'}}>
                  Voir les fonctionnalités
                </button>
              </div>
              <div style={{display:'flex',gap:22,flexWrap:'wrap'}}>
                {['Démo gratuite','Sans engagement','2-4h mise en place'].map(t=>(
                  <div key={t} style={{display:'flex',alignItems:'center',gap:6}}>
                    <Chk size={13}/>
                    <span style={{fontSize:13,color:TEXT3,fontWeight:500}}>{t}</span>
                  </div>
                ))}
              </div>
            </HeroReveal>
          </div>
          {!isMobile&&(
            <HeroReveal delay={150}>
              <div style={{background:CARD,borderRadius:22,padding:20,border:`1px solid ${BORDER}`,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
                <div style={{background:DARK,borderRadius:14,padding:'13px 18px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:'white'}}>Kronvo · Le Bistrot</div>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
                      <span style={{width:5,height:5,borderRadius:'50%',background:'#34c759',display:'inline-block'}}></span>
                      <span style={{fontSize:10,color:'rgba(255,255,255,.35)'}}>En direct</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:5}}>{['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{width:8,height:8,borderRadius:'50%',background:c}}></div>)}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                  {[{v:'8',l:'Présents',bg:'rgba(52,199,89,.12)',c:'#4cd964'},{v:'3',l:'Absents',bg:'rgba(255,59,48,.12)',c:'#ff6b6b'},{v:'2',l:'En pause',bg:'rgba(255,149,0,.12)',c:'#ffb347'}].map((s,i)=>(
                    <div key={i} style={{background:s.bg,border:`1px solid ${BORDER}`,borderRadius:10,padding:'12px 6px',textAlign:'center'}}>
                      <div style={{fontSize:24,fontWeight:900,color:s.c,letterSpacing:'-.03em',lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:10,color:s.c,fontWeight:600,marginTop:3,opacity:.8}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:'rgba(255,255,255,.04)',border:`1px solid ${BORDER}`,borderRadius:12,padding:'12px',marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:700,color:TEXT3,letterSpacing:'.1em',marginBottom:10}}>ÉQUIPE EN DIRECT</div>
                  {[{n:'Sophie Martin',p:'Cuisine',h:'09:02',s:'#34c759'},{n:'Marc Dupont',p:'Salle',h:'09:15',s:'#34c759'},{n:'Julie Bernard',p:'Bar',h:'En pause',s:'#ff9500'},{n:'Thomas Petit',p:'Cuisine',h:'Absent',s:'rgba(255,255,255,.2)'}].map((e,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:8,background:i%2===0?'rgba(255,255,255,.03)':'transparent',marginBottom:2}}>
                      <div style={{width:27,height:27,borderRadius:'50%',background:'rgba(59,158,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:A,flexShrink:0,position:'relative'}}>
                        {e.n.split(' ').map(x=>x[0]).join('')}
                        <div style={{position:'absolute',bottom:0,right:0,width:7,height:7,borderRadius:'50%',background:e.s,border:'1.5px solid #0e1f38'}}></div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:600,color:TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.n}</div>
                        <div style={{fontSize:9,color:TEXT3}}>{e.p}</div>
                      </div>
                      <span style={{fontSize:10,color:TEXT2,fontWeight:500}}>{e.h}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:'rgba(255,255,255,.04)',border:`1px solid ${BORDER}`,borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:14}}>
                  <QRDisplay/>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:TEXT,marginBottom:4}}>QR Code actif</div>
                    <div style={{fontSize:10,color:TEXT2,lineHeight:1.6}}>Vos employés scannent depuis leur téléphone</div>
                    <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6}}>
                      <span style={{width:5,height:5,borderRadius:'50%',background:'#34c759',display:'inline-block'}}></span>
                      <span style={{fontSize:9,color:'#34c759',fontWeight:600}}>Sécurisé · Renouvelé automatiquement</span>
                    </div>
                  </div>
                </div>
              </div>
            </HeroReveal>
          )}
        </div>
      </section>

      {/* TRUST + STATS */}
      <section style={{background:'#0c1a2e',borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{borderBottom:`1px solid ${BORDER}`,padding:'16px 0'}}>
          <div style={W}>
            <Reveal>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:isMobile?12:32,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{display:'flex'}}>
                    {[{bg:'rgba(59,158,255,.25)',t:'SM'},{bg:'rgba(52,199,89,.25)',t:'JD'},{bg:'rgba(255,149,0,.25)',t:'AL'}].map((a,i)=>(
                      <div key={i} style={{width:30,height:30,borderRadius:'50%',background:a.bg,border:'2px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'rgba(255,255,255,.7)',marginRight:i<2?-8:0,zIndex:3-i}}>{a.t}</div>
                    ))}
                  </div>
                  <span style={{fontSize:13,color:'rgba(255,255,255,.6)',fontWeight:500}}>Des équipes terrain font confiance à Kronvo</span>
                </div>
                <div style={{width:1,height:20,background:BORDER}}></div>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <span style={{color:'#f59e0b',fontSize:15,letterSpacing:1}}>★★★★★</span>
                  <span style={{fontSize:13,fontWeight:700,color:'white'}}>4.8</span>
                  <span style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>/5 · support SwitzerIT</span>
                </div>
                {!isMobile&&<>
                  <div style={{width:1,height:20,background:BORDER}}></div>
                  <span style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>Restaurants · Hôtels · Cliniques · Garages · BTP & plus</span>
                </>}
              </div>
            </Reveal>
          </div>
        </div>
        <div style={{padding:'44px 0'}}>
          <div style={WM}>
            <Reveal>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)'}}>
                {[
                  {v:'2-4h',l:'mise en place',sub:'clé en main par SwitzerIT',c:A},
                  {v:'30s',l:'par badgeage',sub:'scan QR depuis le téléphone',c:'white'},
                  {v:'8+',l:'secteurs',sub:'restaurants, hôtels, cliniques...',c:'white'},
                  {v:'100%',l:'mobile',sub:'iPhone, Android & tablette',c:'white'},
                ].map((s,i)=>(
                  <div key={i} style={{textAlign:'center',borderRight:i<3?`1px solid ${BORDER}`:'none',padding:isMobile?'10px 4px':'16px 28px'}}>
                    <div style={{fontSize:isMobile?26:42,fontWeight:900,color:s.c,letterSpacing:'-.05em',lineHeight:1,marginBottom:6}}>{s.v}</div>
                    <div style={{fontSize:13,color:'rgba(255,255,255,.6)',fontWeight:600,marginBottom:4}}>{s.l}</div>
                    {!isMobile&&<div style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{s.sub}</div>}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PROBLÈME */}
      <section style={{background:BG,padding:SEC}}>
        <div style={WM}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:64}}>
              <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>Le problème</div>
              <h2 style={{fontSize:isMobile?30:48,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:18,lineHeight:1.04}}>Vous perdez des heures<br/>sur des tâches inutiles.</h2>
              <p style={{fontSize:17,color:TEXT2,lineHeight:1.8,maxWidth:500,margin:'0 auto'}}>Feuilles papier, appels incessants, erreurs de paie — tout ça a un coût réel. Kronvo les élimine.</p>
            </div>
          </Reveal>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:16}}>
            {[
              {bg:'rgba(176,32,32,.08)',border:'rgba(176,32,32,.2)',top:'#ff6b6b',
               icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>,
               title:'Feuilles de présence',desc:'Perdues, illisibles, recopiées à la main chaque semaine. Un cauchemar pour la paie de fin de mois.',sol:'Badgeage QR en 2 secondes'},
              {bg:'rgba(138,90,0,.08)',border:'rgba(255,149,0,.2)',top:'#ffb347',
               icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffb347" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 10a16 16 0 0 0 6.29 6.29l1.35-1.35a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
               title:'Appels sans fin',desc:'"Qui est là aujourd\'hui ?" — une question répétée chaque matin qui vous fait perdre un temps précieux.',sol:'Tableau de bord en temps réel'},
              {bg:'rgba(58,56,128,.08)',border:'rgba(120,116,255,.2)',top:'#a78bfa',
               icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
               title:'Erreurs sur la paie',desc:'Heures non comptées, heures supp oubliées, bulletins contestés. Un coût financier et humain chaque mois.',sol:'Export PDF automatique'},
            ].map((c,i)=>(
              <Reveal key={i} delay={i*100}>
                <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:20,padding:'32px',overflow:'hidden',position:'relative',transition:'transform .3s',height:'100%'}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:c.top,borderRadius:'20px 20px 0 0',opacity:.5}}></div>
                  <div style={{width:52,height:52,background:'rgba(255,255,255,.05)',borderRadius:15,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,border:`1px solid ${c.border}`}}>{c.icon}</div>
                  <div style={{fontSize:17,fontWeight:700,color:TEXT,marginBottom:10}}>{c.title}</div>
                  <div style={{fontSize:14,color:TEXT2,lineHeight:1.75,marginBottom:20}}>{c.desc}</div>
                  <div style={{display:'flex',alignItems:'center',gap:9,padding:'12px 16px',background:'rgba(52,199,89,.08)',border:'1px solid rgba(52,199,89,.2)',borderRadius:11}}>
                    <Chk size={14} color="#4cd964"/>
                    <span style={{fontSize:13,fontWeight:600,color:'#4cd964'}}>Kronvo — {c.sol}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section style={{background:SURF,borderTop:`1px solid ${BORDER}`,padding:SEC}}>
        <div style={W}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:64}}>
              <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>Fonctionnalités</div>
              <h2 style={{fontSize:isMobile?30:48,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:18,lineHeight:1.04}}>Tout ce dont vous avez besoin.</h2>
              <p style={{fontSize:17,color:TEXT2,maxWidth:460,margin:'0 auto',lineHeight:1.8}}>Une solution complète pour les équipes terrain. Sans formation, sans complexité.</p>
            </div>
          </Reveal>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:2,background:BORDER,borderRadius:20,overflow:'hidden',marginBottom:28}}>
            {[
              {icon:'📅',title:'Planning intelligent',desc:'Créez et publiez les plannings en quelques clics. Shifts simples ou coupés. Postes adaptés à votre secteur.',bg:'rgba(59,158,255,.08)'},
              {icon:'📷',title:'Badgeage QR Code',desc:'QR dynamique renouvelé toutes les 30s. Scan depuis le téléphone. Borne tablette disponible.',bg:'rgba(120,116,255,.08)'},
              {icon:'👥',title:'Présences en direct',desc:'Visualisez qui est là maintenant. Heures prévues vs heures pointées. Écarts calculés automatiquement.',bg:'rgba(52,199,89,.08)'},
              {icon:'📱',title:'App mobile employé',desc:'Chaque employé consulte son planning, badge et voit son historique. iPhone et Android.',bg:'rgba(255,149,0,.08)'},
              {icon:'📄',title:'Export PDF paie',desc:'Rapports générés en un clic. Par employé, par période. Prêt pour votre comptable.',bg:'rgba(255,59,48,.08)'},
              {icon:'🏢',title:'Multi-établissements',desc:'Gérez plusieurs sites depuis un seul tableau de bord. Données isolées par établissement.',bg:'rgba(167,139,250,.08)'},
            ].map((f,i)=>(
              <div key={i} style={{background:SURF,padding:'32px 26px',transition:'background .2s,transform .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background=CARD}}
              onMouseLeave={e=>{e.currentTarget.style.background=SURF}}>
                <div style={{width:48,height:48,borderRadius:14,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:18}}>{f.icon}</div>
                <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:10}}>{f.title}</div>
                <div style={{fontSize:14,color:TEXT2,lineHeight:1.7}}>{f.desc}</div>
              </div>
            ))}
          </div>
          <Reveal>
            <div style={{textAlign:'center'}}>
              <button onClick={()=>goPage('fonctionnalites')} style={{padding:'12px 24px',borderRadius:11,border:`1.5px solid ${BORDER}`,background:'transparent',color:A,fontSize:14,fontWeight:600,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=A;e.currentTarget.style.background='rgba(59,158,255,.08)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.background='transparent'}}>
                Toutes les fonctionnalités →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTEURS */}
      <section style={{background:BG,borderTop:`1px solid ${BORDER}`,padding:SEC}}>
        <div style={WM}>
          <div style={{display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1.5fr',gap:72,alignItems:'center'}}>
            <Reveal>
              <div style={{marginBottom:isMobile?40:0}}>
                <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>Secteurs</div>
                <h2 style={{fontSize:isMobile?30:42,fontWeight:900,color:TEXT,letterSpacing:'-.05em',marginBottom:20,lineHeight:1.06}}>Votre secteur,<br/>vos postes.</h2>
                <p style={{fontSize:16,color:TEXT2,lineHeight:1.8,marginBottom:28}}>Kronvo s'adapte à votre activité avec les termes exacts que vous utilisez. Chaque établissement configure ses propres postes.</p>
                <button onClick={()=>goPage('contact')} style={{padding:'13px 24px',borderRadius:11,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8,transition:'opacity .2s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  Vérifier mon secteur <Arr size={14}/>
                </button>
              </div>
            </Reveal>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {bg:'rgba(59,158,255,.1)',border:'rgba(59,158,255,.2)',c:A,title:'Restaurants & Hôtels',postes:'Cuisine · Salle · Bar · Réception · Ménage'},
                {bg:'rgba(255,59,48,.08)',border:'rgba(255,59,48,.2)',c:'#ff6b6b',title:'Cliniques & Santé',postes:'Médecin · Infirmier · Accueil · Admin'},
                {bg:'rgba(255,149,0,.08)',border:'rgba(255,149,0,.2)',c:'#ffb347',title:'Garages & BTP',postes:'Mécanicien · Chef atelier · Chantier'},
                {bg:'rgba(120,116,255,.08)',border:'rgba(120,116,255,.2)',c:'#a78bfa',title:'Commerce',postes:'Caissier · Rayon · Manager · Réserve'},
                {bg:'rgba(52,199,89,.08)',border:'rgba(52,199,89,.2)',c:'#4cd964',title:'Logistique',postes:'Préparateur · Chef équipe · Quai'},
                {bg:'rgba(167,139,250,.08)',border:'rgba(167,139,250,.2)',c:'#c4b5fd',title:'Spas, Éducation & +',postes:'Esthéticien · Formateur · Accueil'},
              ].map((s,i)=>(
                <Reveal key={i} delay={i*60}>
                  <div style={{background:s.bg,borderRadius:16,padding:'18px',border:`1px solid ${s.border}`,transition:'transform .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                    <div style={{fontSize:13,fontWeight:700,color:s.c,marginBottom:7}}>{s.title}</div>
                    <div style={{fontSize:11,color:s.c,opacity:.6,lineHeight:1.7}}>{s.postes}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section style={{background:SURF,borderTop:`1px solid ${BORDER}`,padding:SEC}}>
        <div style={W}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:56}}>
              <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>Calculateur</div>
              <h2 style={{fontSize:isMobile?30:48,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:18,lineHeight:1.04}}>Combien vous coûte<br/>l'ancien système ?</h2>
              <p style={{fontSize:17,color:TEXT2,maxWidth:420,margin:'0 auto',lineHeight:1.8}}>Calculez ce que vous perdez chaque mois avec les feuilles papier et les appels inutiles.</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <RoiCalc isMobile={isMobile} A={A} SURF={CARD} BORDER={BORDER} TEXT={TEXT} TEXT2={TEXT2} BG={BG}/>
          </Reveal>
        </div>
      </section>

      {/* FAQ + CTA */}
      <section style={{background:BG,borderTop:`1px solid ${BORDER}`,padding:SEC}}>
        <div style={W}>
          <div style={{display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:88,alignItems:'start'}}>
            <div>
              <Reveal>
                <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>Questions fréquentes</div>
                <h2 style={{fontSize:isMobile?28:40,fontWeight:900,color:TEXT,letterSpacing:'-.05em',marginBottom:12,lineHeight:1.08}}>Tout ce que vous voulez savoir.</h2>
                <p style={{fontSize:16,color:TEXT2,marginBottom:40,lineHeight:1.8}}>Avant de commencer, voici les réponses aux questions les plus fréquentes.</p>
              </Reveal>
              <FaqSection TEXT={TEXT} TEXT2={TEXT2} BORDER={BORDER} A={A}/>
            </div>
            <div style={{marginTop:isMobile?56:0}}>
              <Reveal delay={150}>
                <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:24,padding:'40px',marginBottom:14}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 13px',borderRadius:20,background:'rgba(59,158,255,.1)',border:'1px solid rgba(59,158,255,.18)',marginBottom:24}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'#34c759',boxShadow:'0 0 0 2px rgba(52,199,89,.2)',display:'inline-block'}}></span>
                    <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.5)'}}>Démo disponible cette semaine</span>
                  </div>
                  <h3 style={{fontSize:isMobile?24:32,fontWeight:900,color:TEXT,letterSpacing:'-.04em',marginBottom:16,lineHeight:1.08}}>Prêt à simplifier<br/>la gestion de votre équipe ?</h3>
                  <p style={{fontSize:15,color:TEXT2,marginBottom:32,lineHeight:1.75}}>Démo gratuite via Teams. Notre équipe configure tout pour vous, sans engagement.</p>
                  <button onClick={()=>goPage('contact')} style={{width:'100%',padding:'16px',borderRadius:13,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:9,justifyContent:'center',marginBottom:10,boxShadow:'0 4px 24px rgba(59,158,255,.25)',transition:'opacity .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                    Réserver ma démo gratuite <Arr/>
                  </button>
                  <button onClick={()=>setShowLogin(true)} style={{width:'100%',padding:'14px',borderRadius:13,border:`1px solid ${BORDER}`,background:'transparent',color:'rgba(255,255,255,.4)',fontSize:14,fontWeight:500,cursor:'pointer',transition:'all .2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.2)';e.currentTarget.style.color='rgba(255,255,255,.65)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color='rgba(255,255,255,.4)'}}>
                    Déjà client — Se connecter
                  </button>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.15)',textAlign:'center',marginTop:16}}>Sans carte bancaire · Sans engagement · Réponse sous 24h</div>
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:'24px'}}>
                  <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:18}}>Mise en place en 4 étapes</div>
                  {[
                    {e:'📹',t:'Démo 30 min',d:'On vous présente Kronvo adapté à votre secteur.'},
                    {e:'⚙️',t:'Configuration',d:'SwitzerIT configure tout pour vous.'},
                    {e:'🎓',t:'Formation incluse',d:'Gérants et équipes formés. Documentation fournie.'},
                    {e:'🚀',t:'En production',d:'Vos équipes scannent. Vous suivez.'},
                  ].map((s,i)=>(
                    <div key={i} style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:i<3?16:0}}>
                      <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.05)',border:`1px solid ${BORDER}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{s.e}</div>
                      <div style={{paddingTop:3}}>
                        <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:3}}>{s.t}</div>
                        <div style={{fontSize:12,color:TEXT2,lineHeight:1.5}}>{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )

  const PageFeatures=()=>(
    <div style={{paddingTop:64,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'56px 24px':'80px 56px'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:72}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>Fonctionnalités</div>
            <h1 style={{fontSize:isMobile?32:56,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:20,lineHeight:1.02}}>Tout ce que Kronvo<br/>peut faire pour vous.</h1>
            <p style={{fontSize:17,color:TEXT2,maxWidth:520,margin:'0 auto',lineHeight:1.8}}>Une solution pensée pour les équipes terrain. Zéro complexité, 100% efficace dès le premier jour.</p>
          </div>
        </Reveal>

        {/* Feature principale mise en avant */}
        <Reveal>
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:24,padding:isMobile?'28px':'48px',marginBottom:16,display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center'}}>
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 12px',borderRadius:20,background:'rgba(59,158,255,.1)',border:'1px solid rgba(59,158,255,.2)',marginBottom:20}}>
                <span style={{fontSize:12}}>📅</span>
                <span style={{fontSize:11,fontWeight:600,color:A}}>Fonctionnalité clé</span>
              </div>
              <h2 style={{fontSize:isMobile?24:32,fontWeight:800,color:TEXT,letterSpacing:'-.04em',marginBottom:16}}>Planning intelligent</h2>
              <p style={{fontSize:15,color:TEXT2,lineHeight:1.8,marginBottom:24}}>Créez des plannings complets en quelques minutes. Shifts simples ou coupés, postes adaptés à votre secteur, publication en un clic pour toute votre équipe.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {['Shifts simples ou coupés configurables','Postes personnalisables selon votre activité','Publication instantanée pour toute l\'équipe','Modification en temps réel depuis le dashboard','Vue semaine desktop, vue jour sur mobile'].map((item,j)=>(
                  <div key={j} style={{display:'flex',alignItems:'center',gap:10}}>
                    <Chk size={13}/>
                    <span style={{fontSize:14,color:TEXT2}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:'rgba(59,158,255,.05)',borderRadius:16,padding:'24px',border:'1px solid rgba(59,158,255,.1)',marginTop:isMobile?24:0}}>
              <div style={{fontSize:11,fontWeight:700,color:TEXT3,letterSpacing:'.1em',marginBottom:14}}>PLANNING SEMAINE</div>
              {['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].map((j,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{fontSize:12,color:TEXT3,width:60,flexShrink:0}}>{j}</div>
                  <div style={{flex:1,height:28,borderRadius:7,background:`rgba(59,158,255,${0.15+i*0.05})`,display:'flex',alignItems:'center',paddingLeft:10}}>
                    <span style={{fontSize:11,color:A,fontWeight:600}}>{['Sophie M.','Marc D.','Julie B.','Sophie M.','Marc D.'][i]} · {['09:00-17:00','10:00-18:00','09:00-15:00','11:00-19:00','09:00-17:00'][i]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(2,1fr)',gap:16,marginBottom:16}}>
          {[
            {icon:'📷',title:'Badgeage QR Code sécurisé',color:'rgba(120,116,255,.08)',border:'rgba(120,116,255,.15)',items:['QR dynamique renouvelé toutes les 30s','Scan depuis le smartphone','Vérification d\'appartenance à l\'établissement','Borne tablette fixe avec PIN sécurisé']},
            {icon:'👥',title:'Suivi des présences',color:'rgba(52,199,89,.08)',border:'rgba(52,199,89,.15)',items:['Vue temps réel de qui est présent','Heures planifiées vs heures pointées','Calcul automatique des écarts','Correction manuelle par le gérant']},
            {icon:'📄',title:'Rapports et export PDF',color:'rgba(255,59,48,.08)',border:'rgba(255,59,48,.15)',items:['Rapports PDF professionnels en un clic','Filtrage par période personnalisable','Détail complet par employé','Export immédiat depuis le dashboard']},
            {icon:'📱',title:'App mobile employé',color:'rgba(255,149,0,.08)',border:'rgba(255,149,0,.15)',items:['Installable sur iPhone et Android','Planning personnel toujours à jour','Bouton scan QR intégré','Consultable hors connexion']},
          ].map((f,i)=>(
            <Reveal key={i} delay={i*80}>
              <div style={{background:f.color,border:`1px solid ${f.border}`,borderRadius:20,padding:'28px',height:'100%',transition:'transform .2s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{fontSize:28,marginBottom:16}}>{f.icon}</div>
                <div style={{fontSize:17,fontWeight:700,color:TEXT,marginBottom:14}}>{f.title}</div>
                {f.items.map((item,j)=>(
                  <div key={j} style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
                    <Chk size={12}/>
                    <span style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:20,padding:'32px',display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:32,alignItems:'center'}}>
            <div>
              <div style={{fontSize:28,marginBottom:12}}>🏢</div>
              <h3 style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:10,letterSpacing:'-.02em'}}>Multi-établissements</h3>
              <p style={{fontSize:14,color:TEXT2,lineHeight:1.75}}>Gérez plusieurs sites depuis un seul tableau de bord. Données entièrement isolées par établissement. Idéal pour les groupes et franchises.</p>
            </div>
            <div style={{marginTop:isMobile?20:0}}>
              <div style={{background:'rgba(59,158,255,.05)',border:'1px solid rgba(59,158,255,.1)',borderRadius:12,padding:'20px'}}>
                <div style={{fontSize:11,fontWeight:700,color:TEXT3,letterSpacing:'.1em',marginBottom:14}}>VOS ÉTABLISSEMENTS</div>
                {['Le Bistrot · Paris','Hotel Lumière · Lyon','Clinique Santé · Genève'].map((e,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:9,background:'rgba(255,255,255,.03)',border:`1px solid ${BORDER}`,marginBottom:8}}>
                    <span style={{fontSize:13,color:TEXT,fontWeight:500}}>{e}</span>
                    <span style={{fontSize:11,color:'#4cd964',fontWeight:600}}>● Actif</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div style={{background:'rgba(59,158,255,.05)',border:'1px solid rgba(59,158,255,.1)',borderRadius:20,padding:'36px',textAlign:'center',marginTop:16}}>
            <div style={{fontSize:22,fontWeight:800,color:TEXT,marginBottom:12}}>Fonctionnalités à venir</div>
            <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:24}}>
              {['Notifications email','Analytics avancées','Intégration paie','Messagerie équipe','Multi-langue'].map(f=>(
                <span key={f} style={{padding:'7px 16px',borderRadius:20,background:'rgba(59,158,255,.08)',border:'1px solid rgba(59,158,255,.15)',fontSize:13,fontWeight:600,color:A}}>{f}</span>
              ))}
            </div>
            <button onClick={()=>goPage('contact')} style={{padding:'14px 28px',borderRadius:11,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
          </div>
        </Reveal>
      </div>
    </div>
  )

  const PagePricing=()=>(
    <div style={{paddingTop:64,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'56px 24px':'80px 56px'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:72}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>Tarifs</div>
            <h1 style={{fontSize:isMobile?32:56,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:20,lineHeight:1.02}}>Investissez dans<br/>ce qui compte vraiment.</h1>
            <p style={{fontSize:17,color:TEXT2,maxWidth:520,margin:'0 auto',lineHeight:1.8}}>Un tarif sur mesure adapté à votre taille et vos besoins. Démo gratuite incluse, sans engagement.</p>
          </div>
        </Reveal>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:16,marginBottom:32}}>
          {[
            {name:'Mise en place',icon:'🚀',bg:'rgba(59,158,255,.08)',border:'rgba(59,158,255,.15)',c:A,
             desc:'SwitzerIT configure tout pour vous de A à Z.',
             items:['Création et configuration du compte','Paramétrage de vos établissements','Import de vos employés','Installation borne tablette','Formation complète des gérants','Documentation et support au lancement'],
             tag:'Sur devis',featured:false},
            {name:'Abonnement mensuel',icon:'✨',bg:'rgba(59,158,255,.08)',border:A,c:A,
             desc:'Accès complet à Kronvo pour votre établissement.',
             items:['Planning et badgeage illimités','Tous vos employés inclus','Rapports PDF illimités','Support email réactif sous 24h','Mises à jour automatiques incluses','Hébergement sécurisé en Suisse'],
             tag:'Sur devis · facturé en CHF',featured:true},
            {name:'Support & maintenance',icon:'🛡️',bg:'rgba(167,139,250,.08)',border:'rgba(167,139,250,.2)',c:'#a78bfa',
             desc:'Accompagnement continu pour votre sérénité.',
             items:['Support prioritaire SwitzerIT','Intervention garantie sous 4h','Formations supplémentaires incluses','Évolutions personnalisées possibles','Suivi trimestriel dédié','SLA garanti par contrat'],
             tag:'Options disponibles',featured:false},
          ].map((plan,i)=>(
            <Reveal key={i} delay={i*80}>
              <div style={{background:plan.bg,border:`${plan.featured?'2px':'1px'} solid ${plan.border}`,borderRadius:20,padding:'28px',display:'flex',flexDirection:'column',position:'relative',boxShadow:plan.featured?'0 0 40px rgba(59,158,255,.1)':'none',height:'100%'}}>
                {plan.featured&&<div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',padding:'4px 18px',borderRadius:20,background:A,color:'white',fontSize:10,fontWeight:700,whiteSpace:'nowrap',letterSpacing:'.06em'}}>RECOMMANDÉ</div>}
                <div style={{fontSize:32,marginBottom:14}}>{plan.icon}</div>
                <div style={{fontSize:19,fontWeight:800,color:TEXT,marginBottom:8,letterSpacing:'-.02em'}}>{plan.name}</div>
                <div style={{fontSize:14,color:TEXT2,lineHeight:1.65,marginBottom:20}}>{plan.desc}</div>
                <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24,flex:1}}>
                  {plan.items.map(f=>(
                    <div key={f} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:13,color:TEXT2}}>
                      <div style={{flexShrink:0,marginTop:2}}><Chk size={12} color={plan.c}/></div>{f}
                    </div>
                  ))}
                </div>
                <div style={{padding:'10px 16px',background:'rgba(255,255,255,.04)',border:`1px solid ${BORDER}`,borderRadius:10,fontSize:13,fontWeight:700,color:plan.c,textAlign:'center',marginBottom:14}}>{plan.tag}</div>
                <button onClick={()=>goPage('contact')} style={{width:'100%',height:46,borderRadius:11,border:plan.featured?'none':`1.5px solid ${plan.c}`,background:plan.featured?A:'transparent',color:plan.featured?'white':plan.c,fontSize:14,fontWeight:700,cursor:'pointer',transition:'opacity .2s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Demander un devis</button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:20,padding:'32px',display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'center',marginBottom:16}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:A,marginBottom:10}}>Pourquoi choisir Kronvo ?</div>
              <h3 style={{fontSize:isMobile?20:26,fontWeight:800,color:TEXT,marginBottom:16,letterSpacing:'-.03em'}}>Un investissement qui se rentabilise en moins d'un mois.</h3>
              <p style={{fontSize:14,color:TEXT2,lineHeight:1.75}}>En moyenne, nos clients économisent 2 à 4 heures de travail administratif par semaine. Pour un gérant à 60 CHF/h, Kronvo se rentabilise dès le premier mois.</p>
            </div>
            <div style={{marginTop:isMobile?20:0}}>
              {[
                {label:'Temps économisé / semaine',val:'2-4h',c:A},
                {label:'Erreurs de paie évitées',val:'100%',c:'#4cd964'},
                {label:'Mise en place',val:'2-4h',c:'#ffb347'},
                {label:'Retour sur investissement',val:'< 1 mois',c:'#a78bfa'},
              ].map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:i<3?`1px solid ${BORDER}`:'none'}}>
                  <span style={{fontSize:13,color:TEXT2}}>{s.label}</span>
                  <span style={{fontSize:15,fontWeight:800,color:s.c}}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div style={{background:'rgba(59,158,255,.06)',border:'1px solid rgba(59,158,255,.15)',borderRadius:16,padding:'28px',display:'flex',alignItems:isMobile?'flex-start':'center',gap:18,flexDirection:isMobile?'column':'row'}}>
            <div style={{fontSize:36,flexShrink:0}}>📹</div>
            <div style={{flex:1}}>
              <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:6}}>Démo gratuite via Teams — 30 minutes</div>
              <div style={{fontSize:14,color:TEXT2,lineHeight:1.65}}>On vous présente Kronvo adapté à votre secteur et repartez avec un devis personnalisé. Sans engagement.</div>
            </div>
            <button onClick={()=>goPage('contact')} style={{padding:'14px 24px',borderRadius:11,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',flexShrink:0,width:isMobile?'100%':'auto',transition:'opacity .2s'}}
            onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Réserver ma démo →</button>
          </div>
        </Reveal>
      </div>
    </div>
  )

  const PageContact=()=>(
    <div style={{paddingTop:64,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'56px 24px':'80px 56px'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:60}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>Contact</div>
            <h1 style={{fontSize:isMobile?30:52,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:16,lineHeight:1.02}}>Parlons de votre projet.</h1>
            <p style={{fontSize:17,color:TEXT2,maxWidth:440,margin:'0 auto',lineHeight:1.8}}>Notre équipe vous répond sous 24h et organise une démo Teams gratuite adaptée à votre secteur.</p>
          </div>
        </Reveal>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.3fr 1fr',gap:24}}>
          <Reveal>
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:22,padding:'36px'}}>
              {contactSent?(
                <div style={{textAlign:'center',padding:'52px 20px'}}>
                  <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(52,199,89,.12)',border:'1px solid rgba(52,199,89,.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}>
                    <Chk size={32} color="#4cd964"/>
                  </div>
                  <div style={{fontSize:24,fontWeight:800,color:TEXT,marginBottom:12}}>Demande envoyée !</div>
                  <div style={{fontSize:15,color:TEXT2,lineHeight:1.8,marginBottom:24}}>Notre équipe vous contactera sous 24h pour organiser la démo Teams.</div>
                  <button onClick={()=>{setContactSent(false);setContactForm({nom:'',email:'',entreprise:'',secteur:'',message:''})}} style={{padding:'11px 24px',borderRadius:10,border:`1px solid ${BORDER}`,background:'transparent',color:TEXT2,fontSize:13,fontWeight:600,cursor:'pointer'}}>Nouvelle demande</button>
                </div>
              ):(
                <>
                  <div style={{fontSize:18,fontWeight:800,color:TEXT,marginBottom:6}}>Demander une démo Teams</div>
                  <div style={{fontSize:13,color:TEXT2,marginBottom:28}}>Gratuite · 30 min · Sans engagement</div>
                  {[{f:'nom',l:'Nom complet *',ph:'Jean Dupont',t:'text'},{f:'email',l:'Email *',ph:'jean@exemple.fr',t:'email'},{f:'entreprise',l:"Établissement *",ph:'Mon Établissement',t:'text'}].map(({f,l,ph,t})=>(
                    <div key={f} style={{marginBottom:16}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:7}}>{l}</label>
                      <input type={t} placeholder={ph} value={contactForm[f]} onChange={e=>setContactForm(ff=>({...ff,[f]:e.target.value}))} style={inp}
                      onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                    </div>
                  ))}
                  <div style={{marginBottom:16}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:7}}>Secteur</label>
                    <select value={contactForm.secteur} onChange={e=>setContactForm(f=>({...f,secteur:e.target.value}))} style={{...inp,appearance:'auto'}}>
                      <option value="">Sélectionner...</option>
                      {['Restaurant','Hôtel','Garage','Commerce','Clinique','Spa & Salon','BTP','Logistique','Éducation','Autre'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:28}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:7}}>Message (optionnel)</label>
                    <textarea placeholder="Nombre d'employés, besoin spécifique..." value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} rows={3}
                    style={{...inp,resize:'vertical',fontFamily:'var(--font)'}}
                    onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                  </div>
                  <button onClick={()=>{if(!contactForm.nom||!contactForm.email||!contactForm.entreprise){alert('Remplis les champs obligatoires');return}setContactSent(true)}}
                  style={{width:'100%',height:54,borderRadius:13,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(59,158,255,.2)',transition:'opacity .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                    Envoyer ma demande →
                  </button>
                  <div style={{fontSize:12,color:TEXT3,textAlign:'center',marginTop:12}}>Réponse sous 24h · Démo Teams offerte</div>
                </>
              )}
            </div>
          </Reveal>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[
              {delay:100,content:(
                <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:18,padding:'26px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                    <span style={{fontSize:28}}>📹</span>
                    <div style={{fontSize:15,fontWeight:700,color:TEXT}}>Démo Teams gratuite</div>
                  </div>
                  <div style={{fontSize:13,color:TEXT2,lineHeight:1.75,marginBottom:16}}>30 minutes pour voir Kronvo en action adapté à votre secteur. Repartez avec un devis personnalisé.</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {['Présentation adaptée à votre secteur','Questions/réponses illimitées','Devis personnalisé inclus','Aucun engagement requis'].map((t,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                        <Chk size={12}/>
                        <span style={{fontSize:13,color:TEXT2}}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )},
              {delay:160,content:(
                <div style={{background:'rgba(59,158,255,.06)',border:'1px solid rgba(59,158,255,.15)',borderRadius:14,padding:'20px'}}>
                  <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:14}}>Ce qui est inclus</div>
                  {[{icon:'🚀',t:'Mise en place par SwitzerIT',d:"Notre équipe configure tout."},{icon:'🇨🇭',t:'Facturation en CHF',d:'Sans frais cachés.'},{icon:'🔒',t:'Données sécurisées',d:'RGPD & LPD suisse.'}].map((info,i)=>(
                    <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:i<2?14:0}}>
                      <span style={{fontSize:20,flexShrink:0}}>{info.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:2}}>{info.t}</div>
                        <div style={{fontSize:12,color:TEXT2}}>{info.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )},
              {delay:200,content:(
                <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px'}}>
                  <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:14}}>Déjà client ?</div>
                  <div style={{fontSize:13,color:TEXT2,marginBottom:14}}>Accédez directement à votre espace gérant.</div>
                  <button onClick={()=>setShowLogin(true)} style={{width:'100%',padding:'11px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Se connecter →</button>
                </div>
              )},
              {delay:240,content:(
                <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px'}}>
                  <div style={{fontSize:12,fontWeight:700,color:TEXT,marginBottom:12}}>Contact direct</div>
                  <div style={{fontSize:13,color:TEXT2,marginBottom:6}}>📧 contact@switzerit.com</div>
                  <div style={{fontSize:13,color:TEXT2,marginBottom:6}}>🌐 switzerit.com</div>
                  <div style={{fontSize:13,color:TEXT2}}>🇨🇭 Basé en Suisse</div>
                </div>
              )},
            ].map((item,i)=>(
              <Reveal key={i} delay={item.delay}>{item.content}</Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const PageLegal=()=>{
    const sections={
      cgu:{title:"Conditions Générales d'Utilisation",last:"11 mai 2026",content:[
        {h:"1. Objet",t:"Les présentes CGU régissent l'accès et l'utilisation de la plateforme Kronvo, éditée par SwitzerIT, basée en Suisse."},
        {h:"2. Description",t:"Kronvo est une solution SaaS de gestion d'équipes permettant la création de plannings, le badgeage par QR code, le suivi des présences et l'export de rapports."},
        {h:"3. Accès",t:"L'accès est réservé aux professionnels. Chaque compte est associé à un établissement, géré par un gérant désigné."},
        {h:"4. Obligations",t:"L'utilisateur s'engage à fournir des informations exactes, maintenir la confidentialité de ses identifiants, utiliser le service conformément à sa destination."},
        {h:"5. Responsabilité",t:"Sa responsabilité est limitée au montant des sommes versées au cours des 12 derniers mois."},
        {h:"6. Propriété intellectuelle",t:"L'ensemble des éléments de Kronvo est la propriété exclusive de SwitzerIT. Toute reproduction non autorisée est interdite."},
        {h:"7. Résiliation",t:"Chaque partie peut résilier avec un préavis de 30 jours."},
        {h:"8. Droit applicable",t:"Les CGU sont soumises au droit suisse. Les tribunaux du canton de Vaud sont seuls compétents."},
      ]},
      confidentialite:{title:"Politique de Confidentialité",last:"11 mai 2026",content:[
        {h:"Responsable",t:"SwitzerIT, basé en Suisse. Contact : contact@switzerit.com"},
        {h:"Données collectées",t:"Données d'identification, données professionnelles, données de pointage."},
        {h:"Finalités",t:"Gestion des comptes, fonctionnement du service, génération de rapports."},
        {h:"Conservation",t:"Durée du contrat + 3 ans. Données de pointage conservées 5 ans."},
        {h:"Partage",t:"Les données ne sont jamais vendues. Partagées uniquement avec nos sous-traitants avec garanties contractuelles."},
        {h:"Vos droits",t:"Conformément à la LPD suisse et au RGPD : accès, rectification, effacement, portabilité. Contact : contact@switzerit.com"},
        {h:"Sécurité",t:"Données chiffrées en transit et au repos. Authentification sécurisée."},
      ]},
      rgpd:{title:"Conformité RGPD",last:"11 mai 2026",content:[
        {h:"Engagement",t:"Kronvo respecte le RGPD (UE 2016/679) pour les utilisateurs UE, ainsi que la nLPD suisse."},
        {h:"Données traitées",t:"Noms et prénoms des employés, emails professionnels, données de badgeage."},
        {h:"Conservation",t:"Employés actifs : durée du contrat. Facturation : 10 ans. Logs sécurité : 12 mois."},
        {h:"Sous-traitants",t:"Supabase Inc. (USA - clauses contractuelles types), Vercel Inc. (USA - clauses contractuelles types)."},
        {h:"Contact DPO",t:"contact@switzerit.com — réponse sous 30 jours."},
        {h:"Réclamation",t:"Auprès du PFPDT (Suisse) ou de l'autorité de contrôle de votre pays UE."},
      ]},
      cookies:{title:"Politique de Cookies",last:"11 mai 2026",content:[
        {h:"Cookies nécessaires",t:"Cookies d'authentification, préférences, sécurité CSRF. Ils ne peuvent pas être désactivés."},
        {h:"Cookies fonctionnels",t:"Établissement sélectionné, état de la borne, préférences d'affichage."},
        {h:"Cookies analytiques",t:"Nous n'utilisons pas de cookies analytiques tiers."},
        {h:"Durée",t:"Session : supprimés à la fermeture. Persistants : maximum 12 mois."},
      ]},
    }
    const s=sections[legalSection]
    return (
      <div style={{paddingTop:64,minHeight:'100vh',background:BG}}>
        <div style={{...W,padding:isMobile?'32px 24px':'64px 56px'}}>
          {isMobile?(
            <>
              <div style={{display:'flex',gap:8,marginBottom:24,overflowX:'auto',paddingBottom:4}}>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{padding:'8px 17px',borderRadius:20,border:'none',background:legalSection===id?A:'transparent',color:legalSection===id?'white':TEXT2,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{label}</button>
                ))}
              </div>
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:'26px'}}>
                <div style={{fontSize:11,color:TEXT3,marginBottom:7}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:24,fontWeight:900,color:TEXT,marginBottom:22}}>{s.title}</h1>
                {s.content.map((block,i)=>(<div key={i} style={{marginBottom:22}}><h2 style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:7}}>{block.h}</h2><p style={{fontSize:14,color:TEXT2,lineHeight:1.8,margin:0}}>{block.t}</p></div>))}
                <div style={{marginTop:24,padding:'14px 18px',background:'rgba(59,158,255,.08)',borderRadius:11,fontSize:13,color:A}}><strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a></div>
              </div>
            </>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:28,alignItems:'start'}}>
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:'18px 14px',position:'sticky',top:76}}>
                <div style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14}}>Légal</div>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{width:'100%',padding:'9px 13px',borderRadius:9,border:'none',background:legalSection===id?'rgba(59,158,255,.1)':'transparent',color:legalSection===id?A:TEXT2,fontSize:13,fontWeight:legalSection===id?600:400,cursor:'pointer',textAlign:'left',marginBottom:2,display:'block',transition:'all .15s'}}>{label}</button>
                ))}
              </div>
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:18,padding:'40px'}}>
                <div style={{fontSize:11,color:TEXT3,marginBottom:9}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:30,fontWeight:900,color:TEXT,letterSpacing:'-.04em',marginBottom:28}}>{s.title}</h1>
                {s.content.map((block,i)=>(<div key={i} style={{marginBottom:26}}><h2 style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:9}}>{block.h}</h2><p style={{fontSize:14,color:TEXT2,lineHeight:1.85,margin:0}}>{block.t}</p></div>))}
                <div style={{marginTop:36,padding:'18px 22px',background:'rgba(59,158,255,.08)',borderRadius:12,fontSize:14,color:A}}><strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a></div>
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
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:CARD,borderRadius:22,padding:isMobile?'26px 22px':38,width:'100%',maxWidth:380,boxShadow:'0 32px 80px rgba(0,0,0,.4)',border:`1px solid ${BORDER}`,position:'relative'}}>
            <button onClick={()=>setShowLogin(false)} style={{position:'absolute',top:16,right:16,width:32,height:32,borderRadius:'50%',border:`1px solid ${BORDER}`,background:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.5)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'}>✕</button>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:14}}>{LOGO_SM}</div>
              <div style={{fontSize:21,fontWeight:800,color:TEXT,letterSpacing:'-.03em'}}>Connexion</div>
              <div style={{fontSize:13,color:TEXT2,marginTop:5}}>Accédez à votre espace Kronvo</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:7}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required style={inp}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              <div style={{marginBottom:24}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:7}}>Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                style={{...inp,color:'#1d1d1f',background:'white'}}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor='#e5e5ea'}/>
              </div>
              {error&&<div style={{padding:'10px 14px',background:'rgba(255,59,48,.1)',border:'1px solid rgba(255,59,48,.2)',borderRadius:10,fontSize:13,color:'#ff6b6b',marginBottom:16,fontWeight:600}}>{error}</div>}
              <button type="submit" style={{width:'100%',height:50,borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 18px rgba(59,158,255,.25)',transition:'opacity .2s'}}
              onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Se connecter</button>
            </form>
            <div style={{textAlign:'center',marginTop:18}}>
              <span style={{fontSize:13,color:TEXT3}}>Pas encore client ? </span>
              <span style={{fontSize:13,color:A,fontWeight:600,cursor:'pointer'}} onClick={()=>{setShowLogin(false);goPage('contact')}}>Demander une démo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
