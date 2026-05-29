import Logo from '../components/Logo'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

// ── LOGO ──────────────────────────────────────────────────────────────
const LOGO_SM = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" height="32">
    <text x="0" y="36" fontFamily="-apple-system,'Inter','Helvetica Neue',Arial,sans-serif" fontSize="38" fontWeight="900" letterSpacing="-1.5" fill="#0C1A35">varman</text>
    <circle cx="152" cy="32" r="7" fill="#E11D48"/>
  </svg>
)

// ── ICONS SVG ─────────────────────────────────────────────────────────
const IcoCalendar = ({c='#E11D48'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
const IcoQR = ({c='#7c3aed'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="5" y="5" width="3" height="3" fill={c}/><rect x="16" y="5" width="3" height="3" fill={c}/><rect x="5" y="16" width="3" height="3" fill={c}/><path d="M14 14h3v3h-3zM17 17h4M17 14v4"/></svg>
const IcoUsers = ({c='#16a34a'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoPhone = ({c='#ea580c'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
const IcoFile = ({c='#0891b2'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>
const IcoBuilding = ({c='#be185d'}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M3 9h6M3 15h6M15 9h3M15 15h3"/></svg>
const IcoChk = ({size=14,c='#E11D48'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoArr = ({size=16,c='white'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const IcoShield = ({c='#E11D48'}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoZap = ({c='#E11D48'}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcoClock = ({c='#E11D48'}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

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
          <div style={{height:'100%',background:'#E11D48',borderRadius:1,width:`${prog}%`,transition:'width .1s linear'}}/>
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
          <input type="range" min="2" max="80" value={emp} onChange={ev=>setEmp(Number(ev.target.value))} style={{width:'100%',accentColor:'#E11D48',cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#bbb',marginTop:4}}><span>2</span><span>80</span></div>
        </div>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#444',marginBottom:10}}>Heures perdues / semaine — <strong style={{color:'#111'}}>{hrs}h</strong></label>
          <input type="range" min="1" max="15" value={hrs} onChange={ev=>setHrs(Number(ev.target.value))} style={{width:'100%',accentColor:'#E11D48',cursor:'pointer'}}/>
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
      <div style={{background:'#fff1f3',border:'1px solid #fecdd3',borderRadius:12,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <span style={{fontSize:13,color:'#0052a3',fontWeight:500}}>Économie estimée : <strong>{e.toLocaleString('fr-CH')} CHF/an</strong> pour {emp} employés</span>
        <a href="/contact" style={{padding:'9px 18px',borderRadius:9,background:'#E11D48',color:'white',fontSize:13,fontWeight:700,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6}}>Obtenir mon devis <IcoArr size={13}/></a>
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
            <span style={{fontSize:20,color:'#E11D48',flexShrink:0,fontWeight:300,transform:open===i?'rotate(45deg)':'none',transition:'transform .2s',display:'inline-block',lineHeight:1}}>{open===i?'−':'+'}</span>
          </button>
          {open===i&&<div style={{paddingBottom:18}}><p style={{fontSize:14,color:'#555',lineHeight:1.8,margin:0}}>{faq.a}</p></div>}
        </div>
      ))}
      <div style={{textAlign:'center',marginTop:28,paddingTop:20}}>
        <span style={{fontSize:14,color:'#888'}}>Une autre question ? </span>
        <a href="/contact" style={{fontSize:14,color:'#E11D48',fontWeight:600,textDecoration:'none'}}>On vous répond →</a>
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
            onFocus={e=>e.target.style.borderColor='#E11D48'}
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
          onFocus={e=>e.target.style.borderColor='#E11D48'} onBlur={e=>e.target.style.borderColor='#e5e5e5'}/>
      </div>
      <button onClick={submit} style={{width:'100%',height:52,borderRadius:12,border:'none',background:'#E11D48',color:'white',fontSize:15,fontWeight:700,cursor:'pointer',transition:'opacity .15s'}}
      onMouseEnter={e=>e.currentTarget.style.opacity='.88'}
      onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
        Envoyer ma demande →
      </button>
      <div style={{fontSize:11,color:'#aaa',textAlign:'center',marginTop:10}}>Réponse sous 24h · Démo Teams offerte</div>
    </>
  )
}


function LoginModal({onClose, goPage}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(()=>{
    const y = window.scrollY
    document.body.style.overflow='hidden'
    document.body.style.position='fixed'
    document.body.style.top='-'+y+'px'
    document.body.style.width='100%'
    return()=>{
      const top = document.body.style.top
      document.body.style.overflow=''
      document.body.style.position=''
      document.body.style.top=''
      document.body.style.width=''
      if(top) window.scrollTo(0,-parseInt(top||'0'))
    }
  },[])

  async function handleLogin(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    const {data,error} = await supabase.auth.signInWithPassword({email,password})
    if(error){setError('Email ou mot de passe incorrect');setLoading(false);return}
    const {data:p} = await supabase.from('profils').select('role').eq('user_id',data.user.id).single()
    if(p?.role==='super_admin') navigate('/admin')
    else if(p?.role==='gerant') navigate('/gerant')
    else navigate('/moi')
    setLoading(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
      <div style={{background:'white',borderRadius:20,padding:34,width:'100%',maxWidth:370,boxShadow:'0 24px 64px rgba(0,0,0,.15)',border:'1px solid #e8e8e8',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,width:30,height:30,borderRadius:'50%',border:'1px solid #e8e8e8',background:'#f8fafc',color:'#555',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        <div style={{textAlign:'center',marginBottom:22}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" height="32"><text x="0" y="36" fontFamily="-apple-system,'Inter','Helvetica Neue',Arial,sans-serif" fontSize="38" fontWeight="900" letterSpacing="-1.5" fill="#0C1A35">varman</text><circle cx="152" cy="32" r="7" fill="#E11D48"/></svg>
          </div>
          <div style={{fontSize:20,fontWeight:800,color:'#111',letterSpacing:'-.03em'}}>Connexion</div>
          <div style={{fontSize:12,color:'#999',marginTop:4}}>Accédez à votre espace Varman</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:13}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#555',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required
              style={{width:'100%',padding:'12px 14px',borderRadius:10,border:'1.5px solid #e8e8e8',background:'#fafafa',fontSize:14,color:'#111',outline:'none',boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor='#E11D48'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#555',marginBottom:6}}>Mot de passe</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
              style={{width:'100%',padding:'12px 14px',borderRadius:10,border:'1.5px solid #e8e8e8',background:'white',fontSize:14,color:'#111',outline:'none',boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor='#E11D48'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
          </div>
          {error&&<div style={{padding:'9px 12px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,fontSize:13,color:'#dc2626',marginBottom:14,fontWeight:600}}>{error}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',height:48,borderRadius:11,border:'none',background:'#E11D48',color:'white',fontSize:15,fontWeight:700,cursor:'pointer',opacity:loading?.7:1}}>
            {loading?'Connexion...':'Se connecter'}
          </button>
        </form>
        <div style={{textAlign:'center',marginTop:14}}>
          <span style={{fontSize:12,color:'#999'}}>Pas encore client ? </span>
          <span style={{fontSize:12,color:'#E11D48',fontWeight:600,cursor:'pointer'}} onClick={()=>{onClose();goPage('contact')}}>Demander une démo</span>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
export default function Login() {
  const [loading,setLoading]=useState(true)
  const [showLogin,setShowLogin]=useState(false)
  const [setPasswordMode,setSetPasswordMode]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [legalSection,setLegalSection]=useState('cgu')
  const [isMobile,setIsMobile]=useState(window.innerWidth<900)
  const navigate=useNavigate()
  const location=useLocation()

  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<900);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[])
  useEffect(()=>{
    // Détecter le hash d'invitation Supabase
    const hash = window.location.hash
    if(hash.includes('type=invite')||hash.includes('type=recovery')){
      setLoading(false)
      setSetPasswordMode(true)
      return
    }
    if(hash.includes('error=')){
      setLoading(false)
      setShowLogin(true)
      return
    }
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
      const y = window.scrollY
      document.body.style.overflow='hidden'
      document.body.style.position='fixed'
      document.body.style.top=`-${y}px`
      document.body.style.width='100%'
    } else {
      const top = document.body.style.top
      document.body.style.overflow=''
      document.body.style.position=''
      document.body.style.top=''
      document.body.style.width=''
      if(top) window.scrollTo(0, -parseInt(top||'0'))
    }
    return()=>{
      document.body.style.overflow=''
      document.body.style.position=''
      document.body.style.top=''
      document.body.style.width=''
    }
  },[showLogin])



  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'white',color:'#aaa',fontFamily:'var(--font)'}}>Chargement...</div>

  // ── DESIGN TOKENS ──────────────────────────────────────────────────
  const A='#E11D48'       // bleu accent
  const AG='#fff1f3'      // bleu très clair
  const AB='#fecdd3'      // bleu border
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
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:16}}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" height="28">
    <text x="0" y="36" fontFamily="-apple-system,'Inter','Helvetica Neue',Arial,sans-serif" fontSize="38" fontWeight="900" letterSpacing="-1.5" fill="white">varman</text>
    <circle cx="152" cy="32" r="7" fill="#E11D48"/>
  </svg>
</div>
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
          <div style={{fontSize:11,color:'rgba(255,255,255,.25)'}}>© 2026 Varman by SwitzerIT · Suisse</div>
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
      {/* HERO */}
      <section style={{padding:isMobile?'100px 20px 60px':'120px 0 80px',maxWidth:1020,margin:'0 auto',paddingLeft:isMobile?20:48,paddingRight:isMobile?20:48}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:48,alignItems:'center'}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,background:AG,border:`1px solid ${AB}`,borderRadius:20,padding:'5px 14px',marginBottom:24}}>
              <div style={{width:6,height:6,background:A,borderRadius:'50%'}}/>
              <span style={{fontSize:12,color:A,fontWeight:600}}>Badgeage QR · Planning · Présences</span>
            </div>
            <h1 style={{fontSize:isMobile?38:52,fontWeight:900,color:TEXT,lineHeight:1.1,letterSpacing:'-2px',marginBottom:16}}>
              Le planning qui<br/><span style={{color:A}}>se gère tout seul.</span>
            </h1>
            <p style={{fontSize:16,color:TEXT2,lineHeight:1.7,marginBottom:32,maxWidth:440}}>
              Badgeage QR, présences en direct, export paie automatique. Sans paperasse, sans appels inutiles.
            </p>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <button onClick={()=>setShowLogin(true)} style={{background:A,color:'white',border:'none',padding:'14px 28px',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
              <button onClick={()=>goPage('fonctionnalites')} style={{background:'white',color:TEXT,border:`1.5px solid ${BORDER}`,padding:'14px 24px',borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer'}}>Voir les fonctionnalités</button>
            </div>
          </div>
          {!isMobile&&(
            <div style={{background:'#0C1A35',borderRadius:16,padding:24,boxShadow:'0 24px 60px rgba(12,26,53,.2)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'white'}}>Varman · Le Bistrot</div>
                  <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                    <div style={{width:6,height:6,background:'#22c55e',borderRadius:'50%'}}/>
                    <span style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>En direct</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:5}}>
                  {['#E11D48','#F59E0B','#22c55e'].map((c,i)=><div key={i} style={{width:10,height:10,background:c,borderRadius:'50%'}}/>)}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                {[{n:8,l:'Présents',c:'#22c55e'},{n:3,l:'Absents',c:A},{n:2,l:'En pause',c:'#F59E0B'}].map((s,i)=>(
                  <div key={i} style={{background:'rgba(255,255,255,.07)',borderRadius:8,padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.n}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{s.l}</div>
                  </div>
                ))}
              </div>
              {[{i:'SM',n:'Sophie Martin',r:'Cuisine',t:'09:02'},{i:'MD',n:'Marc Dupont',r:'Salle',t:'09:15'},{i:'JB',n:'Julie Bernard',r:'Bar',t:'En pause'}].map((e,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,.06)',borderRadius:8,padding:'9px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:A,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'white'}}>{e.i}</div>
                    <div><div style={{fontSize:12,fontWeight:600,color:'white'}}>{e.n}</div><div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{e.r}</div></div>
                  </div>
                  <span style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{e.t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3 FEATURES */}
      <section style={{background:'white',padding:isMobile?'48px 20px':'72px 0',borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:1020,margin:'0 auto',padding:isMobile?'0':'0 48px'}}>
          <h2 style={{fontSize:isMobile?26:34,fontWeight:900,color:TEXT,textAlign:'center',letterSpacing:'-1px',marginBottom:8}}>Tout ce dont vous avez besoin.</h2>
          <p style={{fontSize:15,color:TEXT2,textAlign:'center',marginBottom:48}}>Une solution complète, sans complexité.</p>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:24}}>
            {[
              {icon:'📅',title:'Planning intelligent',desc:'Créez et publiez les plannings en quelques clics. Shifts simples ou coupés, postes adaptés à votre secteur.'},
              {icon:'📱',title:'Badgeage QR Code',desc:'QR dynamique renouvelé toutes les 30s. Scan depuis le téléphone. Borne tablette disponible.'},
              {icon:'⏱️',title:'Présences en direct',desc:'Qui est là maintenant. Heures prévues vs pointées. Export PDF prêt pour votre comptable.'},
            ].map((f,i)=>(
              <div key={i} style={{background:BG,borderRadius:14,padding:28,border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:32,marginBottom:14}}>{f.icon}</div>
                <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:8}}>{f.title}</div>
                <div style={{fontSize:14,color:TEXT2,lineHeight:1.7}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:isMobile?'56px 20px':'80px 0',textAlign:'center'}}>
        <div style={{maxWidth:600,margin:'0 auto',padding:isMobile?'0':'0 48px'}}>
          <h2 style={{fontSize:isMobile?28:36,fontWeight:900,color:TEXT,letterSpacing:'-1.5px',marginBottom:16}}>Prêt à simplifier votre gestion ?</h2>
          <p style={{fontSize:15,color:TEXT2,lineHeight:1.7,marginBottom:32}}>Démo gratuite en 30 min. Notre équipe configure tout pour vous, sans engagement.</p>
          <button onClick={()=>setShowLogin(true)} style={{background:A,color:'white',border:'none',padding:'16px 40px',borderRadius:12,fontSize:16,fontWeight:700,cursor:'pointer',display:'inline-block'}}>
            Demander une démo gratuite →
          </button>
          <div style={{fontSize:12,color:TEXT3,marginTop:12}}>Sans carte bancaire · Sans engagement · Réponse sous 24h</div>
        </div>
      </section>
    </>
  )

  const PageFeatures=()=>(
    <section style={{padding:isMobile?'100px 20px 60px':'120px 0 80px',maxWidth:1020,margin:'0 auto',paddingLeft:isMobile?20:48,paddingRight:isMobile?20:48}}>
      <h1 style={{fontSize:isMobile?32:44,fontWeight:900,color:TEXT,letterSpacing:'-1.5px',marginBottom:16}}>Fonctionnalités</h1>
      <p style={{fontSize:16,color:TEXT2,marginBottom:48,maxWidth:540}}>Tout ce dont votre équipe terrain a besoin, sans la complexité des grands outils RH.</p>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(2,1fr)',gap:20}}>
        {[
          {icon:'📅',t:'Planning',d:'Shifts simples ou coupés. Publication avec notification aux employés. Vue semaine et mois.'},
          {icon:'📱',t:'Badgeage QR',d:'QR renouvelé toutes les 30s. Scan depuis mobile ou borne tablette. Anti-fraude intégré.'},
          {icon:'⏱️',t:'Présences en direct',d:'Dashboard temps réel. Arrivées, départs, pauses. Écarts calculés automatiquement.'},
          {icon:'🏖️',t:'Congés & absences',d:'Demandes employés, validation gérant, décompte automatique des soldes.'},
          {icon:'📄',t:'Export paie',d:'Rapports PDF par employé et par période. Prêt pour votre comptable.'},
          {icon:'🔔',t:'Notifications',d:'L\'employé voit les changements de planning en temps réel sur son téléphone.'},
        ].map((f,i)=>(
          <div key={i} style={{background:'white',borderRadius:14,padding:24,border:`1px solid ${BORDER}`,display:'flex',gap:16,alignItems:'flex-start'}}>
            <div style={{fontSize:28,flexShrink:0}}>{f.icon}</div>
            <div><div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:6}}>{f.t}</div><div style={{fontSize:14,color:TEXT2,lineHeight:1.6}}>{f.d}</div></div>
          </div>
        ))}
      </div>
      <div style={{textAlign:'center',marginTop:56}}>
        <button onClick={()=>setShowLogin(true)} style={{background:A,color:'white',border:'none',padding:'14px 32px',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
      </div>
    </section>
  )

  const PagePricing=()=>(
    <section style={{padding:isMobile?'100px 20px 60px':'120px 0 80px',maxWidth:1020,margin:'0 auto',paddingLeft:isMobile?20:48,paddingRight:isMobile?20:48}}>
      <h1 style={{fontSize:isMobile?32:44,fontWeight:900,color:TEXT,letterSpacing:'-1.5px',marginBottom:8,textAlign:'center'}}>Tarifs simples.</h1>
      <p style={{fontSize:16,color:TEXT2,textAlign:'center',marginBottom:56}}>Sans surprise. Sans engagement.</p>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(2,1fr)',gap:24,maxWidth:720,margin:'0 auto'}}>
        {[
          {name:'Starter',price:'49',period:'/mois',desc:'Jusqu\'à 10 employés',features:['Planning & shifts','Badgeage QR','Présences en direct','App mobile employé','Export PDF'],cta:'Commencer',accent:false},
          {name:'Pro',price:'99',period:'/mois',desc:'Employés illimités',features:['Tout Starter inclus','Multi-établissements','Statistiques avancées','Support prioritaire','Onboarding dédié'],cta:'Demander une démo',accent:true},
        ].map((p,i)=>(
          <div key={i} style={{background:p.accent?'#0C1A35':'white',borderRadius:16,padding:32,border:p.accent?'none':`1px solid ${BORDER}`}}>
            <div style={{fontSize:13,fontWeight:700,color:p.accent?'rgba(255,255,255,.5)':TEXT3,marginBottom:8,letterSpacing:'.05em'}}>{p.name.toUpperCase()}</div>
            <div style={{fontSize:44,fontWeight:900,color:p.accent?'white':TEXT,letterSpacing:'-2px',marginBottom:4}}>{p.price}<span style={{fontSize:16,fontWeight:500,opacity:.6}}>CHF{p.period}</span></div>
            <div style={{fontSize:14,color:p.accent?'rgba(255,255,255,.5)':TEXT2,marginBottom:24}}>{p.desc}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:28}}>
              {p.features.map((f,j)=>(
                <div key={j} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:p.accent?A:'#f0fdf4',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:10,color:p.accent?'white':'#16a34a',fontWeight:900}}>✓</span>
                  </div>
                  <span style={{fontSize:14,color:p.accent?'rgba(255,255,255,.8)':TEXT}}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowLogin(true)} style={{width:'100%',padding:'12px',borderRadius:10,border:p.accent?'none':`1.5px solid ${BORDER}`,background:p.accent?A:'white',color:p.accent?'white':TEXT,fontSize:14,fontWeight:700,cursor:'pointer'}}>{p.cta} →</button>
          </div>
        ))}
      </div>
    </section>
  )

  const PageContact=()=>(
    <section style={{padding:isMobile?'100px 20px 60px':'120px 0 80px',maxWidth:600,margin:'0 auto',paddingLeft:isMobile?20:48,paddingRight:isMobile?20:48}}>
      <h1 style={{fontSize:isMobile?32:44,fontWeight:900,color:TEXT,letterSpacing:'-1.5px',marginBottom:8}}>Contactez-nous</h1>
      <p style={{fontSize:16,color:TEXT2,marginBottom:40}}>Une question ? On vous répond sous 24h.</p>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {[{l:'Email',v:'contact@switzerit.com'},{l:'Téléphone',v:'+41 79 000 00 00'},{l:'Démo',v:'Réservez via le bouton ci-dessous'}].map((c,i)=>(
          <div key={i} style={{background:'white',borderRadius:12,padding:'16px 20px',border:`1px solid ${BORDER}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,color:TEXT2,fontWeight:600}}>{c.l}</span>
            <span style={{fontSize:14,color:TEXT,fontWeight:700}}>{c.v}</span>
          </div>
        ))}
      </div>
      <button onClick={()=>setShowLogin(true)} style={{width:'100%',marginTop:24,padding:'14px',borderRadius:10,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer'}}>Demander une démo gratuite →</button>
    </section>
  )

  const PageLegal=()=>(
    <section style={{padding:isMobile?'100px 20px 60px':'120px 0 80px',maxWidth:800,margin:'0 auto',paddingLeft:isMobile?20:48,paddingRight:isMobile?20:48}}>
      <h1 style={{fontSize:28,fontWeight:900,color:TEXT,marginBottom:32}}>Mentions légales</h1>
      <div style={{display:'flex',gap:8,marginBottom:32}}>
        {['cgu','confidentialite','rgpd'].map(s=>(
          <button key={s} onClick={()=>setLegalSection(s)} style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${legalSection===s?A:BORDER}`,background:legalSection===s?AG:'white',color:legalSection===s?A:TEXT2,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            {s==='cgu'?'CGU':s==='confidentialite'?'Confidentialité':'RGPD'}
          </button>
        ))}
      </div>
      <div style={{fontSize:14,color:TEXT2,lineHeight:1.8}}>
        {legalSection==='cgu'&&<><p><strong>1. Objet</strong> — Les présentes CGU régissent l'accès et l'utilisation de la plateforme Varman, éditée par SwitzerIT, basée en Suisse.</p><p><strong>2. Description</strong> — Varman est une solution SaaS de gestion d'équipes permettant la création de plannings, le badgeage par QR code, le suivi des présences et l'export de rapports.</p><p><strong>3. Accès</strong> — L'accès est réservé aux professionnels disposant d'un compte valide créé par leur établissement.</p><p><strong>6. Propriété intellectuelle</strong> — L'ensemble des éléments de Varman est la propriété exclusive de SwitzerIT. Toute reproduction non autorisée est interdite.</p></>}
        {legalSection==='confidentialite'&&<><p>Varman collecte uniquement les données nécessaires au fonctionnement du service : nom, email, horaires de travail et pointages.</p><p>Ces données sont hébergées en Europe sur des serveurs sécurisés et ne sont jamais revendues à des tiers.</p></>}
        {legalSection==='rgpd'&&<><p><strong>Engagement</strong> — Varman respecte le RGPD (UE 2016/679) pour les utilisateurs UE, ainsi que la nLPD suisse.</p><p>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Contactez-nous à contact@switzerit.com.</p></>}
      </div>
    </section>
  )



  // ══ SET PASSWORD MODAL ═══════════════════════════════════════════════
  function SetPasswordModal(){
    const [pwd,setPwd]=useState('')
    const [pwd2,setPwd2]=useState('')
    const [loading,setLoading]=useState(false)
    const [error,setError]=useState('')
    const inpStyle={width:'100%',padding:'12px 14px',borderRadius:10,border:'1.5px solid #e8e8e8',background:'#fafafa',fontSize:14,color:'#111',outline:'none',boxSizing:'border-box'}

    async function handleSetPassword(e){
      e.preventDefault()
      if(pwd.length<6){setError('Minimum 6 caractères');return}
      if(pwd!==pwd2){setError('Les mots de passe ne correspondent pas');return}
      setLoading(true)
      const {error:err} = await supabase.auth.updateUser({password:pwd})
      if(err){setError(err.message);setLoading(false);return}
      setSetPasswordMode(false)
      // Rediriger selon le rôle
      const {data:{session}} = await supabase.auth.getSession()
      if(session){
        const {data:p} = await supabase.from('profils').select('role').eq('user_id',session.user.id).single()
        if(p?.role==='gerant') navigate('/gerant')
        else navigate('/moi')
      }
    }

    return (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
        <div style={{background:'white',borderRadius:20,padding:34,width:'100%',maxWidth:370,boxShadow:'0 24px 64px rgba(0,0,0,.15)',border:'1px solid #e8e8e8'}}>
          <div style={{textAlign:'center',marginBottom:22}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" height="32"><text x="0" y="36" fontFamily="-apple-system,'Inter','Helvetica Neue',Arial,sans-serif" fontSize="38" fontWeight="900" letterSpacing="-1.5" fill="#0C1A35">varman</text><circle cx="152" cy="32" r="7" fill="#E11D48"/></svg>
            </div>
            <div style={{fontSize:20,fontWeight:800,color:'#111',letterSpacing:'-.03em'}}>Bienvenue sur Varman !</div>
            <div style={{fontSize:12,color:'#999',marginTop:4}}>Choisissez votre mot de passe pour accéder à votre espace</div>
          </div>
          <form onSubmit={handleSetPassword}>
            <div style={{marginBottom:13}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#555',marginBottom:6}}>Nouveau mot de passe</label>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Minimum 6 caractères" required style={inpStyle}
                onFocus={e=>e.target.style.borderColor='#E11D48'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#555',marginBottom:6}}>Confirmer le mot de passe</label>
              <input type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} placeholder="Répétez le mot de passe" required style={inpStyle}
                onFocus={e=>e.target.style.borderColor='#E11D48'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
            </div>
            {error&&<div style={{padding:'9px 12px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,fontSize:13,color:'#dc2626',marginBottom:14,fontWeight:600}}>{error}</div>}
            <button type="submit" disabled={loading} style={{width:'100%',height:48,borderRadius:11,border:'none',background:'#E11D48',color:'white',fontSize:15,fontWeight:700,cursor:'pointer',opacity:loading?.7:1}}>
              {loading?'Enregistrement...':'Créer mon mot de passe →'}
            </button>
          </form>
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
      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)} goPage={goPage}/>}
      {/* MODALE SET PASSWORD (invitation) */}
      {setPasswordMode&&<SetPasswordModal/>}
    </div>
  )
}
