import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

// ── LOGO ──────────────────────────────────────────────────────────────
const LOGO_SM = (
  <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
    <rect width="34" height="34" rx="9" fill="#0066cc"/>
    <path d="M10 9v16M10 17l7-8M10 17l8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="17" r="2.5" fill="white"/>
  </svg>
)

// ── ICONS SVG ─────────────────────────────────────────────────────────
const IcoCalendar = ({c='#0066cc'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
const IcoQR = ({c='#7c3aed'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="5" y="5" width="3" height="3" fill={c}/><rect x="16" y="5" width="3" height="3" fill={c}/><rect x="5" y="16" width="3" height="3" fill={c}/><path d="M14 14h3v3h-3zM17 17h4M17 14v4"/></svg>
const IcoUsers = ({c='#16a34a'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoPhone = ({c='#ea580c'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
const IcoFile = ({c='#0891b2'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>
const IcoBuilding = ({c='#be185d'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M3 9h6M3 15h6M15 9h3M15 15h3"/></svg>
const IcoChk = ({size=14,c='#0066cc'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoArr = ({size=16,c='white'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const IcoShield = ({c='#0066cc'}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoZap = ({c='#0066cc'}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcoClock = ({c='#0066cc'}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

// ── ANIMATIONS ────────────────────────────────────────────────────────
function HeroReveal({children,delay=0}) {
  const [v,setV]=useState(false)
  useEffect(()=>{const t=setTimeout(()=>setV(true),delay);return()=>clearTimeout(t)},[])
  return <div style={{opacity:v?1:0,transform:v?'none':'translateY(18px)',transition:`opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1)`}}>{children}</div>
}
function Reveal({children,delay=0}) {
  const ref=useRef(null)
  const [v,setV]=useState(false)
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);obs.disconnect()}},{threshold:0.08})
    obs.observe(el);return()=>obs.disconnect()
  },[])
  return <div ref={ref} style={{opacity:v?1:0,transform:v?'none':'translateY(20px)',transition:`opacity .9s cubic-bezier(.16,1,.3,1) ${delay}ms,transform .9s cubic-bezier(.16,1,.3,1) ${delay}ms`}}>{children}</div>
}

// ── QR ANIMÉ ──────────────────────────────────────────────────────────
function QRDisplay() {
  const [seed,setSeed]=useState(0)
  const [prog,setProg]=useState(0)
  const [fade,setFade]=useState(false)
  useEffect(()=>{
    let p=0
    const iv=setInterval(()=>{
      p+=100/300
      if(p>=100){setFade(true);setTimeout(()=>{setSeed(s=>s+1);setProg(0);setFade(false);p=0},300)}
      else setProg(p)
    },100)
    return()=>clearInterval(iv)
  },[])
  const rng=(x,y,s)=>((x*7+y*13+s*31)%17>7)
  const sz=11,cs=5,tot=sz*cs+(sz-1)
  const cells=[]
  for(let r=0;r<sz;r++)for(let c=0;c<sz;c++)cells.push({r,c,v:rng(r,c,seed)})
  const isFixed=(r,c)=>(r<3&&c<3)||(r<3&&c>=sz-3)||(r>=sz-3&&c<3)
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
      <div style={{background:'white',borderRadius:6,padding:8,opacity:fade?.2:1,transition:fade?'opacity .25s':'none',border:'1px solid #e5e5e5',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <svg width={tot} height={tot} viewBox={`0 0 ${tot} ${tot}`}>
          {cells.map(({r,c,v})=>{
            const x=c*(cs+1),y=r*(cs+1)
            const fill=isFixed(r,c)?(r===0||r===2||c===0||c===2||(r>=sz-3&&(c===0||c===2))?'#111':'white'):(v?'#111':'white')
            return <rect key={`${r}-${c}`} x={x} y={y} width={cs} height={cs} rx={0.5} fill={fill}/>
          })}
        </svg>
      </div>
      <div style={{width:72}}>
        <div style={{height:2,background:'#e5e5e5',borderRadius:1}}>
          <div style={{height:'100%',background:'#0066cc',borderRadius:1,width:`${prog}%`,transition:'width .1s linear'}}/>
        </div>
        <div style={{fontSize:9,color:'#aaa',textAlign:'center',marginTop:3,fontWeight:500}}>Renouvellement {Math.ceil(30-(prog*30/100))}s</div>
      </div>
    </div>
  )
}

// ── CALCULATEUR ROI ───────────────────────────────────────────────────
function RoiCalc({isMobile}) {
  const [emp,setEmp]=useState(10)
  const [hrs,setHrs]=useState(3)
  const p=emp*hrs*4,c=p*60,e=c*12
  return (
    <div style={{background:'white',border:'1px solid #e8e8e8',borderRadius:20,padding:isMobile?'24px':'40px',maxWidth:640,margin:'0 auto',boxShadow:'0 4px 24px rgba(0,0,0,.04)'}}>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:24,marginBottom:28}}>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#444',marginBottom:10}}>Nombre d'employés — <strong style={{color:'#111'}}>{emp}</strong></label>
          <input type="range" min="2" max="80" value={emp} onChange={ev=>setEmp(Number(ev.target.value))} style={{width:'100%',accentColor:'#0066cc',cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#bbb',marginTop:4}}><span>2</span><span>80</span></div>
        </div>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#444',marginBottom:10}}>Heures perdues / semaine — <strong style={{color:'#111'}}>{hrs}h</strong></label>
          <input type="range" min="1" max="15" value={hrs} onChange={ev=>setHrs(Number(ev.target.value))} style={{width:'100%',accentColor:'#0066cc',cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#bbb',marginTop:4}}><span>1h</span><span>15h</span></div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
        {[{v:`${p}h`,l:'perdues/mois',bg:'#fef2f2',bc:'#fecaca',c:'#dc2626'},{v:c.toLocaleString('fr-CH'),l:'CHF perdus/mois',bg:'#fff7ed',bc:'#fed7aa',c:'#ea580c'},{v:e.toLocaleString('fr-CH'),l:'CHF économisés/an',bg:'#f0fdf4',bc:'#bbf7d0',c:'#16a34a'}].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.bc}`,borderRadius:14,padding:'18px 12px',textAlign:'center'}}>
            <div style={{fontSize:isMobile?20:26,fontWeight:900,color:s.c,letterSpacing:'-.02em'}}>{s.v}</div>
            <div style={{fontSize:11,color:s.c,marginTop:5,fontWeight:500,opacity:.8}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:'#f0f7ff',border:'1px solid #d0e8ff',borderRadius:12,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <span style={{fontSize:13,color:'#0052a3',fontWeight:500}}>Économie estimée : <strong>{e.toLocaleString('fr-CH')} CHF/an</strong> pour {emp} employés</span>
        <a href="/contact" style={{padding:'9px 18px',borderRadius:9,background:'#0066cc',color:'white',fontSize:13,fontWeight:700,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6}}>Obtenir mon devis <IcoArr size={13}/></a>
      </div>
    </div>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────
function FaqSection() {
  const [open,setOpen]=useState(null)
  const faqs=[
    {q:"Combien de temps prend la mise en place ?",a:"En moyenne 2 à 4 heures avec notre équipe SwitzerIT. Configuration, import des employés, installation de la borne et formation. Vous n'avez rien à faire techniquement."},
    {q:"Faut-il une tablette pour le badgeage ?",a:"Non, c'est optionnel. Vos employés scannent depuis leur smartphone. La borne tablette fixe est recommandée pour les établissements avec une entrée unique."},
    {q:"Un employé a oublié de badger — que faire ?",a:"Le gérant corrige manuellement les pointages depuis son tableau de bord. L'historique complet est conservé pour chaque employé."},
    {q:"Nos données sont-elles sécurisées ?",a:"Oui. Données chiffrées en transit et au repos. Chaque établissement a ses données isolées. Conforme au RGPD et à la LPD suisse."},
    {q:"Peut-on personnaliser les postes ?",a:"Oui, chaque établissement configure ses propres postes. Restaurant : Cuisine, Salle, Bar. Clinique : Médecin, Infirmier, Accueil."},
    {q:"Y a-t-il un engagement minimum ?",a:"Non. Sans engagement de durée. Arrêt avec un préavis de 30 jours. La démo est gratuite et sans obligation."},
    {q:"Comment fonctionne le support ?",a:"Support assuré par l'équipe SwitzerIT — des humains. Réponse par email sous 24h ouvrées."},
  ]
  return (
    <div style={{maxWidth:620,margin:'0 auto'}}>
      {faqs.map((faq,i)=>(
        <div key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 0',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:16}}>
            <span style={{fontSize:15,fontWeight:600,color:'#111',lineHeight:1.4}}>{faq.q}</span>
            <span style={{fontSize:20,color:'#0066cc',flexShrink:0,fontWeight:300,transform:open===i?'rotate(45deg)':'none',transition:'transform .2s',display:'inline-block',lineHeight:1}}>{open===i?'−':'+'}</span>
          </button>
          {open===i&&<div style={{paddingBottom:18}}><p style={{fontSize:14,color:'#555',lineHeight:1.8,margin:0}}>{faq.a}</p></div>}
        </div>
      ))}
      <div style={{textAlign:'center',marginTop:28,paddingTop:20}}>
        <span style={{fontSize:14,color:'#888'}}>Une autre question ? </span>
        <a href="/contact" style={{fontSize:14,color:'#0066cc',fontWeight:600,textDecoration:'none'}}>On vous répond →</a>
      </div>
    </div>
  )
}

// ── CONTACT FORM isolé ────────────────────────────────────────────────
function ContactForm({goPage,setShowLogin}) {
  const [form,setForm]=useState({nom:'',email:'',entreprise:'',secteur:'',message:''})
  const [sent,setSent]=useState(false)
  const [errs,setErrs]=useState({})
  const inp={width:'100%',padding:'12px 14px',borderRadius:10,border:'1.5px solid #e5e5e5',background:'#fafafa',fontSize:14,color:'#111',outline:'none',boxSizing:'border-box',transition:'border-color .2s'}
  const submit=(e)=>{
    e.preventDefault()
    const er={}
    if(!form.nom)er.nom=true
    if(!form.email)er.email=true
    if(!form.entreprise)er.entreprise=true
    if(Object.keys(er).length){setErrs(er);return}
    setSent(true)
  }
  if(sent) return (
    <div style={{textAlign:'center',padding:'52px 20px'}}>
      <div style={{width:68,height:68,borderRadius:'50%',background:'#f0fdf4',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 22px'}}>
        <IcoChk size={30} c="#16a34a"/>
      </div>
      <div style={{fontSize:22,fontWeight:800,color:'#111',marginBottom:10}}>Demande envoyée !</div>
      <div style={{fontSize:14,color:'#666',lineHeight:1.8,marginBottom:22}}>Notre équipe vous contacte sous 24h pour organiser la démo Teams.</div>
      <button onClick={()=>{setSent(false);setForm({nom:'',email:'',entreprise:'',secteur:'',message:''});setErrs({})}} style={{padding:'10px 22px',borderRadius:9,border:'1.5px solid #e5e5e5',background:'white',color:'#555',fontSize:13,fontWeight:600,cursor:'pointer'}}>Nouvelle demande</button>
    </div>
  )
  return (
    <>
      <div style={{fontSize:18,fontWeight:800,color:'#111',marginBottom:5}}>Demander une démo Teams</div>
      <div style={{fontSize:13,color:'#888',marginBottom:24}}>Gratuite · 30 min · Sans engagement</div>
      {[{f:'nom',l:'Nom complet *',ph:'Jean Dupont',t:'text'},{f:'email',l:'Email *',ph:'jean@exemple.fr',t:'email'},{f:'entreprise',l:'Établissement *',ph:'Mon Établissement',t:'text'}].map(({f,l,ph,t})=>(
        <div key={f} style={{marginBottom:14}}>
          <label style={{display:'block',fontSize:12,fontWeight:600,color:'#555',marginBottom:6}}>{l}</label>
          <input type={t} placeholder={ph} value={form[f]}
            onChange={ev=>{setForm(ff=>({...ff,[f]:ev.target.value}));setErrs(er=>({...er,[f]:false}))}}
            style={{...inp,borderColor:errs[f]?'#ef4444':'#e5e5e5'}}
            onFocus={e=>e.target.style.borderColor='#0066cc'}
            onBlur={e=>e.target.style.borderColor=errs[f]?'#ef4444':'#e5e5e5'}/>
          {errs[f]&&<div style={{fontSize:11,color:'#ef4444',marginTop:3}}>Champ requis</div>}
        </div>
      ))}
      <div style={{marginBottom:14}}>
        <label style={{display:'block',fontSize:12,fontWeight:600,color:'#555',marginBottom:6}}>Secteur</label>
        <select value={form.secteur} onChange={e=>setForm(f=>({...f,secteur:e.target.value}))} style={{...inp,appearance:'auto'}}>
          <option value="">Sélectionner...</option>
          {['Restaurant','Hôtel','Garage','Commerce','Clinique','Spa & Salon','BTP','Logistique','Éducation','Autre'].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{marginBottom:24}}>
        <label style={{display:'block',fontSize:12,fontWeight:600,color:'#555',marginBottom:6}}>Message (optionnel)</label>
        <textarea placeholder="Nombre d'employés, besoin spécifique..." value={form.message}
          onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={3}
          style={{...inp,resize:'vertical',fontFamily:'var(--font)'}}
          onFocus={e=>e.target.style.borderColor='#0066cc'} onBlur={e=>e.target.style.borderColor='#e5e5e5'}/>
      </div>
      <button onClick={submit} style={{width:'100%',height:52,borderRadius:12,border:'none',background:'#0066cc',color:'white',fontSize:15,fontWeight:700,cursor:'pointer',transition:'opacity .15s'}}
      onMouseEnter={e=>e.currentTarget.style.opacity='.88'}
      onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
        Envoyer ma demande →
      </button>
      <div style={{fontSize:11,color:'#aaa',textAlign:'center',marginTop:10}}>Réponse sous 24h · Démo Teams offerte</div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════
export default function Login() {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [showLogin,setShowLogin]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [legalSection,setLegalSection]=useState('cgu')
  const [isMobile,setIsMobile]=useState(window.innerWidth<900)
  const navigate=useNavigate()
  const location=useLocation()

  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<900);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[])
  useEffect(()=>{
    supabase.auth.getSession().then(async({data})=>{
      if(data.session){
        const {data:p}=await supabase.from('profils').select('role').eq('user_id',data.session.user.id).single()
        if(p?.role==='super_admin')navigate('/admin')
        else if(p?.role==='gerant')navigate('/gerant')
        else navigate('/moi')
      } else {setLoading(false);if(location.pathname==='/login')setShowLogin(true)}
    })
  },[])

  // Bloquer le scroll du body quand la modale est ouverte
  useEffect(()=>{
    if(showLogin){
      document.body.style.overflow='hidden'
      document.body.style.position='fixed'
      document.body.style.width='100%'
    } else {
      document.body.style.overflow=''
      document.body.style.position=''
      document.body.style.width=''
    }
    return()=>{
      document.body.style.overflow=''
      document.body.style.position=''
      document.body.style.width=''
    }
  },[showLogin])

  async function handleLogin(e){
    e.preventDefault();setLoading(true);setError('')
    const {data,error}=await supabase.auth.signInWithPassword({email,password})
    if(error){setError('Email ou mot de passe incorrect');setLoading(false);return}
    const {data:p}=await supabase.from('profils').select('role').eq('user_id',data.user.id).single()
    if(p?.role==='super_admin')navigate('/admin')
    else if(p?.role==='gerant')navigate('/gerant')
    else navigate('/moi')
    setLoading(false)
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'white',color:'#aaa',fontFamily:'var(--font)'}}>Chargement...</div>

  // ── DESIGN TOKENS ──────────────────────────────────────────────────
  const A='#0066cc'       // bleu accent
  const AG='#f0f7ff'      // bleu très clair
  const AB='#d0e8ff'      // bleu border
  const TEXT='#111111'
  const TEXT2='#555555'
  const TEXT3='#999999'
  const BORDER='#e8e8e8'
  const BG='#f8fafc'
  const SURF='#ffffff'

  const W={maxWidth:1020,margin:'0 auto',padding:isMobile?'0 20px':'0 48px'}
  const WM={maxWidth:1020,margin:'0 auto',padding:isMobile?'0 20px':'0 48px'}
  const SEC=isMobile?'56px 20px':'80px 0'

  const scrollTop=()=>{setTimeout(()=>window.scrollTo({top:0,left:0,behavior:'instant'}),20)}
  const pageMap={'home':'/','fonctionnalites':'/fonctionnalites','tarifs':'/tarifs','contact':'/contact','legal':'/legal'}
  const goPage=(p)=>{navigate(pageMap[p]||'/'+p);setMenuOpen(false);scrollTop()}
  const path=location.pathname.replace('/','') || 'home'
  const page=path==='login'?'home':path||'home'

  // ── NAV ────────────────────────────────────────────────────────────
  const Nav=()=>(
    <>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:62,background:'rgba(255,255,255,.97)',backdropFilter:'blur(20px)',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',padding:'0 40px'}}>
        <div onClick={()=>goPage('home')} style={{display:'flex',alignItems:'center',gap:9,flex:1,cursor:'pointer',userSelect:'none'}}>
          {LOGO_SM}
          <span style={{fontSize:17,fontWeight:800,color:TEXT,letterSpacing:'-.04em'}}>Kronvo</span>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:AG,color:A,letterSpacing:'.04em',marginLeft:2,border:`1px solid ${AB}`}}>BETA</span>
        </div>
        {isMobile?(
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowLogin(true)} style={{padding:'8px 16px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Connexion</button>
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{width:38,height:38,borderRadius:9,border:`1px solid ${BORDER}`,background:SURF,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4.5}}>
              {[0,1,2].map(i=><span key={i} style={{width:15,height:1.5,background:'#333',borderRadius:1,display:'block'}}></span>)}
            </button>
          </div>
        ):(
          <div style={{display:'flex',gap:1,alignItems:'center'}}>
            {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([l,id])=>(
              <button key={id} onClick={()=>goPage(id)} style={{padding:'7px 15px',borderRadius:9,border:'none',background:page===id?AG:'transparent',color:page===id?A:TEXT2,fontSize:13,fontWeight:page===id?600:500,cursor:'pointer',transition:'all .15s'}}>{l}</button>
            ))}
            <div style={{width:1,height:18,background:BORDER,margin:'0 14px'}}/>
            <button onClick={()=>setShowLogin(true)} style={{padding:'8px 18px',borderRadius:9,border:`1px solid ${BORDER}`,background:SURF,color:TEXT2,fontSize:13,fontWeight:500,cursor:'pointer',transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#aaa'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER}}>Connexion</button>
            <button onClick={()=>goPage('contact')} style={{padding:'8px 18px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',marginLeft:6,transition:'opacity .15s'}}
            onMouseEnter={e=>e.currentTarget.style.opacity='.88'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Demander une démo</button>
          </div>
        )}
      </nav>
      {isMobile&&menuOpen&&(
        <div style={{position:'fixed',top:62,left:0,right:0,zIndex:99,background:SURF,boxShadow:'0 8px 24px rgba(0,0,0,.06)',padding:'8px 0 18px'}}>
          {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([l,id])=>(
            <button key={id} onClick={()=>goPage(id)} style={{width:'100%',padding:'13px 24px',border:'none',background:'transparent',color:TEXT,fontSize:14,fontWeight:500,cursor:'pointer',textAlign:'left',display:'block'}}>{l}</button>
          ))}
          <div style={{margin:'8px 20px 0',paddingTop:12,borderTop:`1px solid ${BORDER}`}}>
            <button onClick={()=>{goPage('contact');setMenuOpen(false)}} style={{width:'100%',padding:'14px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
          </div>
        </div>
      )}
    </>
  )

  // ── FOOTER ─────────────────────────────────────────────────────────
  const Footer=()=>(
    <footer style={{background:TEXT,color:'white',padding:isMobile?'52px 20px 32px':'64px 0 36px'}}>
      <div style={W}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2.5fr 1fr 1fr 1fr',gap:isMobile?28:48,marginBottom:40}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:16}}>{LOGO_SM}<span style={{fontSize:15,fontWeight:800,color:'white',letterSpacing:'-.03em'}}>Kronvo</span></div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.85,maxWidth:230,marginBottom:16}}>La solution de gestion d'équipes pour les professionnels terrain. Propulsé par SwitzerIT.</div>
            <div style={{display:'flex',gap:8}}>
              {[{l:'🇨🇭',t:'Suisse'},{l:'🔒',t:'RGPD'},{l:'⚡',t:'2-4h setup'}].map(b=>(
                <span key={b.t} style={{fontSize:11,padding:'4px 9px',borderRadius:20,background:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.5)',border:'1px solid rgba(255,255,255,.1)'}}>{b.l} {b.t}</span>
              ))}
            </div>
          </div>
          {[
            {title:'Produit',links:[['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']]},
            {title:'Support',links:[['Contact','contact'],['Démo Teams','contact']]},
            {title:'Légal',links:[['CGU','legal'],['Confidentialité','legal'],['RGPD','legal']]},
          ].map(col=>(
            <div key={col.title}>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.25)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:16}}>{col.title}</div>
              {col.links.map(([l,p])=>(
                <div key={l} onClick={()=>goPage(p)} style={{fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:11,cursor:'pointer',transition:'color .15s'}}
                onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.75)'}
                onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:20,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,.25)'}}>© 2026 Kronvo by SwitzerIT · Suisse</div>
          <div style={{display:'flex',gap:18,fontSize:11}}>
            {[['Confidentialité','legal'],['CGU','legal'],['RGPD','legal']].map(([l,p])=>(
              <span key={l} onClick={()=>goPage(p)} style={{color:'rgba(255,255,255,.25)',cursor:'pointer'}}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )

  // ══ PAGE HOME ═══════════════════════════════════════════════════════
  const PageHome=()=>(
    <>
      {/* 1. HERO */}
      <section style={{paddingTop:62,background:SURF}}>
        <div style={{...W,padding:isMobile?'72px 20px 64px':'96px 56px 88px',display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center'}}>
          <div>
            <HeroReveal delay={80}>
              <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 13px',borderRadius:20,background:AG,border:`1px solid ${AB}`,marginBottom:28}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 0 2px rgba(34,197,94,.2)',display:'inline-block'}}></span>
                <span style={{fontSize:12,fontWeight:600,color:A}}>Badgeage QR · Planning · Présences</span>
              </div>
            </HeroReveal>
            <HeroReveal delay={180}>
              <h1 style={{fontSize:isMobile?38:62,fontWeight:900,lineHeight:1.03,margin:'0 0 6px',letterSpacing:'-.06em',color:TEXT}}>Le planning qui</h1>
              <h1 style={{fontSize:isMobile?38:62,fontWeight:900,lineHeight:1.03,margin:'0 0 24px',letterSpacing:'-.06em',color:A}}>se gère tout seul.</h1>
            </HeroReveal>
            <HeroReveal delay={300}>
              <p style={{fontSize:isMobile?15:17,color:TEXT2,lineHeight:1.8,marginBottom:36,maxWidth:400}}>
                Badgeage QR, présences en direct, export paie automatique. Tout ce dont votre équipe terrain a besoin — sans la paperasse.
              </p>
            </HeroReveal>
            <HeroReveal delay={400}>
              <div style={{display:'flex',gap:10,flexDirection:isMobile?'column':'row',marginBottom:28}}>
                <button onClick={()=>goPage('contact')} style={{padding:'15px 26px',borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:9,justifyContent:'center',boxShadow:'0 4px 20px rgba(0,102,204,.25)',transition:'transform .2s,box-shadow .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(0,102,204,.3)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,102,204,.25)'}}>
                  Demander une démo gratuite <IcoArr/>
                </button>
                <button onClick={()=>goPage('fonctionnalites')} style={{padding:'15px 20px',borderRadius:12,border:`1.5px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:15,fontWeight:600,cursor:'pointer',transition:'border-color .15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#999'}
                onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
                  Voir les fonctionnalités
                </button>
              </div>
              <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                {['Démo gratuite','Sans engagement','2-4h mise en place'].map(t=>(
                  <div key={t} style={{display:'flex',alignItems:'center',gap:6}}>
                    <IcoChk size={13}/>
                    <span style={{fontSize:13,color:TEXT3}}>{t}</span>
                  </div>
                ))}
              </div>
            </HeroReveal>
          </div>

          {!isMobile&&(
            <HeroReveal delay={120}>
              <div style={{background:'#f8fafc',borderRadius:20,padding:18,border:`1px solid ${BORDER}`,boxShadow:'0 8px 40px rgba(0,0,0,.06)'}}>
                {/* Barre titre */}
                <div style={{background:TEXT,borderRadius:12,padding:'11px 16px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'white'}}>Kronvo · Le Bistrot</div>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                      <span style={{width:5,height:5,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>
                      <span style={{fontSize:9,color:'rgba(255,255,255,.4)'}}>En direct</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:4}}>{['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{width:8,height:8,borderRadius:'50%',background:c}}></div>)}</div>
                </div>
                {/* Stats */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:10}}>
                  {[{v:'8',l:'Présents',bg:'#f0fdf4',bc:'#bbf7d0',c:'#16a34a'},{v:'3',l:'Absents',bg:'#fef2f2',bc:'#fecaca',c:'#dc2626'},{v:'2',l:'En pause',bg:'#fff7ed',bc:'#fed7aa',c:'#ea580c'}].map((s,i)=>(
                    <div key={i} style={{background:s.bg,border:`1px solid ${s.bc}`,borderRadius:9,padding:'10px 6px',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:900,color:s.c,letterSpacing:'-.03em'}}>{s.v}</div>
                      <div style={{fontSize:9,color:s.c,fontWeight:600,marginTop:2}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {/* Équipe */}
                <div style={{background:'white',border:`1px solid ${BORDER}`,borderRadius:10,padding:'10px',marginBottom:10}}>
                  <div style={{fontSize:9,fontWeight:700,color:TEXT3,letterSpacing:'.08em',marginBottom:8}}>ÉQUIPE EN DIRECT</div>
                  {[{n:'Sophie Martin',p:'Cuisine',h:'09:02',s:'#22c55e'},{n:'Marc Dupont',p:'Salle',h:'09:15',s:'#22c55e'},{n:'Julie Bernard',p:'Bar',h:'En pause',s:'#f97316'},{n:'Thomas Petit',p:'Cuisine',h:'Absent',s:'#e5e5e5'}].map((e,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'4px 7px',borderRadius:7,background:i%2===0?'#f8fafc':'transparent',marginBottom:2}}>
                      <div style={{width:25,height:25,borderRadius:'50%',background:AG,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:A,flexShrink:0,position:'relative'}}>
                        {e.n.split(' ').map(x=>x[0]).join('')}
                        <div style={{position:'absolute',bottom:0,right:0,width:6,height:6,borderRadius:'50%',background:e.s,border:'1.5px solid white'}}></div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:10,fontWeight:600,color:TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.n}</div>
                        <div style={{fontSize:8,color:TEXT3}}>{e.p}</div>
                      </div>
                      <span style={{fontSize:9,color:TEXT2,fontWeight:500}}>{e.h}</span>
                    </div>
                  ))}
                </div>
                {/* QR */}
                <div style={{background:'white',border:`1px solid ${BORDER}`,borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:12}}>
                  <QRDisplay/>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:TEXT,marginBottom:3}}>QR Code actif</div>
                    <div style={{fontSize:9,color:TEXT2,lineHeight:1.5}}>Vos employés scannent<br/>depuis leur téléphone</div>
                    <div style={{display:'flex',alignItems:'center',gap:4,marginTop:5}}>
                      <span style={{width:5,height:5,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>
                      <span style={{fontSize:8,color:'#16a34a',fontWeight:600}}>Sécurisé · Renouvelé auto</span>
                    </div>
                  </div>
                </div>
              </div>
            </HeroReveal>
          )}
        </div>
      </section>

      {/* 2+3. TRUST + STATS */}
      <section style={{background:"#f8fafc"}}> 
        <div style={{maxWidth:1020,margin:"0 auto",padding:isMobile?"0 20px":"0 48px"}}>
          <Reveal>
            {/* Ligne trust */}
            <div style={{padding:"16px 0 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:14,flexWrap:"wrap",marginBottom:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{display:"flex"}}>
                  {[{bg:AG,c:A,t:"SM"},{bg:"#f0fdf4",c:"#16a34a",t:"JD"},{bg:"#fff7ed",c:"#ea580c",t:"AL"}].map((a,i)=>(
                    <div key={i} style={{width:28,height:28,borderRadius:"50%",background:a.bg,border:"2px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:a.c,marginRight:i<2?-7:0,zIndex:3-i,boxShadow:"0 1px 3px rgba(0,0,0,.1)"}}>{a.t}</div>
                  ))}
                </div>
                <span style={{fontSize:13,color:"#555"}}>Des équipes terrain font confiance à <strong style={{color:"#111"}}>Kronvo</strong></span>
              </div>
              <div style={{width:1,height:16,background:"#e8e8e8"}}></div>
              <div style={{display:"flex",alignItems:"center",gap:4,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:20,padding:"4px 12px"}}>
                <span style={{color:"#f59e0b",fontSize:12}}>★★★★★</span>
                <span style={{fontSize:13,fontWeight:700,color:"#111"}}>4.8/5</span>
                <span style={{fontSize:11,color:"#999"}}>· SwitzerIT</span>
              </div>
            </div>
            {/* Stats en ligne bien visibles */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
              {[{v:"2-4h",l:"Mise en place",c:A,bg:AG},{v:"30s",l:"Par badgeage",c:"#16a34a",bg:"#f0fdf4"},{v:"8+",l:"Secteurs",c:"#ea580c",bg:"#fff7ed"},{v:"100%",l:"Mobile",c:"#7c3aed",bg:"#faf5ff"}].map((s,i)=>(
                <div key={i} style={{padding:"14px 0",textAlign:"center",borderRight:i<3?"1px solid #f0f0f0":"none",background:i===0?AG:"white"}}>
                  <div style={{fontSize:22,fontWeight:900,color:s.c,letterSpacing:"-.04em",lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:11,color:s.c,marginTop:3,fontWeight:500,opacity:.8}}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Bande défilante */}
            <div style={{position:"relative",overflow:"hidden",padding:"10px 0"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:40,background:"linear-gradient(to right,#fafafa,transparent)",zIndex:2,pointerEvents:"none"}}></div>
              <div style={{position:"absolute",right:0,top:0,bottom:0,width:40,background:"linear-gradient(to left,#fafafa,transparent)",zIndex:2,pointerEvents:"none"}}></div>
              <style>{`@keyframes kscroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
              <div style={{display:"flex",animation:"kscroll 28s linear infinite",width:"max-content"}}>
                {[["🍽️","Restaurants"],["🏨","Hôtels"],["🏥","Cliniques"],["🔧","Garages"],["🛒","Commerce"],["📦","Logistique"],["💆","Spas"],["🏗️","BTP"],["🎓","Éducation"],["🏪","Distribution"],["🍽️","Restaurants"],["🏨","Hôtels"],["🏥","Cliniques"],["🔧","Garages"],["🛒","Commerce"],["📦","Logistique"],["💆","Spas"],["🏗️","BTP"],["🎓","Éducation"],["🏪","Distribution"]].map(([e,t],i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 13px",background:"white",border:"1px solid #e8e8e8",borderRadius:100,whiteSpace:"nowrap",margin:"0 4px",fontSize:12,color:"#444",fontWeight:500,flexShrink:0,boxShadow:"0 1px 2px rgba(0,0,0,.04)"}}>
                    <span>{e}</span><span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      {/* 4. PHOTO + ACCROCHE */}
      <section style={{background:BG,padding:SEC}}>
        <div style={WM}>
          <div style={{display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:56,alignItems:'center'}}>
            <Reveal>
              <div style={{marginBottom:isMobile?32:0}}>
                <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14}}>Pourquoi Kronvo</div>
                <h2 style={{fontSize:isMobile?28:40,fontWeight:900,color:TEXT,letterSpacing:'-.05em',marginBottom:20,lineHeight:1.06}}>Arrêtez de perdre du temps sur des tâches qui n'apportent rien.</h2>
                <p style={{fontSize:15,color:TEXT2,lineHeight:1.8,marginBottom:28}}>Feuilles papier, appels incessants, erreurs de paie — tout ça a un coût réel chaque mois. Kronvo les remplace automatiquement en 2 à 4 heures.</p>
                {[
                  {c:'#dc2626',bg:'#fef2f2',bc:'#fecaca',t:'Feuilles de présence perdues',s:'→ Badgeage QR en 2 secondes'},
                  {c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa',t:'Appels pour savoir qui est là',s:'→ Dashboard en temps réel'},
                  {c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff',t:'Erreurs sur les bulletins de paie',s:'→ Export PDF automatique'},
                ].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,padding:'12px 14px',background:item.bg,border:`1px solid ${item.bc}`,borderRadius:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:item.c,textDecoration:'line-through',opacity:.7}}>{item.t}</div>
                      <div style={{fontSize:13,fontWeight:600,color:'#16a34a',marginTop:2}}>{item.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div style={{borderRadius:20,overflow:'hidden',boxShadow:'0 12px 48px rgba(0,0,0,.1)',border:`1px solid ${BORDER}`}}>
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80"
                  alt="Équipe restaurant"
                  style={{width:'100%',height:320,objectFit:'cover',display:'block'}}
                  onError={e=>{e.target.style.display='none'}}
                />
                <div style={{background:SURF,padding:'16px 20px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:AG,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:16}}>👨‍🍳</span>
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:TEXT}}>Restaurant Le Bistrot</div>
                    <div style={{fontSize:11,color:TEXT3}}>8 employés · Badgeage QR actif</div>
                  </div>
                  <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:20,padding:'4px 10px'}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>
                    <span style={{fontSize:11,color:'#16a34a',fontWeight:600}}>En direct</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. FONCTIONNALITÉS */}
      <section style={{background:SURF,padding:SEC}}>
        <div style={W}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:56}}>
              <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14}}>Fonctionnalités</div>
              <h2 style={{fontSize:isMobile?28:44,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:16,lineHeight:1.04}}>Tout ce dont vous avez besoin.</h2>
              <p style={{fontSize:16,color:TEXT2,maxWidth:440,margin:'0 auto',lineHeight:1.8}}>Une solution complète, sans complexité. Ça marche dès le premier jour.</p>
            </div>
          </Reveal>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:12}}>
            {[
              {Icon:IcoCalendar,bg:'#f0f7ff',bc:'#d0e8ff',c:A,title:'Planning intelligent',desc:'Créez et publiez les plannings en quelques clics. Shifts simples ou coupés. Postes adaptés à votre secteur.'},
              {Icon:IcoQR,bg:'#faf5ff',bc:'#e9d5ff',c:'#7c3aed',title:'Badgeage QR Code',desc:'QR dynamique renouvelé toutes les 30s. Scan depuis le téléphone. Borne tablette disponible.'},
              {Icon:IcoUsers,bg:'#f0fdf4',bc:'#bbf7d0',c:'#16a34a',title:'Présences en direct',desc:'Qui est là maintenant. Heures prévues vs pointées. Écarts calculés automatiquement.'},
              {Icon:IcoPhone,bg:'#fff7ed',bc:'#fed7aa',c:'#ea580c',title:'App mobile employé',desc:'Planning, badgeage, historique. Installable sur iPhone et Android.'},
              {Icon:IcoFile,bg:'#f0f9ff',bc:'#bae6fd',c:'#0891b2',title:'Export PDF paie',desc:'Rapports détaillés en un clic. Par employé, par période. Prêt pour votre comptable.'},
              {Icon:IcoBuilding,bg:'#fdf2f8',bc:'#fbcfe8',c:'#be185d',title:'Multi-établissements',desc:'Gérez plusieurs sites depuis un seul tableau de bord. Données isolées par site.'},
            ].map((f,i)=>(
              <Reveal key={i} delay={i*60}>
                <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'24px',transition:'transform .2s,box-shadow .2s,border-color .2s',height:'100%'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,.07)';e.currentTarget.style.borderColor=f.bc}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor=BORDER}}>
                  <div style={{width:44,height:44,borderRadius:12,background:f.bg,border:`1px solid ${f.bc}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                    <f.Icon c={f.c}/>
                  </div>
                  <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:8,letterSpacing:'-.01em'}}>{f.title}</div>
                  <div style={{fontSize:13,color:TEXT2,lineHeight:1.7}}>{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div style={{textAlign:'center',marginTop:28}}>
              <button onClick={()=>goPage('fonctionnalites')} style={{padding:'11px 22px',borderRadius:10,border:`1.5px solid ${BORDER}`,background:SURF,color:A,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=A;e.currentTarget.style.background=AG}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.background=SURF}}>
                Toutes les fonctionnalités →
              </button>
            </div>
          </Reveal>

          <Reveal>
            <div style={{marginTop:48,borderRadius:20,overflow:'hidden',border:`1px solid ${BORDER}`,boxShadow:'0 8px 32px rgba(0,0,0,.07)',position:'relative'}}>
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80" alt="Restaurant équipe"
                style={{width:'100%',height:isMobile?200:300,objectFit:'cover',display:'block'}} onError={e=>e.target.style.display='none'}/>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to right, rgba(0,0,0,.65) 0%, rgba(0,0,0,.1) 65%)',display:'flex',alignItems:'center',padding:isMobile?'20px':'48px'}}>
                <div>
                  <div style={{fontSize:isMobile?18:28,fontWeight:800,color:'white',letterSpacing:'-.03em',marginBottom:8,lineHeight:1.2}}>Kronvo s'adapte à tous<br/>vos établissements</div>
                  <div style={{fontSize:isMobile?12:14,color:'rgba(255,255,255,.7)',marginBottom:16}}>Restaurants, hôtels, cliniques, garages et plus</div>
                  <button onClick={()=>goPage('contact')} style={{padding:'10px 20px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Voir les secteurs →</button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. PHOTO ÉQUIPE + SECTEURS */}
      <section style={{background:BG,padding:SEC}}>
        <div style={WM}>
          <div style={{display:isMobile?'block':'grid',gridTemplateColumns:'1.4fr 1fr',gap:56,alignItems:'center'}}>
            <div>
              <Reveal>
                <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14}}>Secteurs</div>
                <h2 style={{fontSize:isMobile?28:40,fontWeight:900,color:TEXT,letterSpacing:'-.05em',marginBottom:16,lineHeight:1.06}}>Votre secteur,<br/>vos postes.</h2>
                <p style={{fontSize:15,color:TEXT2,lineHeight:1.8,marginBottom:28}}>Kronvo s'adapte à votre activité avec les termes exacts que vous utilisez. Chaque établissement configure ses propres postes — restaurant, clinique, garage ou autre.</p>
              </Reveal>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {bg:AG,bc:AB,c:A,title:'Restaurants & Hôtels',postes:'Cuisine · Salle · Bar · Réception'},
                  {bg:'#f0fdf4',bc:'#bbf7d0',c:'#16a34a',title:'Cliniques & Santé',postes:'Médecin · Infirmier · Accueil'},
                  {bg:'#fff7ed',bc:'#fed7aa',c:'#ea580c',title:'Garages & BTP',postes:'Mécanicien · Atelier · Chantier'},
                  {bg:'#faf5ff',bc:'#e9d5ff',c:'#7c3aed',title:'Commerce',postes:'Caissier · Rayon · Manager'},
                  {bg:'#f0f9ff',bc:'#bae6fd',c:'#0891b2',title:'Logistique',postes:'Préparateur · Chef équipe'},
                  {bg:'#fdf2f8',bc:'#fbcfe8',c:'#be185d',title:'Spas & Éducation',postes:'Esthéticien · Formateur'},
                ].map((s,i)=>(
                  <Reveal key={i} delay={i*50}>
                    <div style={{background:s.bg,border:`1px solid ${s.bc}`,borderRadius:12,padding:'14px 16px',transition:'transform .2s'}}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                      <div style={{fontSize:13,fontWeight:700,color:s.c,marginBottom:5}}>{s.title}</div>
                      <div style={{fontSize:11,color:s.c,opacity:.7,lineHeight:1.6}}>{s.postes}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal>
                <div style={{marginTop:16}}>
                  <span style={{fontSize:13,color:TEXT2}}>Votre secteur n'est pas listé ? </span>
                  <span onClick={()=>goPage('contact')} style={{fontSize:13,color:A,fontWeight:600,cursor:'pointer'}}>Contactez-nous →</span>
                </div>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <div style={{borderRadius:20,overflow:'hidden',boxShadow:'0 12px 48px rgba(0,0,0,.08)',border:`1px solid ${BORDER}`,marginTop:isMobile?32:0}}>
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80"
                  alt="Équipe médicale"
                  style={{width:'100%',height:280,objectFit:'cover',display:'block'}}
                  onError={e=>{e.target.style.display='none'}}
                />
                <img
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80"
                  alt="Équipe logistique"
                  style={{width:'100%',height:180,objectFit:'cover',display:'block'}}
                  onError={e=>{e.target.style.display='none'}}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. CALCULATEUR ROI */}
      <section style={{background:SURF,padding:SEC}}>
        <div style={W}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:52}}>
              <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14}}>Calculateur</div>
              <h2 style={{fontSize:isMobile?28:44,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:16,lineHeight:1.04}}>Combien vous coûte<br/>l'ancien système ?</h2>
              <p style={{fontSize:16,color:TEXT2,maxWidth:400,margin:'0 auto',lineHeight:1.8}}>Calculez le vrai coût des feuilles papier et des appels inutiles.</p>
            </div>
          </Reveal>
          <Reveal delay={80}><RoiCalc isMobile={isMobile}/></Reveal>
        </div>
      </section>

      {/* 8. FAQ + CTA */}
      <section style={{background:BG,padding:SEC}}>
        <div style={W}>
          <div style={{display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'start'}}>
            <div>
              <Reveal>
                <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14}}>Questions fréquentes</div>
                <h2 style={{fontSize:isMobile?26:38,fontWeight:900,color:TEXT,letterSpacing:'-.05em',marginBottom:12,lineHeight:1.08}}>Tout ce que vous voulez savoir.</h2>
                <p style={{fontSize:15,color:TEXT2,marginBottom:36,lineHeight:1.8}}>Les réponses aux questions qu'on nous pose le plus souvent.</p>
              </Reveal>
              <FaqSection/>
            </div>
            <div style={{marginTop:isMobile?52:0}}>
              <Reveal delay={120}>
                <div style={{background:TEXT,borderRadius:22,padding:'36px',marginBottom:12,overflow:'hidden',position:'relative'}}>
                  <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=60" alt="Team"
                    style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.08,display:'block'}} onError={e=>e.target.style.display='none'}/>
                  <div style={{position:'relative'}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 12px',borderRadius:20,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',marginBottom:22}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>
                    <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.55)'}}>Démo disponible cette semaine</span>
                  </div>
                  <h3 style={{fontSize:isMobile?22:28,fontWeight:900,color:'white',letterSpacing:'-.04em',marginBottom:14,lineHeight:1.08}}>Prêt à simplifier<br/>la gestion de votre équipe ?</h3>
                  <p style={{fontSize:14,color:'rgba(255,255,255,.45)',marginBottom:28,lineHeight:1.75}}>Démo gratuite via Teams. Notre équipe configure tout pour vous, sans engagement.</p>
                  <button onClick={()=>goPage('contact')} style={{width:'100%',padding:'15px',borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:9,justifyContent:'center',marginBottom:10,transition:'opacity .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='.88'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                    Réserver ma démo gratuite <IcoArr/>
                  </button>
                  <button onClick={()=>setShowLogin(true)} style={{width:'100%',padding:'13px',borderRadius:12,border:'1px solid rgba(255,255,255,.12)',background:'transparent',color:'rgba(255,255,255,.45)',fontSize:14,fontWeight:500,cursor:'pointer',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.25)';e.currentTarget.style.color='rgba(255,255,255,.65)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.12)';e.currentTarget.style.color='rgba(255,255,255,.45)'}}>
                    Déjà client — Se connecter
                  </button>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.18)',textAlign:'center',marginTop:14}}>Sans carte bancaire · Sans engagement · Réponse sous 24h</div>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={180}>
                <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,overflow:'hidden'}}>
                  <img src="https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=600&q=80" alt="Démo Teams"
                    style={{width:'100%',height:130,objectFit:'cover',display:'block'}} onError={e=>e.target.style.display='none'}/>
                  <div style={{padding:'20px'}}>
                    <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:14}}>Mise en place en 4 étapes</div>
                    {[{e:'📹',t:'Démo 30 min',d:'Présentation Kronvo adaptée à votre secteur.'},{e:'⚙️',t:'Configuration',d:'SwitzerIT configure tout pour vous.'},{e:'🎓',t:'Formation incluse',d:'Gérants et équipes formés, documentation fournie.'},{e:'🚀',t:'En production',d:'Vos équipes scannent. Vous suivez.'}].map((s,i)=>(
                      <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:i<3?12:0}}>
                        <div style={{width:32,height:32,borderRadius:9,background:BG,border:`1px solid ${BORDER}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{s.e}</div>
                        <div style={{paddingTop:2}}>
                          <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:2}}>{s.t}</div>
                          <div style={{fontSize:12,color:TEXT2,lineHeight:1.5}}>{s.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )

  // ══ PAGE FONCTIONNALITÉS ════════════════════════════════════════════
  const PageFeatures=()=>(
    <div style={{paddingTop:62,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'52px 20px':'72px 56px'}}>
        <Reveal>
          <div style={{borderRadius:20,overflow:'hidden',border:`1px solid ${BORDER}`,marginBottom:52,position:'relative',boxShadow:'0 8px 32px rgba(0,0,0,.07)'}}>
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80" alt="Équipe Kronvo"
              style={{width:'100%',height:isMobile?180:260,objectFit:'cover',display:'block'}} onError={e=>e.target.style.display='none'}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(0,0,0,.7) 0%,rgba(0,0,0,.15) 60%)',display:'flex',alignItems:'center',padding:isMobile?'20px':'48px'}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.6)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:10}}>Fonctionnalités</div>
                <div style={{fontSize:isMobile?22:36,fontWeight:900,color:'white',letterSpacing:'-.04em',lineHeight:1.1,marginBottom:8}}>Tout ce que Kronvo<br/>peut faire pour vous.</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,.65)'}}>Planning · Badgeage QR · Présences · Export PDF</div>
              </div>
            </div>
          </div>
        </Reveal>
        {/* Feature principale */}
        <Reveal>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:20,padding:isMobile?'24px':'40px',marginBottom:12,display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'center'}}>
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 12px',borderRadius:20,background:AG,border:`1px solid ${AB}`,marginBottom:18}}>
                <IcoCalendar c={A}/>
                <span style={{fontSize:12,fontWeight:600,color:A}}>Fonctionnalité clé</span>
              </div>
              <h2 style={{fontSize:isMobile?22:30,fontWeight:800,color:TEXT,letterSpacing:'-.04em',marginBottom:14}}>Planning intelligent</h2>
              <p style={{fontSize:14,color:TEXT2,lineHeight:1.8,marginBottom:20}}>Créez des plannings complets en quelques minutes. Shifts simples ou coupés, postes adaptés, publication en un clic.</p>
              <div style={{display:'flex',flexDirection:'column',gap:9}}>
                {['Shifts simples ou coupés','Postes personnalisables','Publication instantanée','Vue semaine / jour','Modification en temps réel'].map((item,j)=>(
                  <div key={j} style={{display:'flex',alignItems:'center',gap:9}}>
                    <IcoChk size={12}/>
                    <span style={{fontSize:13,color:TEXT2}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:BG,borderRadius:14,padding:'20px',border:`1px solid ${BORDER}`,marginTop:isMobile?20:0}}>
              <div style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'.1em',marginBottom:12}}>PLANNING SEMAINE</div>
              {['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].map((j,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{fontSize:11,color:TEXT3,width:52,flexShrink:0}}>{j}</div>
                  <div style={{flex:1,height:26,borderRadius:7,background:AG,display:'flex',alignItems:'center',paddingLeft:10,border:`1px solid ${AB}`}}>
                    <span style={{fontSize:10,color:A,fontWeight:600}}>{['Sophie M. · 09:00-17:00','Marc D. · 10:00-18:00','Julie B. · 09:00-15:00','Sophie M. · 11:00-19:00','Marc D. · 09:00-17:00'][i]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(2,1fr)',gap:12,marginBottom:12}}>
          {[
            {Icon:IcoQR,bg:'#faf5ff',bc:'#e9d5ff',c:'#7c3aed',title:'Badgeage QR Code sécurisé',items:['QR dynamique renouvelé toutes les 30s','Scan depuis le smartphone','Vérification d\'appartenance','Borne tablette avec PIN']},
            {Icon:IcoUsers,bg:'#f0fdf4',bc:'#bbf7d0',c:'#16a34a',title:'Suivi des présences',items:['Vue temps réel','Heures planifiées vs pointées','Calcul auto des écarts','Correction manuelle']},
            {Icon:IcoFile,bg:'#f0f9ff',bc:'#bae6fd',c:'#0891b2',title:'Rapports et export PDF',items:['PDF professionnels en 1 clic','Filtrage par période','Détail par employé','Export immédiat']},
            {Icon:IcoPhone,bg:'#fff7ed',bc:'#fed7aa',c:'#ea580c',title:'App mobile employé',items:['iPhone et Android (PWA)','Planning toujours à jour','Bouton scan QR intégré','Hors connexion']},
          ].map((f,i)=>(
            <Reveal key={i} delay={i*70}>
              <div style={{background:f.bg,border:`1px solid ${f.bc}`,borderRadius:16,padding:'24px',transition:'transform .2s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                  <div style={{width:40,height:40,background:'white',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${f.bc}`}}><f.Icon c={f.c}/></div>
                  <div style={{fontSize:15,fontWeight:700,color:TEXT}}>{f.title}</div>
                </div>
                {f.items.map((item,j)=>(
                  <div key={j} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <IcoChk size={11} c={f.c}/>
                    <span style={{fontSize:13,color:TEXT2}}>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'28px',display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:28,alignItems:'center',marginBottom:12}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:40,height:40,background:'#fdf2f8',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #fbcfe8'}}><IcoBuilding c="#be185d"/></div>
                <div style={{fontSize:15,fontWeight:700,color:TEXT}}>Multi-établissements</div>
              </div>
              <p style={{fontSize:13,color:TEXT2,lineHeight:1.75}}>Gérez plusieurs sites depuis un seul tableau de bord. Données entièrement isolées. Idéal pour les groupes et franchises.</p>
            </div>
            <div style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px',marginTop:isMobile?16:0}}>
              {['Le Bistrot · Paris','Hotel Lumière · Lyon','Clinique Santé · Genève'].map((e,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:SURF,border:`1px solid ${BORDER}`,borderRadius:8,marginBottom:8}}>
                  <span style={{fontSize:12,color:TEXT,fontWeight:500}}>{e}</span>
                  <span style={{fontSize:10,color:'#16a34a',fontWeight:600,display:'flex',alignItems:'center',gap:4}}><span style={{width:5,height:5,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>Actif</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div style={{background:AG,border:`1px solid ${AB}`,borderRadius:16,padding:'28px',textAlign:'center'}}>
            <h3 style={{fontSize:18,fontWeight:800,color:TEXT,marginBottom:10}}>Fonctionnalités à venir</h3>
            <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:20}}>
              {['Notifications email','Analytics avancées','Intégration paie','Messagerie équipe','Multi-langue'].map(f=>(
                <span key={f} style={{padding:'6px 14px',borderRadius:20,background:'white',border:`1px solid ${AB}`,fontSize:12,fontWeight:600,color:A}}>{f}</span>
              ))}
            </div>
            <button onClick={()=>goPage('contact')} style={{padding:'12px 24px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
          </div>
        </Reveal>
      </div>
    </div>
  )

  // ══ PAGE TARIFS ════════════════════════════════════════════════════
  const PagePricing=()=>(
    <div style={{paddingTop:62,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'52px 20px':'72px 56px'}}>
        <Reveal>
          <div style={{borderRadius:20,overflow:'hidden',border:`1px solid ${BORDER}`,marginBottom:52,position:'relative',boxShadow:'0 8px 32px rgba(0,0,0,.07)'}}>
            <img src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80" alt="Tarifs Kronvo"
              style={{width:'100%',height:isMobile?160:240,objectFit:'cover',display:'block'}} onError={e=>e.target.style.display='none'}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(0,0,0,.72) 0%,rgba(0,0,0,.12) 65%)',display:'flex',alignItems:'center',padding:isMobile?'20px':'48px'}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.6)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:10}}>Tarifs</div>
                <div style={{fontSize:isMobile?22:36,fontWeight:900,color:'white',letterSpacing:'-.04em',lineHeight:1.1,marginBottom:8}}>Investissez dans<br/>ce qui compte vraiment.</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,.65)'}}>Tarification sur mesure · Démo gratuite · Sans engagement</div>
              </div>
            </div>
          </div>
        </Reveal>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:14,marginBottom:28}}>
          {[
            {name:'Mise en place',icon:'🚀',bg:'white',border:BORDER,c:A,
             desc:'Configuration complète par SwitzerIT.',
             items:['Création et configuration','Paramétrage établissements','Import des employés','Installation borne tablette','Formation gérant','Documentation complète'],
             tag:'Sur devis',featured:false},
            {name:'Abonnement mensuel',icon:'✨',bg:'white',border:A,c:A,
             desc:'Accès complet à Kronvo pour votre établissement.',
             items:['Planning et badgeage illimités','Tous vos employés inclus','Rapports PDF illimités','Support email sous 24h','Mises à jour automatiques','Hébergement sécurisé Suisse'],
             tag:'Sur devis · en CHF',featured:true},
            {name:'Support & maintenance',icon:'🛡️',bg:'white',border:BORDER,c:'#7c3aed',
             desc:'Accompagnement continu pour votre sérénité.',
             items:['Support prioritaire','Intervention sous 4h','Formations supplémentaires','Évolutions personnalisées','Suivi trimestriel','SLA garanti'],
             tag:'Options disponibles',featured:false},
          ].map((plan,i)=>(
            <Reveal key={i} delay={i*80}>
              <div style={{background:plan.bg,border:`${plan.featured?'2px':'1px'} solid ${plan.border}`,borderRadius:20,padding:'26px',display:'flex',flexDirection:'column',position:'relative',boxShadow:plan.featured?'0 8px 40px rgba(0,102,204,.1)':'none',height:'100%'}}>
                {plan.featured&&<div style={{position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',padding:'4px 16px',borderRadius:20,background:A,color:'white',fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>RECOMMANDÉ</div>}
                <div style={{fontSize:28,marginBottom:12}}>{plan.icon}</div>
                <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:7}}>{plan.name}</div>
                <div style={{fontSize:13,color:TEXT2,lineHeight:1.6,marginBottom:18}}>{plan.desc}</div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20,flex:1}}>
                  {plan.items.map(f=>(
                    <div key={f} style={{display:'flex',alignItems:'flex-start',gap:9,fontSize:13,color:TEXT2}}>
                      <div style={{flexShrink:0,marginTop:2}}><IcoChk size={11} c={plan.c}/></div>{f}
                    </div>
                  ))}
                </div>
                <div style={{padding:'9px 14px',background:plan.featured?AG:BG,border:`1px solid ${plan.featured?AB:BORDER}`,borderRadius:9,fontSize:13,fontWeight:700,color:plan.c,textAlign:'center',marginBottom:12}}>{plan.tag}</div>
                <button onClick={()=>goPage('contact')} style={{width:'100%',height:42,borderRadius:10,border:plan.featured?'none':`1.5px solid ${A}`,background:plan.featured?A:'transparent',color:plan.featured?'white':A,fontSize:13,fontWeight:700,cursor:'pointer',transition:'opacity .15s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Demander un devis</button>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:18,padding:'28px',display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:32,alignItems:'center',marginBottom:14}}>
            <div>
              <h3 style={{fontSize:isMobile?18:24,fontWeight:800,color:TEXT,marginBottom:12,letterSpacing:'-.03em'}}>Un investissement qui se rentabilise en moins d'un mois.</h3>
              <p style={{fontSize:13,color:TEXT2,lineHeight:1.75}}>En moyenne, nos clients économisent 2 à 4 heures de travail administratif par semaine. Pour un gérant à 60 CHF/h, Kronvo se rentabilise dès le premier mois.</p>
            </div>
            <div style={{marginTop:isMobile?20:0}}>
              {[{label:'Temps économisé / semaine',val:'2-4h',c:A},{label:'Erreurs de paie évitées',val:'100%',c:'#16a34a'},{label:'Mise en place',val:'2-4h',c:'#ea580c'},{label:'Retour sur investissement',val:'< 1 mois',c:'#7c3aed'}].map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:i<3?`1px solid ${BORDER}`:'none'}}>
                  <span style={{fontSize:13,color:TEXT2}}>{s.label}</span>
                  <span style={{fontSize:14,fontWeight:800,color:s.c}}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div style={{background:AG,border:`1px solid ${AB}`,borderRadius:14,padding:'24px',display:'flex',alignItems:isMobile?'flex-start':'center',gap:16,flexDirection:isMobile?'column':'row'}}>
            <div style={{fontSize:32,flexShrink:0}}>📹</div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:5}}>Démo gratuite via Teams — 30 minutes</div>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.65}}>On vous présente Kronvo adapté à votre secteur. Repartez avec un devis personnalisé. Sans engagement.</div>
            </div>
            <button onClick={()=>goPage('contact')} style={{padding:'13px 22px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',flexShrink:0,width:isMobile?'100%':'auto'}}>Réserver ma démo →</button>
          </div>
        </Reveal>
      </div>
    </div>
  )

  // ══ PAGE CONTACT ═══════════════════════════════════════════════════
  const PageContact=()=>(
    <div style={{paddingTop:62,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'52px 20px':'72px 56px'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:14}}>Contact</div>
            <h1 style={{fontSize:isMobile?28:48,fontWeight:900,color:TEXT,letterSpacing:'-.06em',marginBottom:14,lineHeight:1.02}}>Parlons de votre projet.</h1>
            <p style={{fontSize:16,color:TEXT2,maxWidth:420,margin:'0 auto',lineHeight:1.8}}>Notre équipe vous répond sous 24h et organise une démo Teams gratuite.</p>
          </div>
        </Reveal>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.3fr 1fr',gap:20}}>
          <Reveal>
            <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:20,padding:'32px'}}>
              <ContactForm goPage={goPage} setShowLogin={setShowLogin}/>
            </div>
          </Reveal>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {delay:80,content:(
                <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'22px',overflow:'hidden',position:'relative'}}>
                  <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=70" alt="Team" style={{width:'100%',height:140,objectFit:'cover',borderRadius:10,display:'block',marginBottom:14}} onError={e=>e.target.style.display='none'}/>
                  <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>📹 Démo Teams gratuite</div>
                  <div style={{fontSize:13,color:TEXT2,lineHeight:1.7,marginBottom:12}}>30 min adaptées à votre secteur. Repartez avec un devis personnalisé.</div>
                  <div style={{display:'flex',flexDirection:'column',gap:7}}>
                    {['Présentation adaptée','Questions illimitées','Devis inclus','Sans engagement'].map((t,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:7}}>
                        <IcoChk size={12}/><span style={{fontSize:12,color:TEXT2}}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )},
              {delay:140,content:(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[{icon:<IcoShield c={A}/>,bg:AG,bc:AB,t:'RGPD & LPD Suisse',d:'Données sécurisées'},{icon:<IcoZap c='#ea580c'/>,bg:'#fff7ed',bc:'#fed7aa',t:'Mise en place rapide',d:'2 à 4 heures'},{icon:<IcoClock c='#16a34a'/>,bg:'#f0fdf4',bc:'#bbf7d0',t:'Réponse sous 24h',d:'Équipe humaine'},{icon:<span style={{fontSize:18}}>🇨🇭</span>,bg:'#f8fafc',bc:BORDER,t:'Basé en Suisse',d:'Facturation CHF'}].map((info,i)=>(
                    <div key={i} style={{background:info.bg,border:`1px solid ${info.bc}`,borderRadius:12,padding:'14px'}}>
                      <div style={{marginBottom:8}}>{info.icon}</div>
                      <div style={{fontSize:12,fontWeight:700,color:TEXT,marginBottom:3}}>{info.t}</div>
                      <div style={{fontSize:11,color:TEXT2}}>{info.d}</div>
                    </div>
                  ))}
                </div>
              )},
              {delay:180,content:(
                <div style={{background:AG,border:`1px solid ${AB}`,borderRadius:12,padding:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:4}}>Déjà client ?</div>
                    <div style={{fontSize:12,color:TEXT2}}>Accédez à votre espace gérant.</div>
                  </div>
                  <button onClick={()=>setShowLogin(true)} style={{padding:'9px 18px',borderRadius:9,border:'none',background:A,color:'white',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>Se connecter →</button>
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

  // ══ PAGE LÉGAL ═════════════════════════════════════════════════════
  const PageLegal=()=>{
    const sections={
      cgu:{title:"Conditions Générales d'Utilisation",last:"11 mai 2026",content:[
        {h:"1. Objet",t:"Les présentes CGU régissent l'accès et l'utilisation de la plateforme Kronvo, éditée par SwitzerIT, basée en Suisse."},
        {h:"2. Description",t:"Kronvo est une solution SaaS de gestion d'équipes permettant la création de plannings, le badgeage par QR code, le suivi des présences et l'export de rapports."},
        {h:"3. Accès",t:"L'accès est réservé aux professionnels. Chaque compte est associé à un établissement géré par un gérant désigné."},
        {h:"4. Obligations",t:"L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants."},
        {h:"5. Responsabilité",t:"La responsabilité est limitée au montant des sommes versées au cours des 12 derniers mois."},
        {h:"6. Propriété intellectuelle",t:"L'ensemble des éléments de Kronvo est la propriété exclusive de SwitzerIT. Toute reproduction non autorisée est interdite."},
        {h:"7. Résiliation",t:"Chaque partie peut résilier avec un préavis de 30 jours."},
        {h:"8. Droit applicable",t:"Les CGU sont soumises au droit suisse. Les tribunaux du canton de Vaud sont seuls compétents."},
      ]},
      confidentialite:{title:"Politique de Confidentialité",last:"11 mai 2026",content:[
        {h:"Responsable",t:"SwitzerIT, basé en Suisse. Contact : contact@switzerit.com"},
        {h:"Données collectées",t:"Données d'identification, données professionnelles, données de pointage."},
        {h:"Finalités",t:"Gestion des comptes, fonctionnement du service, génération de rapports."},
        {h:"Conservation",t:"Durée du contrat + 3 ans. Données de pointage : 5 ans."},
        {h:"Partage",t:"Les données ne sont jamais vendues. Partagées uniquement avec nos sous-traitants avec garanties contractuelles."},
        {h:"Vos droits",t:"Conformément à la LPD suisse et au RGPD : accès, rectification, effacement, portabilité. Contact : contact@switzerit.com"},
        {h:"Sécurité",t:"Données chiffrées en transit et au repos. Authentification sécurisée."},
      ]},
      rgpd:{title:"Conformité RGPD",last:"11 mai 2026",content:[
        {h:"Engagement",t:"Kronvo respecte le RGPD (UE 2016/679) pour les utilisateurs UE, ainsi que la nLPD suisse."},
        {h:"Données traitées",t:"Noms et prénoms des employés, emails professionnels, données de badgeage."},
        {h:"Conservation",t:"Employés actifs : durée du contrat. Facturation : 10 ans. Logs sécurité : 12 mois."},
        {h:"Sous-traitants",t:"Supabase Inc. et Vercel Inc. (clauses contractuelles types)."},
        {h:"Contact DPO",t:"contact@switzerit.com — réponse sous 30 jours."},
      ]},
      cookies:{title:"Politique de Cookies",last:"11 mai 2026",content:[
        {h:"Cookies nécessaires",t:"Cookies d'authentification, préférences, sécurité CSRF. Non désactivables."},
        {h:"Cookies fonctionnels",t:"Établissement sélectionné, état de la borne, préférences d'affichage."},
        {h:"Cookies analytiques",t:"Nous n'utilisons pas de cookies analytiques tiers."},
        {h:"Durée",t:"Session : supprimés à la fermeture. Persistants : maximum 12 mois."},
      ]},
    }
    const s=sections[legalSection]
    return (
      <div style={{paddingTop:62,minHeight:'100vh',background:BG}}>
        <div style={{...W,padding:isMobile?'28px 20px':'56px 56px'}}>
          {isMobile?(
            <>
              <div style={{display:'flex',gap:8,marginBottom:22,overflowX:'auto',paddingBottom:4}}>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{padding:'7px 16px',borderRadius:20,border:'none',background:legalSection===id?A:'transparent',color:legalSection===id?'white':TEXT2,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{label}</button>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'24px'}}>
                <div style={{fontSize:10,color:TEXT3,marginBottom:6}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:22,fontWeight:900,color:TEXT,marginBottom:20}}>{s.title}</h1>
                {s.content.map((block,i)=>(<div key={i} style={{marginBottom:20}}><h2 style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:6}}>{block.h}</h2><p style={{fontSize:13,color:TEXT2,lineHeight:1.75,margin:0}}>{block.t}</p></div>))}
                <div style={{marginTop:22,padding:'13px 16px',background:AG,borderRadius:10,fontSize:13,color:A}}><strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a></div>
              </div>
            </>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'190px 1fr',gap:24,alignItems:'start'}}>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:13,padding:'16px 13px',position:'sticky',top:74}}>
                <div style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:13}}>Légal</div>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'none',background:legalSection===id?AG:'transparent',color:legalSection===id?A:TEXT2,fontSize:13,fontWeight:legalSection===id?600:400,cursor:'pointer',textAlign:'left',marginBottom:2,display:'block'}}>{label}</button>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'36px'}}>
                <div style={{fontSize:10,color:TEXT3,marginBottom:8}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:28,fontWeight:900,color:TEXT,letterSpacing:'-.04em',marginBottom:24}}>{s.title}</h1>
                {s.content.map((block,i)=>(<div key={i} style={{marginBottom:22}}><h2 style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:7}}>{block.h}</h2><p style={{fontSize:13,color:TEXT2,lineHeight:1.8,margin:0}}>{block.t}</p></div>))}
                <div style={{marginTop:28,padding:'14px 18px',background:AG,borderRadius:10,fontSize:13,color:A}}><strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a></div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ══ RENDER ═════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:'100vh',background:BG,fontFamily:'var(--font)',color:TEXT}}>
      <Nav/>
      {page==='home'&&<PageHome/>}
      {page==='fonctionnalites'&&<PageFeatures/>}
      {page==='tarifs'&&<PagePricing/>}
      {page==='contact'&&<PageContact/>}
      {page==='legal'&&<PageLegal/>}
      <Footer/>

      {/* MODALE CONNEXION */}
      {showLogin&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16,overscrollBehavior:'none',touchAction:'none'}}>
          <div style={{background:SURF,borderRadius:20,padding:isMobile?'24px 20px':34,width:'100%',maxWidth:370,boxShadow:'0 24px 64px rgba(0,0,0,.15)',border:`1px solid ${BORDER}`,position:'relative'}}>
            <button onClick={()=>setShowLogin(false)} style={{position:'absolute',top:14,right:14,width:30,height:30,borderRadius:'50%',border:`1px solid ${BORDER}`,background:BG,color:TEXT2,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            <div style={{textAlign:'center',marginBottom:22}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>{LOGO_SM}</div>
              <div style={{fontSize:20,fontWeight:800,color:TEXT,letterSpacing:'-.03em'}}>Connexion</div>
              <div style={{fontSize:12,color:TEXT3,marginTop:4}}>Accédez à votre espace Kronvo</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:13}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:6}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required
                style={{width:'100%',padding:'12px 14px',borderRadius:10,border:`1.5px solid ${BORDER}`,background:'#fafafa',fontSize:14,color:TEXT,outline:'none',boxSizing:'border-box'}}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              <div style={{marginBottom:22}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:6}}>Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                style={{width:'100%',padding:'12px 14px',borderRadius:10,border:`1.5px solid ${BORDER}`,background:'white',fontSize:14,color:'#111',outline:'none',boxSizing:'border-box'}}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              {error&&<div style={{padding:'9px 12px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,fontSize:13,color:'#dc2626',marginBottom:14,fontWeight:600}}>{error}</div>}
              <button type="submit" style={{width:'100%',height:48,borderRadius:11,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer'}}>Se connecter</button>
            </form>
            <div style={{textAlign:'center',marginTop:14}}>
              <span style={{fontSize:12,color:TEXT3}}>Pas encore client ? </span>
              <span style={{fontSize:12,color:A,fontWeight:600,cursor:'pointer'}} onClick={()=>{setShowLogin(false);goPage('contact')}}>Demander une démo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
