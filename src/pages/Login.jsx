import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

const LOGO_SM = <svg width="24" height="17" viewBox="0 0 32 22" fill="none"><rect x="0" y="4" width="6" height="18" rx="3" fill="#0071e3"/><rect x="8.5" y="0" width="6" height="22" rx="3" fill="#0071e3"/><rect x="17" y="6" width="6" height="14" rx="3" fill="#0071e3" fillOpacity="0.4"/><rect x="25.5" y="3" width="6" height="10" rx="3" fill="#0071e3" fillOpacity="0.18"/></svg>

const Chk = ({size=14,color='#0071e3'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const Xmark = ({size=14,color='#ff3b30'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const Arr = ({size=16,color='white'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>

function QRDisplay() {
  const [seed, setSeed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fade, setFade] = useState(false)
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
      <div style={{background:'white',borderRadius:6,padding:7,opacity:fade?.2:1,transition:fade?'opacity .25s':'none',border:'1px solid #e5e5ea'}}>
        <svg width={tot} height={tot} viewBox={`0 0 ${tot} ${tot}`}>
          {cells.map(({r,c,v})=>{
            const x=c*(cs+1),y=r*(cs+1)
            const fill=isFixed(r,c)?(r===0||r===2||c===0||c===2||(r>=sz-3&&(c===0||c===2))?'#1d1d1f':'white'):(v?'#1d1d1f':'white')
            return <rect key={`${r}-${c}`} x={x} y={y} width={cs} height={cs} rx={0.5} fill={fill}/>
          })}
        </svg>
      </div>
      <div style={{width:76}}>
        <div style={{height:2,background:'#e5e5ea',borderRadius:1}}>
          <div style={{height:'100%',background:'#0071e3',borderRadius:1,width:`${progress}%`,transition:'width .1s linear'}}/>
        </div>
        <div style={{fontSize:9,color:'#8e8e93',textAlign:'center',marginTop:3,fontWeight:600}}>Renouvellement {Math.ceil(30-(progress*30/100))}s</div>
      </div>
    </div>
  )
}

function RoiCalc({isMobile}) {
  const [emp,setEmp]=useState(10)
  const [hrs,setHrs]=useState(3)
  const pertes=emp*hrs*4, cout=pertes*60, eco=cout*12
  return (
    <div style={{background:'white',border:'1px solid #e5e5ea',borderRadius:16,padding:isMobile?'24px':'36px',maxWidth:660,margin:'0 auto'}}>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:24,marginBottom:24}}>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#6e6e73',marginBottom:8}}>
            Nombre d'employés : <strong style={{color:'#1d1d1f'}}>{emp}</strong>
          </label>
          <input type="range" min="2" max="80" value={emp} onChange={e=>setEmp(Number(e.target.value))} style={{width:'100%',accentColor:'#0071e3',cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#aeaeb2',marginTop:3}}><span>2</span><span>80</span></div>
        </div>
        <div>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#6e6e73',marginBottom:8}}>
            Heures perdues / semaine : <strong style={{color:'#1d1d1f'}}>{hrs}h</strong>
          </label>
          <input type="range" min="1" max="15" value={hrs} onChange={e=>setHrs(Number(e.target.value))} style={{width:'100%',accentColor:'#0071e3',cursor:'pointer'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#aeaeb2',marginTop:3}}><span>1h</span><span>15h</span></div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:18}}>
        {[{v:`${pertes}h`,l:'perdues/mois',bg:'#fff2f1',bc:'#ffd0d0',c:'#b02020'},{v:cout.toLocaleString('fr-CH'),l:'CHF perdus/mois',bg:'#fff8ee',bc:'#ffd9a0',c:'#8a5a00'},{v:eco.toLocaleString('fr-CH'),l:'CHF économisés/an',bg:'#f0faf3',bc:'#b8e8c8',c:'#1a6b35'}].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.bc}`,borderRadius:12,padding:'16px',textAlign:'center'}}>
            <div style={{fontSize:isMobile?20:26,fontWeight:800,color:s.c,letterSpacing:'-.02em'}}>{s.v}</div>
            <div style={{fontSize:11,color:s.c,marginTop:4,fontWeight:500}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:'#f0f6ff',borderRadius:10,padding:'13px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <span style={{fontSize:13,color:'#0051a8',fontWeight:500}}>Kronvo vous économise <strong>{eco.toLocaleString('fr-CH')} CHF/an</strong> pour {emp} employés</span>
        <a href="/contact" style={{padding:'8px 16px',borderRadius:8,background:'#0071e3',color:'white',fontSize:13,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap'}}>Demander un devis →</a>
      </div>
    </div>
  )
}

function FaqSection() {
  const [open,setOpen]=useState(null)
  const faqs=[
    {q:"Combien de temps prend la mise en place ?",a:"En moyenne 2 à 4 heures avec notre équipe SwitzerIT. Configuration de l'établissement, import des employés, installation de la borne tablette et formation des gérants. Vous n'avez rien à faire techniquement."},
    {q:"Faut-il une tablette pour la borne QR ?",a:"Non, c'est optionnel. Vos employés peuvent scanner depuis leur smartphone iPhone ou Android. La borne tablette fixe est recommandée pour les établissements avec une entrée unique."},
    {q:"Que se passe-t-il si un employé oublie de badger ?",a:"Le gérant peut corriger manuellement les pointages depuis son tableau de bord à tout moment. L'historique complet est conservé pour chaque employé."},
    {q:"Est-ce que mes données sont sécurisées ?",a:"Oui. Données chiffrées en transit et au repos. Chaque établissement a ses données isolées. Conforme au RGPD européen et à la LPD suisse."},
    {q:"Peut-on personnaliser les postes selon notre activité ?",a:"Oui, chaque établissement configure ses propres postes depuis le tableau de bord. Un restaurant aura Cuisine, Salle, Bar. Une clinique aura Médecin, Infirmier, Accueil."},
    {q:"Y a-t-il un engagement minimum ?",a:"Non. Sans engagement de durée minimum. Arrêt possible avec un préavis de 30 jours. La démo est gratuite et sans obligation."},
    {q:"Comment fonctionne le support ?",a:"Support assuré par l'équipe SwitzerIT — des humains. Réponse par email sous 24h ouvrées. Les clients avec contrat de maintenance bénéficient d'une intervention sous 4 heures."},
  ]
  return (
    <div style={{maxWidth:660,margin:'0 auto'}}>
      {faqs.map((faq,i)=>(
        <div key={i} style={{borderBottom:'1px solid #e5e5ea'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 0',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:16}}>
            <span style={{fontSize:15,fontWeight:600,color:'#1d1d1f',lineHeight:1.4}}>{faq.q}</span>
            <span style={{fontSize:20,color:'#0071e3',flexShrink:0,fontWeight:300,transform:open===i?'rotate(45deg)':'none',transition:'transform .2s',display:'inline-block',lineHeight:1}}>{open===i?'−':'+'}</span>
          </button>
          {open===i&&<div style={{paddingBottom:16}}><p style={{fontSize:14,color:'#6e6e73',lineHeight:1.75,margin:0}}>{faq.a}</p></div>}
        </div>
      ))}
      <div style={{textAlign:'center',marginTop:24}}>
        <span style={{fontSize:14,color:'#6e6e73'}}>Autre question ? </span>
        <a href="/contact" style={{fontSize:14,color:'#0071e3',fontWeight:600,textDecoration:'none'}}>Contactez-nous →</a>
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

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#fff',color:'#888',fontFamily:'var(--font)'}}>Chargement...</div>

  const A='#0071e3',BG='#f5f5f7',SURF='#ffffff',BORDER='#e5e5ea'
  const TEXT='#1d1d1f',TEXT2='#6e6e73',TEXT3='#aeaeb2'
  const W={maxWidth:1100,margin:'0 auto',padding:isMobile?'0 20px':'0 56px'}

  const scrollTop=()=>window.scrollTo({top:0,behavior:'smooth'})
  const pageMap={'home':'/','fonctionnalites':'/fonctionnalites','tarifs':'/tarifs','contact':'/contact','legal':'/legal'}
  const goPage=(p)=>{navigate(pageMap[p]||'/'+p);scrollTop();setMenuOpen(false)}
  const path=location.pathname.replace('/','') || 'home'
  const page=path==='login'?'home':path||'home'
  const inp={width:'100%',padding:'12px 14px',borderRadius:10,border:`1.5px solid ${BORDER}`,background:BG,fontSize:15,color:TEXT,outline:'none',boxSizing:'border-box'}

  const SLabel=({t})=><div style={{fontSize:11,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>{t}</div>
  const STitle=({t,size})=><h2 style={{fontSize:isMobile?26:(size||36),fontWeight:800,color:TEXT,letterSpacing:'-.04em',marginBottom:12,lineHeight:1.1}}>{t}</h2>
  const SSub=({t})=><p style={{fontSize:15,color:TEXT2,lineHeight:1.7,marginBottom:0}}>{t}</p>

  const Nav=()=>(
    <>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:56,background:'rgba(255,255,255,.97)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',padding:'0 40px'}}>
        <div onClick={()=>goPage('home')} style={{display:'flex',alignItems:'center',gap:8,flex:1,cursor:'pointer'}}>
          {LOGO_SM}
          <span style={{fontSize:16,fontWeight:800,color:TEXT,letterSpacing:'-.04em'}}>Kronvo</span>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:20,background:'#e8f2fd',color:A,letterSpacing:'.04em',marginLeft:2}}>BETA</span>
        </div>
        {isMobile?(
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowLogin(true)} style={{padding:'7px 14px',borderRadius:8,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Connexion</button>
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{width:34,height:34,borderRadius:7,border:`1px solid ${BORDER}`,background:SURF,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}>
              <span style={{width:14,height:1.5,background:TEXT,borderRadius:1,display:'block'}}></span>
              <span style={{width:14,height:1.5,background:TEXT,borderRadius:1,display:'block'}}></span>
              <span style={{width:14,height:1.5,background:TEXT,borderRadius:1,display:'block'}}></span>
            </button>
          </div>
        ):(
          <div style={{display:'flex',gap:1,alignItems:'center'}}>
            {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([l,id])=>(
              <button key={id} onClick={()=>goPage(id)} style={{padding:'6px 13px',borderRadius:7,border:'none',background:page===id?'#f0f5ff':'transparent',color:page===id?A:TEXT2,fontSize:13,fontWeight:page===id?600:500,cursor:'pointer'}}>{l}</button>
            ))}
            <div style={{width:1,height:16,background:BORDER,margin:'0 10px'}}/>
            <button onClick={()=>setShowLogin(true)} style={{padding:'7px 15px',borderRadius:8,border:`1px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:13,fontWeight:500,cursor:'pointer'}}>Connexion</button>
            <button onClick={()=>goPage('contact')} style={{padding:'7px 15px',borderRadius:8,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',marginLeft:6}}>Demander une démo</button>
          </div>
        )}
      </nav>
      {isMobile&&menuOpen&&(
        <div style={{position:'fixed',top:56,left:0,right:0,zIndex:99,background:SURF,borderBottom:`1px solid ${BORDER}`,boxShadow:'0 8px 24px rgba(0,0,0,.08)',padding:'6px 0 16px'}}>
          {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']].map(([l,id])=>(
            <button key={id} onClick={()=>goPage(id)} style={{width:'100%',padding:'12px 24px',border:'none',background:'transparent',color:TEXT,fontSize:14,fontWeight:500,cursor:'pointer',textAlign:'left',display:'block'}}>{l}</button>
          ))}
          <div style={{margin:'8px 20px 0',paddingTop:12,borderTop:`1px solid ${BORDER}`}}>
            <button onClick={()=>{goPage('contact');setMenuOpen(false)}} style={{width:'100%',padding:'13px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
          </div>
        </div>
      )}
    </>
  )

  const Footer=()=>(
    <footer style={{background:TEXT,color:'white',padding:isMobile?'40px 20px 28px':'48px 0 28px'}}>
      <div style={W}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr 1fr 1fr',gap:isMobile?24:48,marginBottom:28}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>{LOGO_SM}<span style={{fontSize:15,fontWeight:800,letterSpacing:'-.03em'}}>Kronvo</span></div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.45)',lineHeight:1.8,maxWidth:220}}>La solution de gestion d'équipes pour les professionnels terrain.</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.25)',marginTop:12}}>Propulsé par <a href="https://switzerit.com" target="_blank" rel="noreferrer" style={{color:'rgba(255,255,255,.45)',textDecoration:'none',fontWeight:600}}>SwitzerIT</a></div>
          </div>
          {[
            {title:'Produit',links:[['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']]},
            {title:'Support',links:[['Contact','contact'],['Démo Teams','contact']]},
            {title:'Légal',links:[['CGU','legal'],['Confidentialité','legal'],['RGPD','legal'],['Cookies','legal']]},
          ].map(col=>(
            <div key={col.title}>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.3)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>{col.title}</div>
              {col.links.map(([l,p])=><div key={l} onClick={()=>goPage(p)} style={{fontSize:13,color:'rgba(255,255,255,.45)',marginBottom:9,cursor:'pointer'}}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:18,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,.25)'}}>© 2026 Kronvo by SwitzerIT · Suisse</div>
          <div style={{display:'flex',gap:14,fontSize:11}}>
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
      {/* 1. HERO — fond blanc, typographie grande noire */}
      <section style={{paddingTop:56,background:SURF,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{...W,padding:isMobile?'52px 20px 40px':'72px 56px 64px',display:isMobile?'block':'grid',gridTemplateColumns:'52% 48%',gap:56,alignItems:'center'}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 12px',borderRadius:20,background:'#f0f6ff',border:'1px solid rgba(0,113,227,.15)',marginBottom:24}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#34c759',display:'inline-block'}}></span>
              <span style={{fontSize:12,fontWeight:600,color:A}}>Planning · Badgeage QR · Présences</span>
            </div>
            <h1 style={{fontSize:isMobile?38:58,fontWeight:900,lineHeight:1.04,margin:'0 0 20px',letterSpacing:'-.05em',color:TEXT}}>
              Gérez vos équipes.<br/>
              <span style={{color:A}}>Sans la galère.</span>
            </h1>
            <p style={{fontSize:isMobile?15:17,color:TEXT2,lineHeight:1.75,marginBottom:32,maxWidth:420}}>
              Fini les feuilles de présence et les erreurs de paie. Kronvo centralise tout en un seul endroit, accessible depuis n'importe quel téléphone.
            </p>
            <div style={{display:'flex',gap:10,flexDirection:isMobile?'column':'row',marginBottom:24}}>
              <button onClick={()=>goPage('contact')} style={{padding:'14px 24px',borderRadius:11,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8,justifyContent:'center',boxShadow:'0 2px 12px rgba(0,113,227,.25)'}}>
                Demander une démo gratuite <Arr/>
              </button>
              <button onClick={()=>goPage('fonctionnalites')} style={{padding:'14px 20px',borderRadius:11,border:`1.5px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:15,fontWeight:600,cursor:'pointer'}}>
                Voir les fonctionnalités
              </button>
            </div>
            <div style={{display:'flex',gap:18,flexWrap:'wrap'}}>
              {['Démo gratuite','Sans engagement','Support humain'].map(t=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:5}}>
                  <Chk size={13}/>
                  <span style={{fontSize:12,color:TEXT3}}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {!isMobile&&(
            <div style={{background:'#fafafa',borderRadius:18,padding:16,border:`1px solid ${BORDER}`}}>
              <div style={{background:TEXT,borderRadius:11,padding:'10px 14px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'white'}}>Kronvo Dashboard</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,.4)',marginTop:1}}>Restaurant Le Bistrot · En direct</div>
                </div>
                <div style={{display:'flex',gap:4}}>
                  {['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{width:7,height:7,borderRadius:'50%',background:c}}></div>)}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:10}}>
                {[{v:'8',l:'Présents',bg:'#f0faf3',c:'#1a6b35'},{v:'3',l:'Absents',bg:'#fff2f1',c:'#b02020'},{v:'2',l:'En pause',bg:'#fff8ee',c:'#8a5a00'}].map((s,i)=>(
                  <div key={i} style={{background:s.bg,border:`1px solid ${BORDER}`,borderRadius:9,padding:'10px 6px',textAlign:'center'}}>
                    <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:9,color:s.c,fontWeight:600,marginTop:1}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:10,padding:'10px',marginBottom:10}}>
                <div style={{fontSize:9,fontWeight:700,color:TEXT3,letterSpacing:'.08em',marginBottom:7}}>ÉQUIPE EN DIRECT</div>
                {[{n:'Sophie Martin',p:'Cuisine',h:'09:02',s:'#34c759'},{n:'Marc Dupont',p:'Salle',h:'09:15',s:'#34c759'},{n:'Julie Bernard',p:'Bar',h:'En pause',s:'#ff9500'},{n:'Thomas Petit',p:'Cuisine',h:'Absent',s:'#e5e5ea'}].map((e,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'4px 7px',borderRadius:7,background:i%2===0?BG:'transparent',marginBottom:2}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'#e8f2fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:A,flexShrink:0,position:'relative'}}>
                      {e.n.split(' ').map(x=>x[0]).join('')}
                      <div style={{position:'absolute',bottom:0,right:0,width:6,height:6,borderRadius:'50%',background:e.s,border:'1.5px solid white'}}></div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,fontWeight:600,color:TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.n}</div>
                      <div style={{fontSize:8,color:TEXT3}}>{e.p}</div>
                    </div>
                    <span style={{fontSize:9,color:TEXT2}}>{e.h}</span>
                  </div>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:10}}>
                <QRDisplay/>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:TEXT,marginBottom:2}}>QR Code actif</div>
                  <div style={{fontSize:9,color:TEXT2,lineHeight:1.5}}>Employés scannent<br/>depuis leur téléphone</div>
                  <div style={{display:'flex',alignItems:'center',gap:3,marginTop:4}}>
                    <div style={{width:5,height:5,borderRadius:'50%',background:'#34c759'}}></div>
                    <span style={{fontSize:8,color:'#34c759',fontWeight:600}}>Sécurisé</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. BANDE SECTEURS — très épurée */}
      <section style={{background:BG,borderBottom:`1px solid ${BORDER}`,padding:'16px 0'}}>
        <div style={W}>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?10:24,justifyContent:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'.1em',textTransform:'uppercase'}}>Adapté pour</span>
            {['Restaurants','Hôtels','Cliniques','Garages','Commerce','BTP','Logistique'].map(s=>(
              <span key={s} style={{fontSize:13,color:TEXT2,fontWeight:500}}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. STATS — fond bleu profond */}
      <section style={{background:'#0f172a',padding:'36px 0'}}>
        <div style={W}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)'}}>
            {[{v:'2–4h',l:'mise en place',c:'#60a5fa'},{v:'30s',l:'par badgeage',c:'white'},{v:'8+',l:'secteurs',c:'white'},{v:'100%',l:'mobile',c:'white'}].map((s,i)=>(
              <div key={i} style={{textAlign:'center',borderRight:i<3?'1px solid rgba(255,255,255,.07)':'none',padding:isMobile?'8px 4px':'10px 20px'}}>
                <div style={{fontSize:isMobile?24:34,fontWeight:900,color:s.c,letterSpacing:'-.04em',lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:5}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROBLÈME / SOLUTION */}
      <section style={{background:SURF,padding:isMobile?'52px 20px':'80px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <SLabel t="Le problème"/>
            <STitle t="Vous perdez du temps chaque jour"/>
            <SSub t="Les feuilles papier, les appels inutiles et les erreurs de paie coûtent cher. Il existe une meilleure façon."/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16}}>
            <div style={{background:SURF,border:'1px solid #ffd0d0',borderRadius:16,padding:'28px',borderLeft:'3px solid #ff3b30'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:32,height:32,borderRadius:9,background:'#fff2f1',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Xmark/>
                </div>
                <span style={{fontSize:15,fontWeight:700,color:'#b02020'}}>Sans Kronvo</span>
              </div>
              {['Feuilles de présence papier perdues','Appels pour savoir qui est absent','Erreurs sur les bulletins de paie','Aucune visibilité en temps réel','Heures supplémentaires non tracées','Planning distribué par SMS'].map(p=>(
                <div key={p} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:11}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:'#fff2f1',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                    <Xmark size={9}/>
                  </div>
                  <span style={{fontSize:14,color:TEXT2,lineHeight:1.5}}>{p}</span>
                </div>
              ))}
            </div>
            <div style={{background:SURF,border:'1px solid #b8e8c8',borderRadius:16,padding:'28px',borderLeft:'3px solid #34c759'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:32,height:32,borderRadius:9,background:'#f0faf3',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Chk size={14} color="#34c759"/>
                </div>
                <span style={{fontSize:15,fontWeight:700,color:'#1a6b35'}}>Avec Kronvo</span>
              </div>
              {['Badgeage QR en 2 secondes','Tableau de bord en direct','Export PDF prêt pour la paie','Planning publié en un clic','Heures calculées automatiquement','Données sécurisées partout 24h/24'].map(p=>(
                <div key={p} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:11}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:'#f0faf3',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                    <Chk size={9} color="#34c759"/>
                  </div>
                  <span style={{fontSize:14,color:TEXT2,lineHeight:1.5}}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FONCTIONNALITÉS */}
      <section style={{background:BG,borderTop:`1px solid ${BORDER}`,padding:isMobile?'52px 20px':'80px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <SLabel t="Fonctionnalités"/>
            <STitle t="Tout ce dont vous avez besoin"/>
            <SSub t="Une solution complète pour les équipes terrain. Pas besoin de formation, ça marche dès le premier jour."/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:1,background:BORDER,borderRadius:16,overflow:'hidden',marginBottom:20}}>
            {[
              {icon:'📅',title:'Planning intelligent',desc:'Shifts simples ou coupés. Postes adaptés à votre secteur. Publication en un clic.',bg:'#e8f2fd',c:A},
              {icon:'📷',title:'Badgeage QR',desc:'QR renouvelé toutes les 30s. Scan depuis le téléphone. Borne tablette sécurisée.',bg:'#f0f0fc',c:'#5856d6'},
              {icon:'👥',title:'Présences live',desc:'Qui est là maintenant. Heures prévues vs pointées. Écarts calculés auto.',bg:'#f0faf3',c:'#1a6b35'},
              {icon:'📱',title:'App employé',desc:'Planning, badgeage, historique. Installable sur iPhone et Android.',bg:'#fff8ee',c:'#8a5a00'},
              {icon:'📄',title:'Export PDF',desc:'Rapports détaillés en un clic. Par employé, par période. Prêt pour la paie.',bg:'#fff2f1',c:'#b02020'},
              {icon:'🏢',title:'Multi-sites',desc:'Plusieurs établissements, un seul tableau de bord. Données isolées par site.',bg:'#fdf0f8',c:'#8a2060'},
            ].map((f,i)=>(
              <div key={i} style={{background:SURF,padding:'24px 20px',transition:'background .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#fafafa'}}
              onMouseLeave={e=>{e.currentTarget.style.background=SURF}}>
                <div style={{width:40,height:40,borderRadius:11,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginBottom:14}}>{f.icon}</div>
                <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>{f.title}</div>
                <div style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center'}}>
            <button onClick={()=>goPage('fonctionnalites')} style={{padding:'10px 20px',borderRadius:9,border:`1px solid ${BORDER}`,background:SURF,color:A,fontSize:13,fontWeight:600,cursor:'pointer'}}>
              Voir toutes les fonctionnalités →
            </button>
          </div>
        </div>
      </section>

      {/* 6. COMMENT CA MARCHE */}
      <section style={{background:SURF,borderTop:`1px solid ${BORDER}`,padding:isMobile?'52px 20px':'80px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <SLabel t="Mise en place"/>
            <STitle t="En place en 2 à 4 heures"/>
            <SSub t="Notre équipe SwitzerIT s'occupe de tout. Vous n'avez rien à faire techniquement."/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:12}}>
            {[
              {n:'01',title:'Démo gratuite',desc:'On vous présente Kronvo en 30 min, adapté à votre secteur.',emoji:'📹'},
              {n:'02',title:'On configure tout',desc:'SwitzerIT s\'occupe de tout. Établissements, employés, borne.',emoji:'⚙️'},
              {n:'03',title:'Formation incluse',desc:'Gérants et employés formés. Documentation fournie.',emoji:'🎓'},
              {n:'04',title:"C'est parti !",desc:'Vos équipes scannent le QR. Vous suivez en temps réel.',emoji:'🚀'},
            ].map((s,i)=>(
              <div key={i} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px 16px',position:'relative'}}>
                <div style={{position:'absolute',top:14,right:14,fontSize:24}}>{s.emoji}</div>
                <div style={{width:32,height:32,borderRadius:9,background:'#e8f2fd',color:A,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,marginBottom:12}}>{s.n}</div>
                <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>{s.title}</div>
                <div style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CALCULATEUR ROI */}
      <section style={{background:BG,borderTop:`1px solid ${BORDER}`,padding:isMobile?'52px 20px':'80px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <SLabel t="Calculateur"/>
            <STitle t="Combien perdez-vous chaque mois ?"/>
            <SSub t="Estimez le vrai coût avant Kronvo."/>
          </div>
          <RoiCalc isMobile={isMobile}/>
        </div>
      </section>

      {/* 8. FAQ */}
      <section style={{background:SURF,borderTop:`1px solid ${BORDER}`,padding:isMobile?'52px 20px':'80px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <SLabel t="FAQ"/>
            <STitle t="Questions fréquentes"/>
            <SSub t="Tout ce que vous voulez savoir avant de commencer."/>
          </div>
          <FaqSection/>
        </div>
      </section>

      {/* 9. SECTEURS */}
      <section style={{background:BG,borderTop:`1px solid ${BORDER}`,padding:isMobile?'44px 20px':'56px 0'}}>
        <div style={W}>
          <div style={{textAlign:'center',marginBottom:28}}>
            <SLabel t="Secteurs"/>
            <STitle t="Pour tous les professionnels" size={30}/>
            <SSub t="Postes et termes adaptés à votre secteur d'activité"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(5,1fr)',gap:8}}>
            {[{icon:'🍽️',l:'Restaurants'},{icon:'🏨',l:'Hôtels'},{icon:'🏥',l:'Cliniques'},{icon:'🔧',l:'Garages'},{icon:'🏪',l:'Commerce'},{icon:'💆',l:'Spas & Salons'},{icon:'🏗️',l:'BTP'},{icon:'📦',l:'Logistique'},{icon:'🎓',l:'Éducation'},{icon:'🛡️',l:'Sécurité'}].map(s=>(
              <div key={s.l} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:12,padding:'14px',textAlign:'center',cursor:'default',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=A;e.currentTarget.style.background='#f0f6ff'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.background=SURF}}>
                <div style={{fontSize:22,marginBottom:5}}>{s.icon}</div>
                <div style={{fontSize:12,fontWeight:600,color:TEXT2}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CTA FINAL — fond bleu uni propre */}
      <section style={{background:A,padding:isMobile?'64px 20px':'80px 0'}}>
        <div style={{...W,textAlign:'center'}}>
          <h2 style={{fontSize:isMobile?30:44,fontWeight:900,color:'white',letterSpacing:'-.05em',marginBottom:14,lineHeight:1.06}}>
            Prêt à gagner du temps chaque jour ?
          </h2>
          <p style={{fontSize:16,color:'rgba(255,255,255,.75)',marginBottom:36,lineHeight:1.7,maxWidth:440,margin:'0 auto 36px'}}>
            Démo gratuite via Teams, sans engagement. Notre équipe s'occupe de tout.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexDirection:isMobile?'column':'row',padding:isMobile?'0 20px':0}}>
            <button onClick={()=>goPage('contact')} style={{padding:'15px 28px',borderRadius:12,border:'none',background:'white',color:A,fontSize:15,fontWeight:800,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:9,justifyContent:'center'}}>
              Réserver ma démo gratuite <Arr color={A}/>
            </button>
            <button onClick={()=>setShowLogin(true)} style={{padding:'15px 22px',borderRadius:12,border:'2px solid rgba(255,255,255,.3)',background:'transparent',color:'white',fontSize:15,fontWeight:600,cursor:'pointer'}}>
              Déjà client — Se connecter
            </button>
          </div>
          <div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginTop:14}}>Démo gratuite · Sans carte bancaire · Réponse sous 24h</div>
        </div>
      </section>
    </>
  )

  const PageFeatures=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'40px 20px':'56px 56px'}}>
        <div style={{textAlign:'center',marginBottom:44}}>
          <SLabel t="Fonctionnalités"/>
          <STitle t="Tout ce que Kronvo peut faire" size={44}/>
          <SSub t="Une solution pensée pour les équipes terrain."/>
        </div>
        {[
          {icon:'📅',title:'Planning intelligent',color:'#e8f2fd',ic:A,items:['Shifts simples ou coupés','Vue semaine desktop, vue jour mobile','Postes personnalisables selon votre secteur','Publication en un clic','Modification rapide par clic']},
          {icon:'📷',title:'Badgeage QR Code sécurisé',color:'#f0faf3',ic:'#1a6b35',items:['QR dynamique renouvelé toutes les 30s','Scan depuis le smartphone','Vérification de l\'établissement','Badgeage multiple dans la journée','Borne tablette avec PIN sécurisé']},
          {icon:'👥',title:'Suivi des présences',color:'#fff8ee',ic:'#8a4a00',items:['Temps réel — qui est présent','Heures planifiées vs pointées','Calcul automatique des écarts','Historique complet par date','Correction manuelle par le gérant']},
          {icon:'📄',title:'Rapports et export PDF',color:'#fff2f1',ic:'#b02020',items:['Rapports PDF professionnels','Filtrage par période','Détail par employé','Total heures et écarts','Export en un clic']},
          {icon:'📱',title:'Espace employé mobile',color:'#f0f0fc',ic:'#3a3880',items:['Installable sur iPhone et Android','Planning personnel à jour','Bouton scan QR intégré','Historique des pointages','Consultable hors connexion']},
          {icon:'🏢',title:'Multi-établissements',color:'#fdf0f8',ic:'#8a2060',items:['Plusieurs sites, un tableau de bord','Données isolées par établissement','Dashboard super admin SwitzerIT','Ajout de sites rapidement']},
        ].map((f,i)=>(
          <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:isMobile?'20px':'26px',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:46,height:46,background:f.color,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{f.icon}</div>
              <div style={{fontSize:isMobile?17:20,fontWeight:800,color:TEXT}}>{f.title}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(190px,1fr))',gap:8}}>
              {f.items.map((item,j)=>(
                <div key={j} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'9px 12px',background:f.color,borderRadius:8}}>
                  <div style={{flexShrink:0,marginTop:1}}><Chk size={11} color={f.ic}/></div>
                  <span style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:'#f0f6ff',border:'1px solid rgba(0,113,227,.12)',borderRadius:14,padding:'28px',textAlign:'center',marginTop:8}}>
          <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:10}}>Fonctionnalités à venir</div>
          <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:18}}>
            {['Notifications email','Analytics avancées','Intégration paie','Messagerie équipe','Multi-langue'].map(f=>(
              <span key={f} style={{padding:'6px 13px',borderRadius:20,background:'rgba(0,113,227,.08)',border:'1px solid rgba(0,113,227,.15)',fontSize:12,fontWeight:600,color:A}}>{f}</span>
            ))}
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'11px 22px',borderRadius:9,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
        </div>
      </div>
    </div>
  )

  const PagePricing=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'40px 20px':'56px 56px'}}>
        <div style={{textAlign:'center',marginBottom:44}}>
          <SLabel t="Tarifs"/>
          <STitle t="Tarification sur mesure" size={44}/>
          <SSub t="Devis personnalisé selon vos besoins. Démo gratuite via Teams incluse."/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:14,marginBottom:20}}>
          {[
            {name:'Mise en place',icon:'🚀',color:'#e8f2fd',ic:A,desc:'Installation et configuration complète par SwitzerIT.',items:['Création compte','Paramétrage établissements','Import des employés','Installation borne tablette','Formation gérant','Documentation fournie'],tag:'Sur devis',featured:false},
            {name:'Abonnement mensuel',icon:'📅',color:'#f0faf3',ic:'#1a6b35',desc:'Accès complet à Kronvo pour votre établissement.',items:['Planning et badgeage illimités','Tous les employés inclus','Rapports PDF','Support email réactif','Mises à jour automatiques','Hébergement sécurisé Suisse'],tag:'Sur devis · en CHF',featured:true},
            {name:'Support & maintenance',icon:'🛡️',color:'#fff8ee',ic:'#8a4a00',desc:"Accompagnement continu pour votre sérénité.",items:['Support prioritaire','Intervention sous 4h','Formations supplémentaires','Évolutions personnalisées','Suivi trimestriel','SLA garanti'],tag:'Options disponibles',featured:false},
          ].map((plan,i)=>(
            <div key={i} style={{background:SURF,border:plan.featured?`2px solid ${A}`:`1px solid ${BORDER}`,borderRadius:16,padding:'24px',display:'flex',flexDirection:'column',position:'relative',boxShadow:plan.featured?'0 4px 24px rgba(0,113,227,.1)':'none'}}>
              {plan.featured&&<div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',padding:'3px 14px',borderRadius:20,background:A,color:'white',fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>RECOMMANDÉ</div>}
              <div style={{width:40,height:40,background:plan.color,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginBottom:12}}>{plan.icon}</div>
              <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:5}}>{plan.name}</div>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.5,marginBottom:14}}>{plan.desc}</div>
              <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:16,flex:1}}>
                {plan.items.map(f=>(
                  <div key={f} style={{display:'flex',alignItems:'flex-start',gap:9,fontSize:13,color:TEXT2}}>
                    <div style={{flexShrink:0,marginTop:2}}><Chk size={11} color={plan.ic}/></div>{f}
                  </div>
                ))}
              </div>
              <div style={{padding:'9px 14px',background:plan.color,borderRadius:9,fontSize:13,fontWeight:700,color:plan.ic,textAlign:'center',marginBottom:12}}>{plan.tag}</div>
              <button onClick={()=>goPage('contact')} style={{width:'100%',height:42,borderRadius:10,border:plan.featured?'none':`1.5px solid ${A}`,background:plan.featured?A:'transparent',color:plan.featured?'white':A,fontSize:13,fontWeight:700,cursor:'pointer'}}>Demander un devis</button>
            </div>
          ))}
        </div>
        <div style={{background:'#f0f6ff',border:'1px solid rgba(0,113,227,.15)',borderRadius:14,padding:'22px 24px',display:'flex',alignItems:isMobile?'flex-start':'center',gap:16,flexDirection:isMobile?'column':'row'}}>
          <div style={{fontSize:32,flexShrink:0}}>📹</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:4}}>Démo gratuite via Teams</div>
            <div style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>30 minutes pour voir Kronvo adapté à votre secteur. Repartez avec un devis personnalisé.</div>
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'12px 20px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',flexShrink:0,width:isMobile?'100%':'auto'}}>Réserver ma démo →</button>
        </div>
      </div>
    </div>
  )

  const PageContact=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{...W,padding:isMobile?'40px 20px':'56px 56px'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <SLabel t="Contact"/>
          <STitle t="Parlons de votre projet" size={42}/>
          <SSub t="Nous vous recontactons sous 24h pour une démo Teams gratuite."/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.2fr 1fr',gap:20}}>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'26px'}}>
            {contactSent?(
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{width:60,height:60,borderRadius:'50%',background:'#f0faf3',border:'1px solid #b8e8c8',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
                  <Chk size={26} color="#34c759"/>
                </div>
                <div style={{fontSize:21,fontWeight:800,color:TEXT,marginBottom:8}}>Demande envoyée !</div>
                <div style={{fontSize:14,color:TEXT2,lineHeight:1.7,marginBottom:18}}>Notre équipe vous contactera sous 24h pour organiser la démo Teams.</div>
                <button onClick={()=>{setContactSent(false);setContactForm({nom:'',email:'',entreprise:'',secteur:'',message:''})}} style={{padding:'10px 20px',borderRadius:9,border:`1px solid ${BORDER}`,background:BG,color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Nouvelle demande</button>
              </div>
            ):(
              <>
                <div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:4}}>Demander une démo Teams</div>
                <div style={{fontSize:12,color:TEXT2,marginBottom:20}}>Gratuite · 30 min · Sans engagement</div>
                {[{f:'nom',l:'Nom complet *',ph:'Jean Dupont',t:'text'},{f:'email',l:'Email *',ph:'jean@exemple.fr',t:'email'},{f:'entreprise',l:"Établissement *",ph:'Mon Établissement',t:'text'}].map(({f,l,ph,t})=>(
                  <div key={f} style={{marginBottom:12}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:5}}>{l}</label>
                    <input type={t} placeholder={ph} value={contactForm[f]} onChange={e=>setContactForm(ff=>({...ff,[f]:e.target.value}))} style={inp}
                    onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                  </div>
                ))}
                <div style={{marginBottom:12}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:5}}>Secteur</label>
                  <select value={contactForm.secteur} onChange={e=>setContactForm(f=>({...f,secteur:e.target.value}))} style={{...inp,appearance:'auto'}}>
                    <option value="">Sélectionner...</option>
                    {['Restaurant','Hôtel','Garage','Commerce','Clinique','Spa & Salon','BTP','Logistique','Éducation','Autre'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:5}}>Message (optionnel)</label>
                  <textarea placeholder="Nombre d'employés, besoin spécifique..." value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} rows={3}
                  style={{...inp,resize:'vertical',fontFamily:'var(--font)'}}
                  onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                </div>
                <button onClick={()=>{if(!contactForm.nom||!contactForm.email||!contactForm.entreprise){alert('Remplis les champs obligatoires');return}setContactSent(true)}}
                style={{width:'100%',height:50,borderRadius:11,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer'}}>
                  Envoyer ma demande →
                </button>
                <div style={{fontSize:11,color:TEXT3,textAlign:'center',marginTop:8}}>Réponse sous 24h · Démo Teams offerte</div>
              </>
            )}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{background:'#0f172a',borderRadius:14,padding:'22px',color:'white'}}>
              <div style={{fontSize:32,marginBottom:12}}>📹</div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>Démo Teams gratuite</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.7}}>30 min pour voir Kronvo en action. Repartez avec un devis personnalisé.</div>
            </div>
            {[{icon:'🚀',title:'Mise en place par SwitzerIT',desc:"Notre équipe s'occupe de tout."},{icon:'🇨🇭',title:'Facturation en CHF',desc:'Sans conversion ni frais cachés.'}].map((info,i)=>(
              <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px',display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{fontSize:22,flexShrink:0}}>{info.icon}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:3}}>{info.title}</div>
                  <div style={{fontSize:12,color:TEXT2}}>{info.desc}</div>
                </div>
              </div>
            ))}
            <div style={{background:'#f0f6ff',border:'1px solid rgba(0,113,227,.15)',borderRadius:12,padding:'16px'}}>
              <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:5}}>Déjà client ?</div>
              <div style={{fontSize:12,color:TEXT2,marginBottom:10}}>Accédez à votre espace gérant.</div>
              <button onClick={()=>setShowLogin(true)} style={{padding:'8px 16px',borderRadius:8,border:'none',background:A,color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>Se connecter →</button>
            </div>
            <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px'}}>
              <div style={{fontSize:12,fontWeight:700,color:TEXT,marginBottom:8}}>Contact direct</div>
              <div style={{fontSize:12,color:TEXT2,marginBottom:4}}>📧 contact@switzerit.com</div>
              <div style={{fontSize:12,color:TEXT2,marginBottom:4}}>🌐 switzerit.com</div>
              <div style={{fontSize:12,color:TEXT2}}>🇨🇭 Basé en Suisse</div>
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
        {h:"4. Obligations",t:"L'utilisateur s'engage à fournir des informations exactes, maintenir la confidentialité de ses identifiants, utiliser le service conformément à sa destination."},
        {h:"5. Responsabilité",t:"Sa responsabilité est limitée au montant des sommes versées au cours des 12 derniers mois."},
        {h:"6. Propriété intellectuelle",t:"L'ensemble des éléments de Kronvo est la propriété exclusive de SwitzerIT. Toute reproduction non autorisée est interdite."},
        {h:"7. Résiliation",t:"Chaque partie peut résilier avec un préavis de 30 jours."},
        {h:"8. Droit applicable",t:"Les CGU sont soumises au droit suisse. Les tribunaux du canton de Vaud sont seuls compétents."},
      ]},
      confidentialite:{title:"Politique de Confidentialité",last:"11 mai 2026",content:[
        {h:"Responsable",t:"SwitzerIT, basé en Suisse. Contact : contact@switzerit.com"},
        {h:"Données collectées",t:"Données d'identification (nom, prénom, email), données professionnelles, données de pointage."},
        {h:"Finalités",t:"Gestion des comptes, fonctionnement du service, génération de rapports."},
        {h:"Conservation",t:"Durée du contrat + 3 ans. Données de pointage conservées 5 ans."},
        {h:"Partage",t:"Les données ne sont jamais vendues. Partagées uniquement avec nos sous-traitants (Supabase, Vercel) avec garanties contractuelles."},
        {h:"Vos droits",t:"Conformément à la LPD suisse et au RGPD, droits d'accès, rectification, effacement, portabilité. Contact : contact@switzerit.com"},
        {h:"Sécurité",t:"Données chiffrées en transit et au repos. Authentification sécurisée."},
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
                  <button key={id} onClick={()=>setLegalSection(id)} style={{padding:'7px 14px',borderRadius:20,border:'none',background:legalSection===id?A:'transparent',color:legalSection===id?'white':TEXT2,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{label}</button>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'22px'}}>
                <div style={{fontSize:10,color:TEXT3,marginBottom:5}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:22,fontWeight:900,color:TEXT,marginBottom:18}}>{s.title}</h1>
                {s.content.map((block,i)=>(<div key={i} style={{marginBottom:18}}><h2 style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:5}}>{block.h}</h2><p style={{fontSize:13,color:TEXT2,lineHeight:1.7,margin:0}}>{block.t}</p></div>))}
                <div style={{marginTop:20,padding:'12px 14px',background:'#f0f6ff',borderRadius:9,fontSize:13,color:A}}><strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a></div>
              </div>
            </>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'190px 1fr',gap:24,alignItems:'start'}}>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 12px',position:'sticky',top:72}}>
                <div style={{fontSize:10,fontWeight:700,color:TEXT3,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Légal</div>
                {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
                  <button key={id} onClick={()=>setLegalSection(id)} style={{width:'100%',padding:'8px 11px',borderRadius:8,border:'none',background:legalSection===id?'#f0f6ff':'transparent',color:legalSection===id?A:TEXT2,fontSize:13,fontWeight:legalSection===id?600:400,cursor:'pointer',textAlign:'left',marginBottom:2,display:'block'}}>{label}</button>
                ))}
              </div>
              <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'32px'}}>
                <div style={{fontSize:10,color:TEXT3,marginBottom:6}}>Mise à jour : {s.last}</div>
                <h1 style={{fontSize:26,fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:22}}>{s.title}</h1>
                {s.content.map((block,i)=>(<div key={i} style={{marginBottom:20}}><h2 style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>{block.h}</h2><p style={{fontSize:13,color:TEXT2,lineHeight:1.75,margin:0}}>{block.t}</p></div>))}
                <div style={{marginTop:28,padding:'14px 18px',background:'#f0f6ff',borderRadius:10,fontSize:13,color:A}}><strong>Des questions ?</strong> <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a></div>
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
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:SURF,borderRadius:18,padding:isMobile?'22px 18px':30,width:'100%',maxWidth:360,boxShadow:'0 24px 64px rgba(0,0,0,.15)',border:`1px solid ${BORDER}`,position:'relative'}}>
            <button onClick={()=>setShowLogin(false)} style={{position:'absolute',top:14,right:14,width:28,height:28,borderRadius:'50%',border:`1px solid ${BORDER}`,background:BG,color:TEXT2,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>{LOGO_SM}</div>
              <div style={{fontSize:19,fontWeight:800,color:TEXT,letterSpacing:'-.03em'}}>Connexion</div>
              <div style={{fontSize:12,color:TEXT2,marginTop:3}}>Accédez à votre espace Kronvo</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:5}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required style={inp}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:TEXT2,marginBottom:5}}>Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={inp}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              {error&&<div style={{padding:'9px 12px',background:'#fff2f1',border:'1px solid rgba(255,59,48,.2)',borderRadius:9,fontSize:13,color:'#b02020',marginBottom:14,fontWeight:600}}>{error}</div>}
              <button type="submit" style={{width:'100%',height:46,borderRadius:10,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer'}}>Se connecter</button>
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
