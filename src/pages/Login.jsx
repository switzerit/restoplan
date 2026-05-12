import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

const LOGO_SM = <svg width="24" height="17" viewBox="0 0 32 22" fill="none"><rect x="0" y="4" width="6" height="18" rx="3" fill="#0071e3"/><rect x="8.5" y="0" width="6" height="22" rx="3" fill="#0071e3"/><rect x="17" y="6" width="6" height="14" rx="3" fill="#0071e3" fillOpacity="0.4"/><rect x="25.5" y="3" width="6" height="10" rx="3" fill="#0071e3" fillOpacity="0.18"/></svg>

const Icon = ({name,size=20,color='currentColor'}) => {
  const icons = {
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>,
    qr: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="5" y="5" width="3" height="3" fill={color}/><rect x="16" y="5" width="3" height="3" fill={color}/><rect x="5" y="16" width="3" height="3" fill={color}/><path d="M14 14h3v3h-3z"/><path d="M17 17h4"/><path d="M17 14v4"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    phone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    file: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>,
    building: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  }
  return icons[name] || null
}

function QRDisplay() {
  const [seed, setSeed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fade, setFade] = useState(false)
  useEffect(()=>{
    let p = 0
    const iv = setInterval(()=>{
      p += 100/300
      if(p >= 100){ setFade(true); setTimeout(()=>{ setSeed(s=>s+1); setProgress(0); setFade(false); p=0 }, 350) }
      else setProgress(p)
    }, 100)
    return ()=>clearInterval(iv)
  },[])
  const rng=(x,y,s)=>((x*7+y*13+s*31)%17>7)
  const size=11, cs=5, tot=size*cs+(size-1)
  const cells=[]
  for(let r=0;r<size;r++) for(let c=0;c<size;c++) cells.push({r,c,v:rng(r,c,seed)})
  const isFixed=(r,c)=>(r<3&&c<3)||(r<3&&c>=size-3)||(r>=size-3&&c<3)
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <div style={{background:'white',borderRadius:8,padding:8,opacity:fade?.2:1,transition:fade?'opacity .3s':'none',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
        <svg width={tot} height={tot} viewBox={`0 0 ${tot} ${tot}`}>
          {cells.map(({r,c,v})=>{
            const x=c*(cs+1),y=r*(cs+1)
            const fill=isFixed(r,c)?(r===0||r===2||c===0||c===2||(r>=size-3&&(c===0||c===2))?'#1d1d1f':'white'):(v?'#1d1d1f':'white')
            return <rect key={`${r}-${c}`} x={x} y={y} width={cs} height={cs} rx={0.8} fill={fill}/>
          })}
        </svg>
      </div>
      <div style={{width:80}}>
        <div style={{height:2,background:'#e5e5ea',borderRadius:1}}>
          <div style={{height:'100%',background:'#0071e3',borderRadius:1,width:`${progress}%`,transition:'width .1s linear'}}/>
        </div>
        <div style={{fontSize:9,color:'#8e8e93',textAlign:'center',marginTop:3,fontWeight:600}}>Renouvellement {Math.ceil(30-(progress*30/100))}s</div>
      </div>
    </div>
  )
}

// ── ROI CALCULATOR (composant global) ──
function RoiCalc({isMobile}) {
  const [emp, setEmp] = useState(10)
  const [hrs, setHrs] = useState(3)
  const pertes = emp * hrs * 4
  const cout = pertes * 60
  const eco = cout * 12
  return (
    <div style={{background:'#ffffff',border:'1px solid #e5e5ea',borderRadius:20,padding:isMobile?'24px':'36px',maxWidth:720,margin:'0 auto'}}>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:28,marginBottom:28}}>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#6e6e73',marginBottom:10}}>
            Nombre d'employés : <strong style={{color:'#1d1d1f'}}>{emp}</strong>
          </label>
          <input type="range" min="2" max="80" value={emp} onChange={e=>setEmp(Number(e.target.value))}
          style={{width:'100%',accentColor:'#0071e3',cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#aeaeb2',marginTop:4}}>
            <span>2</span><span>80</span>
          </div>
        </div>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#6e6e73',marginBottom:10}}>
            Heures perdues / semaine : <strong style={{color:'#1d1d1f'}}>{hrs}h</strong>
          </label>
          <input type="range" min="1" max="15" value={hrs} onChange={e=>setHrs(Number(e.target.value))}
          style={{width:'100%',accentColor:'#0071e3',cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#aeaeb2',marginTop:4}}>
            <span>1h</span><span>15h</span>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
        <div style={{background:'#fff2f1',border:'1px solid #ffd0d0',borderRadius:14,padding:'18px',textAlign:'center'}}>
          <div style={{fontSize:28,fontWeight:800,color:'#b02020',letterSpacing:'-.03em'}}>{pertes}h</div>
          <div style={{fontSize:12,color:'#b02020',marginTop:4,fontWeight:500}}>perdues par mois</div>
        </div>
        <div style={{background:'#fff8ee',border:'1px solid #ffd9a0',borderRadius:14,padding:'18px',textAlign:'center'}}>
          <div style={{fontSize:28,fontWeight:800,color:'#8a5a00',letterSpacing:'-.03em'}}>{cout.toLocaleString()}</div>
          <div style={{fontSize:12,color:'#8a5a00',marginTop:4,fontWeight:500}}>CHF perdus/mois</div>
        </div>
        <div style={{background:'#f0faf3',border:'1px solid #b8e8c8',borderRadius:14,padding:'18px',textAlign:'center'}}>
          <div style={{fontSize:28,fontWeight:800,color:'#1a6b35',letterSpacing:'-.03em'}}>{eco.toLocaleString()}</div>
          <div style={{fontSize:12,color:'#1a6b35',marginTop:4,fontWeight:500}}>CHF économisés/an</div>
        </div>
      </div>
      <div style={{background:'#e8f2fd',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div style={{fontSize:14,color:'#0051a8',fontWeight:500}}>
          Kronvo vous fait économiser <strong>{eco.toLocaleString()} CHF/an</strong> pour {emp} employés
        </div>
        <a href="/contact" style={{padding:'9px 18px',borderRadius:9,border:'none',background:'#0071e3',color:'white',fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0,textDecoration:'none',display:'inline-block'}}>
          Calculer mon devis →
        </a>
      </div>
    </div>
  )
}

// ── FAQ (composant global) ──
function FaqSection() {
  const [open, setOpen] = useState(null)
  const faqs = [
    {q:"Combien de temps faut-il pour mettre en place Kronvo ?",a:"La mise en place complète prend en moyenne 2 à 4 heures avec notre équipe SwitzerIT. Cela inclut la configuration de votre établissement, l'import des employés, l'installation de la borne tablette et la formation de vos gérants. Vous n'avez rien à faire techniquement."},
    {q:"Faut-il une tablette pour la borne QR ?",a:"Non, la borne tablette est optionnelle. Vos employés peuvent scanner le QR code directement depuis leur smartphone iPhone ou Android. La borne tablette fixe est recommandée pour les établissements avec une entrée unique, comme les restaurants ou cliniques."},
    {q:"Que se passe-t-il si un employé oublie de badger ?",a:"Le gérant peut corriger manuellement les pointages depuis son tableau de bord. Il peut ajouter, modifier ou supprimer un pointage à tout moment. L'historique complet est conservé et consultable pour chaque employé."},
    {q:"Est-ce que mes données sont sécurisées ?",a:"Oui. Toutes les données sont chiffrées en transit HTTPS et au repos. Chaque établissement a ses données complètement isolées. Kronvo est conforme au RGPD européen et à la LPD suisse. L'hébergement est assuré par des infrastructures de confiance."},
    {q:"Peut-on personnaliser les postes selon notre activité ?",a:"Oui, chaque établissement peut configurer ses propres postes depuis le tableau de bord gérant. Un restaurant aura Cuisine, Salle, Bar. Une clinique aura Médecin, Infirmier, Accueil. Les postes sont entièrement personnalisables."},
    {q:"Peut-on gérer plusieurs établissements ?",a:"Oui, Kronvo est conçu pour le multi-établissements. Un gérant peut gérer plusieurs sites depuis un seul tableau de bord. Chaque établissement a son propre QR code et ses données complètement isolées des autres."},
    {q:"Y a-t-il un engagement minimum ?",a:"Non. Nous fonctionnons sans engagement de durée minimum. Vous pouvez arrêter à tout moment avec un préavis de 30 jours. La démo initiale est gratuite et sans obligation d'achat."},
    {q:"Comment fonctionne le support ?",a:"Le support est assuré directement par l'équipe SwitzerIT, des humains et non un chatbot. Nous répondons par email sous 24h ouvrées. Les clients avec contrat de maintenance bénéficient d'une intervention sous 4 heures."},
  ]
  return (
    <div style={{maxWidth:720,margin:'0 auto'}}>
      {faqs.map((faq,i)=>(
        <div key={i} style={{borderBottom:'1px solid #e5e5ea'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 0',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:16}}>
            <span style={{fontSize:15,fontWeight:600,color:'#1d1d1f',lineHeight:1.4}}>{faq.q}</span>
            <span style={{fontSize:22,color:'#0071e3',flexShrink:0,fontWeight:300,transform:open===i?'rotate(45deg)':'none',transition:'transform .2s',display:'inline-block',lineHeight:1}}>{open===i?'−':'+'}</span>
          </button>
          {open===i&&(
            <div style={{paddingBottom:18}}>
              <p style={{fontSize:14,color:'#6e6e73',lineHeight:1.75,margin:0}}>{faq.a}</p>
            </div>
          )}
        </div>
      ))}
      <div style={{textAlign:'center',marginTop:28}}>
        <span style={{fontSize:14,color:'#6e6e73'}}>Autre question ? </span>
        <a href="/contact" style={{fontSize:14,color:'#0071e3',fontWeight:600,cursor:'pointer',textDecoration:'none'}}>Contactez-nous →</a>
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<900)
    window.addEventListener('resize',h)
    return()=>window.removeEventListener('resize',h)
  },[])

  useEffect(()=>{
    supabase.auth.getSession().then(async({data})=>{
      if(data.session){
        const {data:profil}=await supabase.from('profils').select('role').eq('user_id',data.session.user.id).single()
        if(profil?.role==='super_admin') navigate('/admin')
        else if(profil?.role==='gerant') navigate('/gerant')
        else navigate('/moi')
      } else { setLoading(false); if(location.pathname==='/login') setShowLogin(true) }
    })
  },[])

  async function handleLogin(e){
    e.preventDefault(); setLoading(true); setError('')
    const {data,error}=await supabase.auth.signInWithPassword({email,password})
    if(error){setError('Email ou mot de passe incorrect');setLoading(false);return}
    const {data:profil}=await supabase.from('profils').select('role').eq('user_id',data.user.id).single()
    if(profil?.role==='super_admin') navigate('/admin')
    else if(profil?.role==='gerant') navigate('/gerant')
    else navigate('/moi')
    setLoading(false)
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#fff',color:'#888',fontFamily:'var(--font)'}}>Chargement...</div>

  const A='#0071e3', BG='#f5f5f7', SURF='#ffffff', BORDER='#e5e5ea'
  const TEXT='#1d1d1f', TEXT2='#6e6e73', TEXT3='#aeaeb2'
  const W = {maxWidth:1100,margin:'0 auto',padding:isMobile?'0 20px':'0 56px'}

  const scrollTop=()=>window.scrollTo({top:0,behavior:'smooth'})
  const pageMap={'home':'/','fonctionnalites':'/fonctionnalites','tarifs':'/tarifs','contact':'/contact','legal':'/legal'}
  const goPage=(p)=>{navigate(pageMap[p]||'/'+p);scrollTop();setMenuOpen(false)}
  const path=location.pathname.replace('/','') || 'home'
  const page=path==='login'?'home':path||'home'
  const inp={width:'100%',padding:'12px 14px',borderRadius:10,border:`1.5px solid ${BORDER}`,background:BG,fontSize:15,color:TEXT,outline:'none',boxSizing:'border-box'}

  const Nav=()=>(
    <>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:56,background:'rgba(255,255,255,.96)',backdropFilter:'blur(20px)',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',padding:'0 56px',gap:8}}>
        <div onClick={()=>goPage('home')} style={{display:'flex',alignItems:'center',gap:8,flex:1,cursor:'pointer'}}>
          {LOGO_SM}
          <span style={{fontSize:17,fontWeight:800,color:TEXT,letterSpacing:'-.04em'}}>Kronvo</span>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:20,background:'#e8f2fd',color:A,letterSpacing:'.04em'}}>BETA</span>
        </div>
        {isMobile?(
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={()=>setShowLogin(true)} style={{padding:'8px 16px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Connexion</button>
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${BORDER}`,background:SURF,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:0}}>
              <span style={{width:16,height:1.5,background:TEXT,borderRadius:1,display:'block'}}></span>
              <span style={{width:16,height:1.5,background:TEXT,borderRadius:1,display:'block'}}></span>
              <span style={{width:16,height:1.5,background:TEXT,borderRadius:1,display:'block'}}></span>
            </button>
          </div>
        ):(
          <div style={{display:'flex',gap:1,alignItems:'center'}}>
            {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([l,id])=>(
              <button key={id} onClick={()=>goPage(id)} style={{padding:'6px 14px',borderRadius:8,border:'none',background:page===id?'#f0f5ff':'transparent',color:page===id?A:TEXT2,fontSize:13,fontWeight:page===id?600:500,cursor:'pointer'}}>{l}</button>
            ))}
            <div style={{width:1,height:18,background:BORDER,margin:'0 10px'}}/>
            <button onClick={()=>setShowLogin(true)} style={{padding:'7px 16px',borderRadius:9,border:`1px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:13,fontWeight:500,cursor:'pointer'}}>Connexion</button>
            <button onClick={()=>goPage('contact')} style={{padding:'7px 16px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',marginLeft:4}}>Demander une démo</button>
          </div>
        )}
      </nav>
      {isMobile&&menuOpen&&(
        <div style={{position:'fixed',top:56,left:0,right:0,zIndex:99,background:SURF,borderBottom:`1px solid ${BORDER}`,boxShadow:'0 12px 40px rgba(0,0,0,.1)',padding:'8px 0 20px'}}>
          {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([l,id])=>(
            <button key={id} onClick={()=>goPage(id)} style={{width:'100%',padding:'13px 24px',border:'none',background:'transparent',color:TEXT,fontSize:15,fontWeight:500,cursor:'pointer',textAlign:'left',display:'block'}}>{l}</button>
          ))}
          <div style={{margin:'10px 20px 0',paddingTop:14,borderTop:`1px solid ${BORDER}`}}>
            <button onClick={()=>{goPage('contact');setMenuOpen(false)}} style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
          </div>
        </div>
      )}
    </>
  )

  const Footer=()=>(
    <footer style={{background:'#0a0a0f',color:'white',padding:isMobile?'44px 20px 28px':'52px 56px 32px'}}>
      <div style={W}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr 1fr 1fr',gap:isMobile?28:48,marginBottom:32}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>{LOGO_SM}<span style={{fontSize:16,fontWeight:800,letterSpacing:'-.03em'}}>Kronvo</span></div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.45)',lineHeight:1.8,maxWidth:240}}>La solution de gestion d'équipes pour tous les professionnels terrain.</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.25)',marginTop:14}}>Propulsé par <a href="https://switzerit.com" target="_blank" rel="noreferrer" style={{color:'rgba(255,255,255,.45)',textDecoration:'none',fontWeight:600}}>SwitzerIT</a></div>
          </div>
          {[
            {title:'Produit',links:[['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']]},
            {title:'Support',links:[['Contact','contact'],['Démo Teams','contact']]},
            {title:'Légal',links:[['CGU','legal'],['Confidentialité','legal'],['RGPD','legal'],['Cookies','legal']]},
          ].map(col=>(
            <div key={col.title}>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.3)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:14}}>{col.title}</div>
              {col.links.map(([l,p])=><div key={l} onClick={()=>goPage(p)} style={{fontSize:13,color:'rgba(255,255,255,.45)',marginBottom:10,cursor:'pointer'}}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.07)',paddingTop:20,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,.25)'}}>© 2026 Kronvo by SwitzerIT · Suisse</div>
          <div style={{display:'flex',gap:16,fontSize:11}}>
            {[['Confidentialité','legal'],['CGU','legal'],['RGPD','legal']].map(([l,p])=>(
              <span key={l} onClick={()=>goPage(p)} style={{color:'rgba(255,255,255,.25)',cursor:'pointer'}}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )

  const PageHome=()=>(
    <>
      {/* HERO */}
      <section style={{paddingTop:56,background:`linear-gradient(160deg,#f0f6ff 0%,#ffffff 50%,#f5f5f7 100%)`,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{...W,padding:isMobile?'52px 20px 44px':'72px 56px 64px',display:isMobile?'block':'grid',gridTemplateColumns:'55% 45%',gap:64,alignItems:'center'}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:20,background:'rgba(0,113,227,.07)',border:'1px solid rgba(0,113,227,.12)',marginBottom:28}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#34c759',boxShadow:'0 0 6px #34c759',display:'inline-block'}}></span>
              <span style={{fontSize:12,fontWeight:600,color:A}}>Planning · Badgeage QR · Présences</span>
            </div>
            <h1 style={{fontSize:isMobile?40:58,fontWeight:900,lineHeight:1.04,margin:'0 0 22px',letterSpacing:'-.05em',color:TEXT}}>
              Gérez vos équipes.<br/>
              <span style={{background:`linear-gradient(135deg,${A} 0%,#5856d6 100%)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Sans la galère.</span>
            </h1>
            <p style={{fontSize:isMobile?16:18,color:TEXT2,lineHeight:1.75,marginBottom:36,maxWidth:440}}>
              Fini les feuilles de présence et les erreurs de paie. Kronvo centralise tout en un seul endroit, accessible depuis n'importe quel téléphone.
            </p>
            <div style={{display:'flex',gap:12,flexDirection:isMobile?'column':'row',marginBottom:32}}>
              <button onClick={()=>goPage('contact')} style={{padding:'16px 28px',borderRadius:13,border:'none',background:A,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 24px rgba(0,113,227,.35)',display:'flex',alignItems:'center',gap:8}}>
                Demander une démo gratuite <Icon name="arrow" size={16} color="white"/>
              </button>
              <button onClick={()=>goPage('fonctionnalites')} style={{padding:'16px 22px',borderRadius:13,border:`1.5px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:16,fontWeight:600,cursor:'pointer'}}>
                Comment ça marche
              </button>
            </div>
            <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
              {['Démo Teams gratuite','Sans engagement','Déploiement 2 à 4h'].map(t=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:6}}>
                  <Icon name="check" size={14} color="#34c759"/>
                  <span style={{fontSize:13,color:TEXT3}}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          {!isMobile&&(
            <div style={{background:'white',borderRadius:22,padding:20,boxShadow:'0 20px 60px rgba(0,0,0,.08)',border:`1px solid ${BORDER}`}}>
              <div style={{background:'#0a0a0f',borderRadius:14,padding:'12px 16px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'white'}}>Kronvo Dashboard</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.35)',marginTop:2}}>Restaurant Le Bistrot · En direct</div>
                </div>
                <div style={{display:'flex',gap:5}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#ff5f57'}}></div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#febc2e'}}></div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#28c840'}}></div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                {[{v:'8',l:'Présents',bg:'#f0faf3',c:'#1a6b35'},{v:'3',l:'Absents',bg:'#fff2f1',c:'#b02020'},{v:'2',l:'En pause',bg:'#fffbea',c:'#8a5a00'}].map((s,i)=>(
                  <div key={i} style={{background:s.bg,borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:10,color:s.c,fontWeight:600,marginTop:1}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:BG,borderRadius:12,padding:'12px',marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'.08em',marginBottom:8}}>ÉQUIPE EN DIRECT</div>
                {[{n:'Sophie Martin',p:'Cuisine',h:'09:02',s:'#34c759'},{n:'Marc Dupont',p:'Salle',h:'09:15',s:'#34c759'},{n:'Julie Bernard',p:'Bar',h:'En pause',s:'#ff9500'},{n:'Thomas Petit',p:'Cuisine',h:'Absent',s:'#e5e5ea'}].map((e,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:8,background:i%2===0?SURF:'transparent',marginBottom:2}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:'#e8f2fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:A,flexShrink:0,position:'relative'}}>
                      {e.n.split(' ').map(x=>x[0]).join('')}
                      <div style={{position:'absolute',bottom:0,right:0,width:7,height:7,borderRadius:'50%',background:e.s,border:'1.5px solid white'}}></div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:600,color:TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.n}</div>
                      <div style={{fontSize:9,color:TEXT3}}>{e.p}</div>
                    </div>
                    <span style={{fontSize:10,color:TEXT2}}>{e.h}</span>
                  </div>
                ))}
              </div>
              <div style={{background:BG,borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
                <QRDisplay/>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:TEXT,marginBottom:3}}>QR Code actif</div>
                  <div style={{fontSize:10,color:TEXT2,lineHeight:1.5}}>Vos employés scannent<br/>depuis leur téléphone</div>
                  <div style={{display:'flex',alignItems:'center',gap:4,marginTop:5}}>
                    <div style={{width:5,height:5,borderRadius:'50%',background:'#34c759'}}></div>
                    <span style={{fontSize:9,color:'#34c759',fontWeight:600}}>Sécurisé</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTEURS BANDE */}
      <section style={{background:SURF,borderBottom:`1px solid ${BORDER}`,padding:'18px 0'}}>
        <div style={W}>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?12:32,justifyContent:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:11,fontWeight:600,color:TEXT3,letterSpacing:'.04em',textTransform:'uppercase'}}>Adapté pour</span>
            {['Restaurants','Hôtels','Cliniques','Garages','Commerce','BTP','Logistique'].map(s=>(
              <span key={s} style={{fontSize:13,fontWeight:600,color:TEXT2}}>{s}</span>
            ))}
            <span style={{fontSize:13,color:TEXT3}}>& plus</span>
          </div>
        </div>
      </section>

      {/* PROBLÈME / SOLUTION */}
      <section style={{background:BG,padding:isMobile?'52px 20px':'72px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Le problème</div>
            <h2 style={{fontSize:isMobile?28:40,fontWeight:800,color:TEXT,letterSpacing:'-.04em',marginBottom:14}}>Vous perdez du temps chaque jour</h2>
            <p style={{fontSize:16,color:TEXT2,maxWidth:520,margin:'0 auto',lineHeight:1.7}}>Les absences imprévues, les feuilles papier et les appels inutiles coûtent cher. Il existe une meilleure façon.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16}}>
            <div style={{background:SURF,border:'1px solid #ffd0d0',borderRadius:18,padding:'28px',borderLeft:'3px solid #ff3b30'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22}}>
                <div style={{width:36,height:36,borderRadius:10,background:'#fff2f1',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Icon name="x" size={16} color="#ff3b30"/>
                </div>
                <span style={{fontSize:16,fontWeight:700,color:'#b02020'}}>Sans Kronvo</span>
              </div>
              {['Feuilles de présence papier perdues ou illisibles','Appels incessants pour savoir qui est absent','Erreurs sur les bulletins de paie chaque mois','Aucune visibilité sur les présences en temps réel','Heures supplémentaires non tracées ni payées','Planning distribué par SMS ou affiché en salle'].map(p=>(
                <div key={p} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:'#fff2f1',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                    <Icon name="x" size={10} color="#ff3b30"/>
                  </div>
                  <span style={{fontSize:14,color:TEXT2,lineHeight:1.5}}>{p}</span>
                </div>
              ))}
            </div>
            <div style={{background:SURF,border:'1px solid #b8e8c8',borderRadius:18,padding:'28px',borderLeft:'3px solid #34c759'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22}}>
                <div style={{width:36,height:36,borderRadius:10,background:'#f0faf3',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Icon name="check" size={16} color="#34c759"/>
                </div>
                <span style={{fontSize:16,fontWeight:700,color:'#1a6b35'}}>Avec Kronvo</span>
              </div>
              {['Badgeage QR en 2 secondes depuis le téléphone','Tableau de bord en direct — qui est là maintenant','Export PDF automatique prêt pour la paie','Planning publié en un clic, visible sur mobile','Heures planifiées vs pointées calculées automatiquement','Données sécurisées, accessibles partout 24h/24'].map(p=>(
                <div key={p} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:'#f0faf3',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                    <Icon name="check" size={10} color="#34c759"/>
                  </div>
                  <span style={{fontSize:14,color:TEXT2,lineHeight:1.5}}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{background:'#0a0a0f',padding:'36px 0'}}>
        <div style={W}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
            {[{v:'2 à 4h',l:'pour tout déployer',c:A},{v:'30 sec',l:'pour badger',c:'white'},{v:'8+',l:'secteurs couverts',c:'white'},{v:'100%',l:'mobile & tablette',c:'white'}].map((s,i)=>(
              <div key={i} style={{textAlign:'center',borderRight:i<3?'1px solid rgba(255,255,255,.06)':'none',padding:isMobile?'8px':'12px 24px'}}>
                <div style={{fontSize:isMobile?22:32,fontWeight:900,color:s.c,letterSpacing:'-.04em',lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:6,fontWeight:500}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section style={{background:SURF,padding:isMobile?'52px 20px':'72px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Ce que vous obtenez</div>
            <h2 style={{fontSize:isMobile?28:40,fontWeight:800,color:TEXT,letterSpacing:'-.04em',marginBottom:12}}>Tout ce dont vous avez besoin</h2>
            <p style={{fontSize:16,color:TEXT2,maxWidth:480,margin:'0 auto'}}>Une solution complète, conçue pour les équipes terrain. Ça marche dès le premier jour.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:1,background:BORDER,borderRadius:20,overflow:'hidden'}}>
            {[
              {icon:'calendar',title:'Planning intelligent',desc:"Créez et publiez les plannings en quelques clics. Shifts simples ou coupés. Postes adaptés à votre secteur.",color:A},
              {icon:'qr',title:'Badgeage QR Code',desc:"QR dynamique renouvelé toutes les 30 secondes. Vos employés scannent depuis leur téléphone. Borne tablette disponible.",color:'#5856d6'},
              {icon:'users',title:'Présences en direct',desc:"Voyez qui est présent maintenant. Écarts entre prévu et pointé calculés automatiquement. Historique complet.",color:'#34c759'},
              {icon:'phone',title:'App mobile employé',desc:"Chaque employé a son espace personnel. Planning, badgeage, historique. Installable sur iPhone et Android.",color:'#ff9500'},
              {icon:'file',title:'Export PDF paie',desc:"Rapports de présence détaillés générés en un clic. Par employé, par période. Prêt pour votre comptable.",color:'#ff3b30'},
              {icon:'building',title:'Multi-établissements',desc:"Gérez plusieurs sites depuis un seul tableau de bord. Idéal pour les groupes. Données isolées par site.",color:'#8a2060'},
            ].map((f,i)=>(
              <div key={i} style={{background:SURF,padding:'28px 24px',transition:'background .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#fafafa'}}
              onMouseLeave={e=>{e.currentTarget.style.background=SURF}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${f.color}14`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <Icon name={f.icon} size={20} color={f.color}/>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:8}}>{f.title}</div>
                <div style={{fontSize:13,color:TEXT2,lineHeight:1.65}}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:28}}>
            <button onClick={()=>goPage('fonctionnalites')} style={{padding:'11px 22px',borderRadius:10,border:`1px solid ${BORDER}`,background:SURF,color:A,fontSize:13,fontWeight:600,cursor:'pointer'}}>
              Voir toutes les fonctionnalités →
            </button>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section style={{background:BG,borderTop:`1px solid ${BORDER}`,padding:isMobile?'52px 20px':'72px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Mise en place</div>
            <h2 style={{fontSize:isMobile?28:40,fontWeight:800,color:TEXT,letterSpacing:'-.04em'}}>Déployé en 2 à 4 heures</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:16}}>
            {[
              {n:'01',title:'Démo Teams gratuite',desc:'On vous présente Kronvo en 30 min, adapté à votre secteur. Posez toutes vos questions.',icon:'clock'},
              {n:'02',title:'Configuration complète',desc:'SwitzerIT configure tout pour vous. Établissements, employés, borne. Vous ne faites rien.',icon:'zap'},
              {n:'03',title:'Formation incluse',desc:'Gérants et employés formés. Documentation fournie. Support disponible.',icon:'users'},
              {n:'04',title:"C'est parti !",desc:'Vos équipes scannent le QR depuis leur téléphone. Vous suivez tout en temps réel.',icon:'chart'},
            ].map((s,i)=>(
              <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'24px 20px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:16,right:16,fontSize:32,fontWeight:900,color:`${A}08`,letterSpacing:'-.04em',lineHeight:1}}>{s.n}</div>
                <div style={{width:40,height:40,borderRadius:12,background:'#e8f2fd',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <Icon name={s.icon} size={18} color={A}/>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:8}}>{s.title}</div>
                <div style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTEURS GRID */}
      <section style={{background:SURF,borderTop:`1px solid ${BORDER}`,padding:isMobile?'44px 20px':'56px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Secteurs</div>
            <h2 style={{fontSize:isMobile?24:32,fontWeight:800,color:TEXT,letterSpacing:'-.04em',marginBottom:8}}>Pour tous les professionnels</h2>
            <p style={{fontSize:14,color:TEXT2}}>Kronvo s'adapte à votre secteur avec les postes et termes qui vous correspondent</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(5,1fr)',gap:8}}>
            {[{icon:'🍽️',label:'Restaurants'},{icon:'🏨',label:'Hôtels'},{icon:'🏥',label:'Cliniques'},{icon:'🔧',label:'Garages'},{icon:'🏪',label:'Commerce'},{icon:'💆',label:'Spas & Salons'},{icon:'🏗️',label:'BTP'},{icon:'📦',label:'Logistique'},{icon:'🎓',label:'Éducation'},{icon:'🛡️',label:'Sécurité'}].map(s=>(
              <div key={s.label} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:12,padding:'14px 12px',textAlign:'center',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=A;e.currentTarget.style.background='#f0f6ff'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.background=BG}}>
                <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                <div style={{fontSize:12,fontWeight:600,color:TEXT2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATEUR ROI */}
      <section style={{background:'#f9fafb',borderTop:`1px solid ${BORDER}`,padding:isMobile?'52px 20px':'72px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Calculateur</div>
            <h2 style={{fontSize:isMobile?28:40,fontWeight:800,color:TEXT,letterSpacing:'-.04em',marginBottom:12}}>Combien perdez-vous chaque mois ?</h2>
            <p style={{fontSize:16,color:TEXT2,maxWidth:500,margin:'0 auto',lineHeight:1.7}}>Feuilles papier, appels inutiles, erreurs de paie — estimez le vrai coût avant Kronvo.</p>
          </div>
          <RoiCalc isMobile={isMobile}/>
        </div>
      </section>

      {/* FAQ */}
      <section style={{background:BG,borderTop:`1px solid ${BORDER}`,padding:isMobile?'52px 20px':'72px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Questions fréquentes</div>
            <h2 style={{fontSize:isMobile?28:40,fontWeight:800,color:TEXT,letterSpacing:'-.04em',marginBottom:12}}>On répond à tout</h2>
            <p style={{fontSize:16,color:TEXT2}}>Les réponses aux questions qu'on nous pose le plus souvent.</p>
          </div>
          <FaqSection/>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{background:'#0a0a0f',padding:isMobile?'64px 20px':'80px 0',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,113,227,.15) 0%,transparent 70%)',pointerEvents:'none'}}></div>
        <div style={{...W,textAlign:'center',position:'relative'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:20,background:'rgba(0,113,227,.15)',border:'1px solid rgba(0,113,227,.25)',marginBottom:28}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#34c759',boxShadow:'0 0 6px #34c759',display:'inline-block'}}></span>
            <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.7)'}}>Démo disponible cette semaine</span>
          </div>
          <h2 style={{fontSize:isMobile?32:48,fontWeight:900,color:'white',letterSpacing:'-.05em',marginBottom:18,lineHeight:1.06}}>
            Prêt à gagner du temps<br/>chaque jour ?
          </h2>
          <p style={{fontSize:isMobile?15:17,color:'rgba(255,255,255,.5)',marginBottom:40,lineHeight:1.7,maxWidth:480,margin:'0 auto 40px'}}>
            Rejoignez les professionnels qui ont simplifié la gestion de leurs équipes. Démo gratuite via Teams, sans engagement.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexDirection:isMobile?'column':'row',padding:isMobile?'0 20px':0}}>
            <button onClick={()=>goPage('contact')} style={{padding:'17px 32px',borderRadius:13,border:'none',background:A,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 28px rgba(0,113,227,.4)',display:'inline-flex',alignItems:'center',gap:10,justifyContent:'center'}}>
              Réserver ma démo gratuite <Icon name="arrow" size={16} color="white"/>
            </button>
            <button onClick={()=>setShowLogin(true)} style={{padding:'17px 24px',borderRadius:13,border:'1px solid rgba(255,255,255,.15)',background:'rgba(255,255,255,.05)',color:'rgba(255,255,255,.7)',fontSize:16,fontWeight:600,cursor:'pointer'}}>
              Déjà client — Se connecter
            </button>
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.3)',marginTop:20}}>Démo gratuite · Sans carte bancaire · Réponse sous 24h</div>
        </div>
      </section>
    </>
  )

  const PageFeatures=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'40px 20px':'56px 56px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Fonctionnalités</div>
          <h1 style={{fontSize:isMobile?30:48,fontWeight:900,color:TEXT,letterSpacing:'-.04em',marginBottom:12}}>Tout ce que Kronvo peut faire</h1>
          <p style={{fontSize:15,color:TEXT2,maxWidth:540,margin:'0 auto'}}>Une solution pensée pour les équipes terrain.</p>
        </div>
        {[
          {icon:'calendar',title:'Planning intelligent',color:'#e8f2fd',ic:A,items:['Shifts simples ou coupés configurables','Vue semaine sur desktop, jour par jour sur mobile','Postes personnalisables selon votre secteur','Publication du planning en un clic','Modification rapide par simple clic']},
          {icon:'qr',title:'Badgeage QR Code sécurisé',color:'#f0faf3',ic:'#1a6b35',items:['QR code dynamique renouvelé toutes les 30 secondes','Scan depuis le smartphone de chaque employé','Vérification que l\'employé appartient au bon établissement','Badgeage multiple dans la journée avec pauses','Borne tablette avec PIN sécurisé disponible']},
          {icon:'users',title:'Suivi des présences',color:'#fff8ee',ic:'#8a4a00',items:['Visualisation en temps réel de qui est présent','Comparaison heures planifiées vs heures pointées','Calcul automatique des écarts positifs et négatifs','Historique complet des pointages par date','Correction manuelle possible par le gérant']},
          {icon:'file',title:'Rapports et export PDF',color:'#fff2f1',ic:'#b02020',items:['Génération de rapports PDF professionnels','Filtrage par période semaine mois ou dates custom','Détail par employé avec toutes les entrées et sorties','Total heures planifiées vs pointées avec écarts','Export immédiat depuis le dashboard']},
          {icon:'phone',title:'Espace employé mobile',color:'#f0f0fc',ic:'#3a3880',items:['Application installable sur iPhone et Android','Planning personnel toujours à jour','Bouton de scan QR intégré dans l\'application','Historique complet des pointages personnels','Consultable hors connexion']},
          {icon:'building',title:'Multi-établissements',color:'#fdf0f8',ic:'#8a2060',items:['Gérez plusieurs sites depuis un seul tableau de bord','Données entièrement isolées par établissement','Dashboard super admin SwitzerIT','Ajout de nouveaux établissements en quelques minutes']},
        ].map((f,i)=>(
          <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:isMobile?'20px':'28px',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
              <div style={{width:52,height:52,background:f.color,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon name={f.icon} size={22} color={f.ic}/>
              </div>
              <div style={{fontSize:isMobile?18:22,fontWeight:800,color:TEXT}}>{f.title}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(200px,1fr))',gap:8}}>
              {f.items.map((item,j)=>(
                <div key={j} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'10px 12px',background:f.color,borderRadius:9}}>
                  <div style={{flexShrink:0,marginTop:1}}><Icon name="check" size={12} color={f.ic}/></div>
                  <span style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:`linear-gradient(135deg,#e8f2fd,#f0f0fc)`,borderRadius:16,padding:'32px',textAlign:'center',marginTop:8}}>
          <div style={{fontSize:22,fontWeight:800,color:TEXT,marginBottom:10}}>Fonctionnalités à venir</div>
          <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:20}}>
            {['Notifications email','Analytics avancées','Intégration logiciel paie','Messagerie équipe','Multi-langue'].map(f=>(
              <span key={f} style={{padding:'6px 14px',borderRadius:20,background:'rgba(0,113,227,.08)',border:'1px solid rgba(0,113,227,.15)',fontSize:12,fontWeight:600,color:A}}>{f}</span>
            ))}
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'12px 24px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
        </div>
      </div>
    </div>
  )

  const PagePricing=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'40px 20px':'56px 56px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Tarifs</div>
          <h1 style={{fontSize:isMobile?30:48,fontWeight:900,color:TEXT,letterSpacing:'-.04em',marginBottom:12}}>Tarification sur mesure</h1>
          <p style={{fontSize:15,color:TEXT2,maxWidth:520,margin:'0 auto',lineHeight:1.7}}>Chaque entreprise est unique. Devis personnalisé selon vos besoins. Démo gratuite via Teams incluse.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:16,marginBottom:24}}>
          {[
            {name:'Mise en place',icon:'zap',color:'#e8f2fd',ic:A,desc:'Installation et configuration complète par notre équipe SwitzerIT.',items:['Création compte et configuration','Paramétrage établissements','Import des employés','Installation borne tablette','Formation gérant','Documentation complète'],tag:'Sur devis',featured:false},
            {name:'Abonnement mensuel',icon:'chart',color:'#f0faf3',ic:'#1a6b35',desc:'Accès complet à Kronvo pour votre établissement.',items:['Planning et badgeage illimités','Tous les employés inclus','Rapports PDF complets','Support email réactif','Mises à jour automatiques','Hébergement sécurisé Suisse'],tag:'Sur devis · en CHF',featured:true},
            {name:'Support et maintenance',icon:'shield',color:'#fff8ee',ic:'#8a4a00',desc:"Accompagnement continu pour votre sérénité.",items:['Support prioritaire SwitzerIT','Intervention sous 4 heures','Formations supplémentaires','Évolutions personnalisées','Suivi trimestriel dédié','SLA garanti par contrat'],tag:'Options disponibles',featured:false},
          ].map((plan,i)=>(
            <div key={i} style={{background:SURF,border:plan.featured?`2px solid ${A}`:`1px solid ${BORDER}`,borderRadius:18,padding:'26px',display:'flex',flexDirection:'column',position:'relative',boxShadow:plan.featured?'0 8px 40px rgba(0,113,227,.12)':'none'}}>
              {plan.featured&&<div style={{position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',padding:'4px 16px',borderRadius:20,background:A,color:'white',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>RECOMMANDÉ</div>}
              <div style={{width:44,height:44,background:plan.color,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
                <Icon name={plan.icon} size={20} color={plan.ic}/>
              </div>
              <div style={{fontSize:18,fontWeight:800,color:TEXT,marginBottom:6}}>{plan.name}</div>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.6,marginBottom:16}}>{plan.desc}</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18,flex:1}}>
                {plan.items.map(f=>(
                  <div key={f} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:13,color:TEXT2}}>
                    <div style={{flexShrink:0,marginTop:2}}><Icon name="check" size={12} color={plan.ic}/></div>{f}
                  </div>
                ))}
              </div>
              <div style={{padding:'9px 14px',background:plan.color,borderRadius:9,fontSize:13,fontWeight:700,color:plan.ic,textAlign:'center',marginBottom:14}}>{plan.tag}</div>
              <button onClick={()=>goPage('contact')} style={{width:'100%',height:44,borderRadius:10,border:plan.featured?'none':`1.5px solid ${A}`,background:plan.featured?A:'transparent',color:plan.featured?'white':A,fontSize:13,fontWeight:700,cursor:'pointer'}}>Demander un devis</button>
            </div>
          ))}
        </div>
        <div style={{background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',borderRadius:16,padding:'24px 28px',display:'flex',alignItems:isMobile?'flex-start':'center',gap:20,flexDirection:isMobile?'column':'row'}}>
          <div style={{width:52,height:52,background:A,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Icon name="clock" size={24} color="white"/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:5}}>Démo gratuite via Teams</div>
            <div style={{fontSize:14,color:TEXT2,lineHeight:1.6}}>En 30 minutes, on vous présente Kronvo adapté à votre secteur. Vous voyez exactement ce que vous obtenez et repartez avec un devis personnalisé.</div>
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'13px 24px',borderRadius:11,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',flexShrink:0,width:isMobile?'100%':'auto'}}>Réserver ma démo →</button>
        </div>
      </div>
    </div>
  )

  const PageContact=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'40px 20px':'56px 56px'}}>
        <div style={{textAlign:'center',marginBottom:44}}>
          <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Contact</div>
          <h1 style={{fontSize:isMobile?30:46,fontWeight:900,color:TEXT,letterSpacing:'-.04em',marginBottom:12}}>Parlons de votre projet</h1>
          <p style={{fontSize:15,color:TEXT2,maxWidth:480,margin:'0 auto',lineHeight:1.7}}>Remplissez le formulaire. Nous vous recontactons sous 24h pour une démo Teams gratuite.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.2fr 1fr',gap:24}}>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:18,padding:'28px'}}>
            {contactSent?(
              <div style={{textAlign:'center',padding:'44px 20px'}}>
                <div style={{width:64,height:64,borderRadius:'50%',background:'#f0faf3',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                  <Icon name="check" size={28} color="#34c759"/>
                </div>
                <div style={{fontSize:22,fontWeight:800,color:TEXT,marginBottom:8}}>Demande envoyée !</div>
                <div style={{fontSize:15,color:TEXT2,lineHeight:1.7,marginBottom:20}}>Notre équipe SwitzerIT vous contactera sous 24h pour organiser votre démo Teams.</div>
                <button onClick={()=>{setContactSent(false);setContactForm({nom:'',email:'',entreprise:'',secteur:'',message:''})}} style={{padding:'10px 20px',borderRadius:9,border:`1px solid ${BORDER}`,background:BG,color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Nouvelle demande</button>
              </div>
            ):(
              <>
                <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:4}}>Demander une démo Teams</div>
                <div style={{fontSize:13,color:TEXT2,marginBottom:24}}>Gratuite · 30 minutes · Sans engagement</div>
                {[{f:'nom',l:'Nom complet *',ph:'Jean Dupont',t:'text'},{f:'email',l:'Email professionnel *',ph:'jean@exemple.fr',t:'email'},{f:'entreprise',l:"Nom de l'établissement *",ph:'Mon Établissement',t:'text'}].map(({f,l,ph,t})=>(
                  <div key={f} style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:6}}>{l}</label>
                    <input type={t} placeholder={ph} value={contactForm[f]} onChange={e=>setContactForm(ff=>({...ff,[f]:e.target.value}))} style={inp}
                    onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                  </div>
                ))}
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:6}}>Secteur</label>
                  <select value={contactForm.secteur} onChange={e=>setContactForm(f=>({...f,secteur:e.target.value}))} style={{...inp,appearance:'auto'}}>
                    <option value="">Sélectionner...</option>
                    {['Restaurant','Hôtel','Garage','Commerce','Clinique','Spa & Salon','BTP','Logistique','Éducation','Autre'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:24}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:6}}>Message (optionnel)</label>
                  <textarea placeholder="Nombre d'employés, besoin spécifique..." value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} rows={3}
                  style={{...inp,resize:'vertical',fontFamily:'var(--font)'}}
                  onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                </div>
                <button onClick={()=>{if(!contactForm.nom||!contactForm.email||!contactForm.entreprise){alert('Remplis les champs obligatoires');return}setContactSent(true)}}
                style={{width:'100%',height:52,borderRadius:12,border:'none',background:A,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.2)'}}>
                  Envoyer ma demande →
                </button>
                <div style={{fontSize:12,color:TEXT3,textAlign:'center',marginTop:10}}>Réponse sous 24h ouvrées · Démo Teams offerte</div>
              </>
            )}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#0a0a0f',borderRadius:16,padding:'24px',color:'white'}}>
              <div style={{width:44,height:44,borderRadius:12,background:'rgba(0,113,227,.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
                <Icon name="clock" size={20} color={A}/>
              </div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Démo Teams gratuite</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.7}}>30 minutes pour voir Kronvo en action, adapté à votre secteur. Posez vos questions et repartez avec un devis.</div>
            </div>
            {[{icon:'zap',title:'Mise en place par SwitzerIT',desc:"Notre équipe s'occupe de tout. Vous n'avez rien à faire."},{icon:'shield',title:'Facturation en CHF',desc:'Tarification locale, sans conversion ni frais cachés.'}].map((info,i)=>(
              <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:13,padding:'18px',display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{width:40,height:40,background:'#e8f2fd',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Icon name={info.icon} size={18} color={A}/>
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:4}}>{info.title}</div>
                  <div style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{info.desc}</div>
                </div>
              </div>
            ))}
            <div style={{background:'#f0f6ff',border:'1px solid rgba(0,113,227,.15)',borderRadius:13,padding:'18px'}}>
              <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>Déjà client ?</div>
              <div style={{fontSize:13,color:TEXT2,marginBottom:12}}>Connectez-vous à votre espace gérant.</div>
              <button onClick={()=>setShowLogin(true)} style={{padding:'9px 18px',borderRadius:8,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Se connecter →</button>
            </div>
            <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:13,padding:'18px'}}>
              <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:10}}>Contact direct</div>
              <div style={{fontSize:13,color:TEXT2,marginBottom:6}}>📧 contact@switzerit.com</div>
              <div style={{fontSize:13,color:TEXT2,marginBottom:6}}>🌐 switzerit.com</div>
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
        {h:"4. Base légale",t:"Exécution du contrat, intérêt légitime."},
        {h:"5. Conservation",t:"Durée du contrat + 3 ans pour la facturation. Données de pointage conservées 5 ans."},
        {h:"6. Partage",t:"Les données ne sont jamais vendues. Partagées uniquement avec nos sous-traitants (Supabase, Vercel) avec garanties contractuelles."},
        {h:"7. Vos droits",t:"Conformément à la LPD suisse et au RGPD, vous disposez des droits d'accès, rectification, effacement, portabilité. Contact : contact@switzerit.com"},
        {h:"8. Sécurité",t:"Données chiffrées en transit et au repos. Authentification sécurisée."},
      ]},
      rgpd:{title:"Conformité RGPD",last:"11 mai 2026",content:[
        {h:"Engagement",t:"Kronvo respecte le RGPD (UE 2016/679) pour les utilisateurs UE, ainsi que la nLPD suisse."},
        {h:"Données traitées",t:"Noms et prénoms des employés, emails professionnels, données de badgeage, informations sur le poste."},
        {h:"Conservation",t:"Employés actifs : durée du contrat. Facturation : 10 ans. Logs sécurité : 12 mois."},
        {h:"Sous-traitants",t:"Supabase Inc. (USA - clauses contractuelles types), Vercel Inc. (USA - clauses contractuelles types)."},
        {h:"Transferts hors UE",t:"Encadrés par des clauses contractuelles types approuvées par la Commission Européenne."},
        {h:"Contact DPO",t:"contact@switzerit.com — réponse sous 30 jours."},
        {h:"Réclamation",t:"Auprès du PFPDT (Suisse) ou de l'autorité de contrôle de votre pays UE."},
      ]},
      cookies:{title:"Politique de Cookies",last:"11 mai 2026",content:[
        {h:"Cookies nécessaires",t:"Cookies d'authentification, préférences, sécurité CSRF. Ils ne peuvent pas être désactivés."},
        {h:"Cookies fonctionnels",t:"Établissement sélectionné, état de la borne, préférences d'affichage."},
        {h:"Cookies analytiques",t:"Nous n'utilisons pas de cookies analytiques tiers."},
        {h:"Gestion",t:"Contrôlables via les paramètres de votre navigateur."},
        {h:"Durée",t:"Session : supprimés à la fermeture. Persistants : maximum 12 mois."},
      ]},
    }
    const s=sections[legalSection]
    return (
      <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
        <div style={{...W,padding:isMobile?'28px 20px':'56px 56px'}}>
          {isMobile?(
            <>
              <div style={{display:'flex',gap:8,marginBottom:20,overflowX:'auto',paddingBottom:4}}>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{padding:'8px 16px',borderRadius:20,border:'none',background:legalSection===id?A:'transparent',color:legalSection===id?'white':TEXT2,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{label}</button>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'24px'}}>
                <div style={{fontSize:11,color:TEXT3,marginBottom:6}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:24,fontWeight:900,color:TEXT,marginBottom:20}}>{s.title}</h1>
                {s.content.map((block,i)=>(<div key={i} style={{marginBottom:20}}><h2 style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>{block.h}</h2><p style={{fontSize:13,color:TEXT2,lineHeight:1.7,margin:0}}>{block.t}</p></div>))}
                <div style={{marginTop:24,padding:'14px 16px',background:'#e8f2fd',borderRadius:10,fontSize:13,color:A}}><strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a></div>
              </div>
            </>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:28,alignItems:'start'}}>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'18px 14px',position:'sticky',top:72}}>
                <div style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:14}}>Légal</div>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'none',background:legalSection===id?'#e8f2fd':'transparent',color:legalSection===id?A:TEXT2,fontSize:13,fontWeight:legalSection===id?600:400,cursor:'pointer',textAlign:'left',marginBottom:3,display:'block'}}>{label}</button>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'36px'}}>
                <div style={{fontSize:11,color:TEXT3,marginBottom:8}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:28,fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:24}}>{s.title}</h1>
                {s.content.map((block,i)=>(<div key={i} style={{marginBottom:24}}><h2 style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:8}}>{block.h}</h2><p style={{fontSize:14,color:TEXT2,lineHeight:1.75,margin:0}}>{block.t}</p></div>))}
                <div style={{marginTop:32,padding:'16px 20px',background:'#e8f2fd',borderRadius:12,fontSize:13,color:A}}><strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a></div>
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
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:SURF,borderRadius:22,padding:isMobile?'24px 20px':36,width:'100%',maxWidth:380,boxShadow:'0 32px 80px rgba(0,0,0,.2)',border:`1px solid ${BORDER}`,position:'relative'}}>
            <button onClick={()=>setShowLogin(false)} style={{position:'absolute',top:16,right:16,width:32,height:32,borderRadius:'50%',border:`1px solid ${BORDER}`,background:BG,color:TEXT2,fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:14}}>{LOGO_SM}</div>
              <div style={{fontSize:21,fontWeight:800,color:TEXT,letterSpacing:'-.03em'}}>Connexion</div>
              <div style={{fontSize:13,color:TEXT2,marginTop:4}}>Accédez à votre espace Kronvo</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:6}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required style={inp}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              <div style={{marginBottom:22}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:6}}>Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={inp}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              {error&&<div style={{padding:'10px 14px',background:'#fff2f1',border:'1px solid rgba(255,59,48,.2)',borderRadius:10,fontSize:13,color:'#b02020',marginBottom:16,fontWeight:600}}>{error}</div>}
              <button type="submit" style={{width:'100%',height:52,borderRadius:12,border:'none',background:A,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.3)'}}>Se connecter</button>
            </form>
            <div style={{textAlign:'center',marginTop:16}}>
              <span style={{fontSize:13,color:TEXT3}}>Pas encore client ? </span>
              <span style={{fontSize:13,color:A,fontWeight:600,cursor:'pointer'}} onClick={()=>{setShowLogin(false);goPage('contact')}}>Demander une démo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
