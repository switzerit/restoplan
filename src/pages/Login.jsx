import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  function openLogin(){setShowLogin(true)}
  function closeLogin(){setShowLogin(false)}
  const [_page, _setPage] = useState('home')
  const [legalSection, setLegalSection] = useState('cgu')
  const [contactForm, setContactForm] = useState({nom:'',email:'',entreprise:'',secteur:'',message:''})
  const [contactSent, setContactSent] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    supabase.auth.getSession().then(async({data})=>{
      if(data.session){
        const {data:profil} = await supabase.from('profils').select('role').eq('user_id',data.session.user.id).single()
        if(profil?.role==='super_admin') navigate('/admin')
        else if(profil?.role==='gerant') navigate('/gerant')
        else navigate('/moi')
      } else { setLoading(false); if(location.pathname==='/login') openLogin() }
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
  const goPage=(p)=>{navigate(pageMap[p]||'/'+p);scrollTop()}
  const path=location.pathname.replace('/','') || 'home'
  const page=path==='login'?'home':path||'home'
  const inp={width:'100%',padding:'10px 12px',borderRadius:9,border:`1.5px solid ${BORDER}`,background:BG,fontSize:13,color:TEXT,outline:'none'}

  const Nav=()=>(
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:56,background:'rgba(255,255,255,.92)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',padding:'0 28px',gap:8}}>
      <div onClick={()=>goPage('home')} style={{display:'flex',alignItems:'center',gap:8,flex:1,cursor:'pointer'}}>
        <div style={{width:30,height:30,background:A,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'white',fontWeight:800}}>P</div>
        <span style={{fontSize:16,fontWeight:800,color:TEXT,letterSpacing:'-.02em'}}>PlanPro</span>
        <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'#e8f2fd',color:A,marginLeft:2}}>Beta</span>
      </div>
      <div style={{display:'flex',gap:4,alignItems:'center'}}>
        {[['Accueil','home'],['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Légal','legal'],['Contact','contact']].map(([label,id])=>(
          <button key={id} onClick={()=>goPage(id)} style={{padding:'6px 14px',borderRadius:8,border:'none',background:page===id?'#e8f2fd':'transparent',color:page===id?A:TEXT2,fontSize:13,fontWeight:600,cursor:'pointer'}}>{label}</button>
        ))}
        <div style={{width:1,height:20,background:BORDER,margin:'0 8px'}}/>
        <button onClick={()=>openLogin()} style={{padding:'7px 16px',borderRadius:9,border:`1px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Connexion</button>
        <button onClick={()=>goPage('contact')} style={{padding:'7px 16px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Demander une démo</button>
      </div>
    </nav>
  )

  const Footer=()=>(
    <footer style={{background:TEXT,color:'white',padding:'48px 32px 32px'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:40,marginBottom:40}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <div style={{width:28,height:28,background:A,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'white',fontWeight:800}}>P</div>
              <span style={{fontSize:16,fontWeight:800}}>PlanPro</span>
            </div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.7,maxWidth:220}}>La solution de gestion d'équipes pour tous les professionnels.</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.3)',marginTop:12}}>Propulsé par <a href="https://switzerit.com" target="_blank" style={{color:'rgba(255,255,255,.5)',textDecoration:'none',fontWeight:600}}>SwitzerIT</a></div>
          </div>
          {[
            {title:'Produit',links:[['Fonctionnalités','fonctionnalites'],['Tarifs','tarifs'],['Contact','contact']]},
            {title:'Support',links:[['Contact','contact'],['Démo Teams','contact']]},
            {title:'Légal',links:[['CGU','legal'],['Confidentialité','legal'],['RGPD','legal'],['Cookies','legal']]},
          ].map(col=>(
            <div key={col.title}>
              <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.4)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:14}}>{col.title}</div>
              {col.links.map(([l,p])=><div key={l} onClick={()=>goPage(p)} style={{fontSize:13,color:'rgba(255,255,255,.5)',marginBottom:9,cursor:'pointer'}}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,.3)'}}>© 2026 PlanPro by SwitzerIT · Siège social : Suisse · Tous droits réservés.</div>
          <div style={{display:'flex',gap:16,fontSize:12}}>
            {[['Confidentialité','legal'],['CGU','legal'],['RGPD','legal']].map(([l,p])=>(
              <span key={l} onClick={()=>goPage(p)} style={{color:'rgba(255,255,255,.3)',cursor:'pointer'}}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )

  const PageHome=()=>(
    <>
      <section style={{paddingTop:56,background:`linear-gradient(180deg,#f0f7ff 0%,${BG} 100%)`}}>
        <div style={{maxWidth:900,margin:'0 auto',padding:'80px 24px 80px',textAlign:'center'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:20,background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',marginBottom:24}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:GREEN,boxShadow:`0 0 8px ${GREEN}`,display:'inline-block'}}></span>
            <span style={{fontSize:12,fontWeight:600,color:A}}>Nouveau · Badgeage QR Code sécurisé</span>
          </div>
          <h1 style={{fontSize:'clamp(36px,6vw,62px)',fontWeight:900,lineHeight:1.08,margin:'0 auto 20px',maxWidth:720,letterSpacing:'-.03em',color:TEXT}}>
            Le planning et le badgeage<br/><span style={{color:A}}>réinventés.</span>
          </h1>
          <p style={{fontSize:'clamp(15px,2vw,18px)',color:TEXT2,maxWidth:540,margin:'0 auto 36px',lineHeight:1.7}}>
            PlanPro centralise la gestion des plannings, le badgeage QR code et le suivi des présences pour toutes vos équipes terrain.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:40}}>
            <button onClick={()=>goPage('contact')} style={{padding:'14px 32px',borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.3)'}}>Demander une démo →</button>
            <button onClick={()=>goPage('fonctionnalites')} style={{padding:'14px 28px',borderRadius:12,border:`1px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:15,fontWeight:600,cursor:'pointer'}}>Voir les fonctionnalités</button>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:24,flexWrap:'wrap'}}>
            {['📱 iOS & Android','🔒 Données hébergées en Suisse','⚡ Déploiement < 5 min','🤝 Accompagnement inclus'].map(t=>(
              <span key={t} style={{fontSize:12,color:TEXT3,fontWeight:500}}>{t}</span>
            ))}
          </div>
        </div>
      </section>
      <section style={{background:SURF,borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`,padding:'36px 24px'}}>
        <div style={{maxWidth:800,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,textAlign:'center'}}>
          {[{v:'< 5 min',l:'déploiement'},{v:'100%',l:'mobile-first'},{v:'24/7',l:'disponibilité'},{v:'CHF',l:'tarification locale'}].map((s,i)=>(
            <div key={i}><div style={{fontSize:26,fontWeight:900,color:A,letterSpacing:'-.02em'}}>{s.v}</div><div style={{fontSize:13,color:TEXT2,marginTop:4}}>{s.l}</div></div>
          ))}
        </div>
      </section>
      <section style={{padding:'80px 24px',maxWidth:1000,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Fonctionnalités clés</div>
          <div style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:800,letterSpacing:'-.02em',color:TEXT,marginBottom:10}}>Tout ce dont vous avez besoin</div>
          <div style={{fontSize:15,color:TEXT2}}>Une solution complète, sans complexité inutile</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          {[
            {icon:'📅',color:'#e8f2fd',title:'Planning intelligent',desc:'Shifts simples ou coupés, vue semaine, publication en un clic.'},
            {icon:'📷',color:'#f0faf3',title:'Badgeage QR Code',desc:'QR dynamique toutes les 30s. Scan depuis le téléphone. Sécurisé par établissement.'},
            {icon:'👥',color:'#fff8ee',title:'Présences en direct',desc:'Qui est là ? Heures prévues vs pointées, écarts calculés automatiquement.'},
            {icon:'📱',color:'#f0f0fc',title:'App employé',desc:'Planning perso, badgeage mobile. Chaque employé a son espace connecté.'},
            {icon:'📄',color:'#fff2f1',title:'Rapports PDF',desc:'Rapports de présence pour la paie, par période et par employé.'},
            {icon:'🏢',color:'#fdf0f8',title:'Multi-sites',desc:'Gérez plusieurs établissements depuis un seul tableau de bord.'},
          ].map((f,i)=>(
            <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'22px 20px',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=A;e.currentTarget.style.boxShadow='0 8px 24px rgba(0,113,227,.08)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.boxShadow='none'}}>
              <div style={{width:44,height:44,background:f.color,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:14}}>{f.icon}</div>
              <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:7}}>{f.title}</div>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:32}}>
          <button onClick={()=>goPage('fonctionnalites')} style={{padding:'11px 24px',borderRadius:10,border:`1px solid ${BORDER}`,background:SURF,color:A,fontSize:13,fontWeight:700,cursor:'pointer'}}>Voir toutes les fonctionnalités →</button>
        </div>
      </section>
      <section style={{padding:'60px 24px',background:SURF,borderTop:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Secteurs</div>
          <div style={{fontSize:'clamp(20px,3vw,28px)',fontWeight:800,color:TEXT,marginBottom:8}}>Pour tous les professionnels</div>
          <div style={{fontSize:14,color:TEXT2,marginBottom:32}}>PlanPro s'adapte à n'importe quel secteur avec des équipes terrain</div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            {["🍽️ Restaurants","🏨 Hôtels","🔧 Garages","🏪 Commerce","🏥 Cliniques","💆 Spas","🏗️ BTP","📦 Logistique","🎓 Éducation","🛡️ Sécurité"].map(s=>(
              <span key={s} style={{padding:'8px 16px',borderRadius:20,background:BG,border:`1px solid ${BORDER}`,fontSize:13,fontWeight:600,color:TEXT2}}>{s}</span>
            ))}
          </div>
        </div>
      </section>
      <section style={{padding:'80px 24px',maxWidth:900,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Mise en place</div>
          <div style={{fontSize:'clamp(22px,3.5vw,32px)',fontWeight:800,color:TEXT,marginBottom:8}}>Opérationnel en 5 minutes</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
          {[
            {n:'1',title:'Contactez-nous',desc:'Démo Teams gratuite pour présenter la solution et configurer votre compte.'},
            {n:'2',title:'On installe ensemble',desc:"Notre équipe SwitzerIT configure tout pour vous : établissement, employés, borne."},
            {n:'3',title:'Formation incluse',desc:"Vos gérants et employés sont formés à l'utilisation en 30 minutes."},
            {n:'4',title:"C'est parti !",desc:'Vos employés scannent le QR code. Vous suivez les présences en direct.'},
          ].map((s,i)=>(
            <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px 18px'}}>
              <div style={{width:32,height:32,borderRadius:10,background:'#e8f2fd',color:A,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,marginBottom:12}}>{s.n}</div>
              <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>{s.title}</div>
              <div style={{fontSize:12,color:TEXT2,lineHeight:1.5}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{padding:'80px 24px',background:`linear-gradient(135deg,#e8f2fd,#f0f0fc)`,borderTop:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:560,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:'clamp(24px,4vw,38px)',fontWeight:800,color:TEXT,marginBottom:14,letterSpacing:'-.02em'}}>Prêt à moderniser votre gestion ?</div>
          <div style={{fontSize:15,color:TEXT2,marginBottom:32,lineHeight:1.6}}>Réservez une démo Teams gratuite. Notre équipe vous présente PlanPro en 30 minutes et répond à toutes vos questions.</div>
          <button onClick={()=>goPage('contact')} style={{padding:'15px 36px',borderRadius:12,border:'none',background:A,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.25)'}}>Réserver ma démo →</button>
          <div style={{fontSize:12,color:TEXT3,marginTop:12}}>Démo gratuite · Sans engagement · Réponse sous 24h</div>
        </div>
      </section>
    </>
  )

  const PageFeatures=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:960,margin:'0 auto',padding:'60px 24px'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Fonctionnalités</div>
          <h1 style={{fontSize:'clamp(28px,5vw,48px)',fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:14}}>Tout ce que PlanPro peut faire</h1>
          <p style={{fontSize:16,color:TEXT2,maxWidth:540,margin:'0 auto'}}>Une solution pensée pour les équipes terrain, avec toutes les fonctionnalités dont vous avez besoin.</p>
        </div>
        {[
          {icon:'📅',title:'Planning intelligent',color:'#e8f2fd',ic:A,items:['Shifts simples (9h-17h) ou coupés (10h-15h puis 18h-22h)','Vue semaine complète en grille sur desktop','Vue jour par jour sur mobile','Postes personnalisables selon le secteur','Publication du planning à toute l\'équipe','Modification rapide par clic']},
          {icon:'📷',title:'Badgeage QR Code sécurisé',color:'#f0faf3',ic:'#1a6b35',items:['QR code dynamique qui change toutes les 30 secondes','Scan depuis le smartphone de l\'employé','Vérification que l\'employé appartient au bon établissement','Badgeage multiple dans la journée','Flash de confirmation après chaque scan','Borne tablette avec PIN d\'accès sécurisé']},
          {icon:'👥',title:'Suivi des présences',color:'#fff8ee',ic:'#8a4a00',items:['Visualisation en temps réel de qui est présent','Comparaison heures planifiées vs heures pointées','Calcul automatique des écarts','Historique complet des pointages par date','Correction manuelle par le gérant','Statuts : Présent, Parti, Absent, En cours']},
          {icon:'📄',title:'Rapports et export PDF',color:'#fff2f1',ic:'#b02020',items:['Génération de rapports PDF professionnels','Filtrage par période (semaine, mois, custom)','Détail par employé avec toutes les entrées/sorties','Total des heures planifiées vs pointées','Calcul des écarts pour la paie','Export en un clic depuis le dashboard']},
          {icon:'📱',title:'Espace employé mobile',color:'#f0f0fc',ic:'#3a3880',items:['Application installable sur iPhone et Android','Planning personnel de la semaine','Shifts simples et coupés affichés clairement','Bouton scan QR intégré','Historique des pointages personnels','Fonctionne hors connexion pour consulter']},
          {icon:'🏢',title:'Multi-établissements',color:'#fdf0f8',ic:'#8a2060',items:['Gérez plusieurs sites depuis un tableau de bord','Changement rapide entre établissements','Données isolées par établissement','Dashboard super admin SwitzerIT','Ajout de nouveaux sites en quelques clics','Isolation complète des données entre clients']},
        ].map((f,i)=>(
          <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:18,padding:'32px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
              <div style={{width:52,height:52,background:f.color,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{f.icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:TEXT}}>{f.title}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:10}}>
              {f.items.map((item,j)=>(
                <div key={j} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',background:f.color,borderRadius:10}}>
                  <span style={{color:f.ic,fontWeight:700,flexShrink:0,marginTop:1}}>✓</span>
                  <span style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:`linear-gradient(135deg,#e8f2fd,#f0f0fc)`,borderRadius:18,padding:'36px',textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:800,color:TEXT,marginBottom:10}}>Fonctionnalités à venir</div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:20}}>
            {['📧 Notifications email','📊 Analytics avancées','🔗 Intégration paie','📋 Contrats & documents','💬 Messagerie équipe','🌍 Multi-langue'].map(f=>(
              <span key={f} style={{padding:'7px 14px',borderRadius:20,background:'rgba(0,113,227,.08)',border:'1px solid rgba(0,113,227,.15)',fontSize:12,fontWeight:600,color:A}}>{f}</span>
            ))}
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'12px 28px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
        </div>
      </div>
    </div>
  )

  const PagePricing=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:900,margin:'0 auto',padding:'60px 24px'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Tarifs</div>
          <h1 style={{fontSize:'clamp(28px,5vw,48px)',fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:14}}>Tarification sur mesure</h1>
          <p style={{fontSize:16,color:TEXT2,maxWidth:520,margin:'0 auto',lineHeight:1.6}}>Chaque entreprise est unique. Nous établissons un devis personnalisé selon votre taille, vos besoins et votre secteur. Démo gratuite via Teams incluse.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginBottom:32}}>
          {[
            {name:'Mise en place',icon:'🚀',color:'#e8f2fd',ic:A,desc:'Installation et configuration complète par notre équipe SwitzerIT.',items:['Création du compte et configuration','Paramétrage des établissements','Import des employés','Installation de la borne tablette','Formation gérant (1h)','Documentation fournie'],tag:'Sur devis'},
            {name:'Abonnement mensuel',icon:'📅',color:'#f0faf3',ic:'#1a6b35',desc:'Accès complet à PlanPro pour votre établissement.',items:['Planning & badgeage illimités','Tous les employés inclus','Rapports PDF','Support par email','Mises à jour incluses','Hébergement sécurisé Suisse'],tag:'Sur devis · en CHF'},
            {name:'Support & maintenance',icon:'🛡️',color:'#fff8ee',ic:'#8a4a00',desc:"Accompagnement continu pour votre tranquillité d'esprit.",items:['Support prioritaire SwitzerIT','Intervention sous 4h ouvrées','Formations supplémentaires','Évolutions personnalisées','Suivi trimestriel','SLA garanti'],tag:'Options disponibles'},
          ].map((plan,i)=>(
            <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:18,padding:'28px 24px',display:'flex',flexDirection:'column'}}>
              <div style={{width:50,height:50,background:plan.color,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14}}>{plan.icon}</div>
              <div style={{fontSize:18,fontWeight:800,color:TEXT,marginBottom:6}}>{plan.name}</div>
              <div style={{fontSize:13,color:TEXT2,lineHeight:1.5,marginBottom:16}}>{plan.desc}</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20,flex:1}}>
                {plan.items.map(f=>(
                  <div key={f} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:TEXT2}}>
                    <span style={{color:plan.ic,fontWeight:700,flexShrink:0}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <div style={{padding:'10px 16px',background:plan.color,borderRadius:10,fontSize:13,fontWeight:700,color:plan.ic,textAlign:'center',marginBottom:14}}>{plan.tag}</div>
              <button onClick={()=>goPage('contact')} style={{width:'100%',height:42,borderRadius:10,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Demander un devis</button>
            </div>
          ))}
        </div>
        <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'28px 32px',marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:6}}>Pourquoi des tarifs sur devis ?</div>
          <div style={{fontSize:14,color:TEXT2,lineHeight:1.7,marginBottom:16}}>Chaque entreprise a des besoins différents : nombre d'établissements, nombre d'employés, niveau de support souhaité, personnalisations spécifiques. Plutôt que d'imposer des forfaits standardisés, nous préférons construire une offre adaptée à votre réalité.</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>
            {[
              {icon:'🎯',title:'Adapté à votre taille',desc:"1 établissement ou 50 sites : le prix s'adapte."},
              {icon:'🇨🇭',title:'Facturation en CHF',desc:'Pas de conversion, pas de surprise.'},
              {icon:'🤝',title:'Relation directe',desc:'Vous parlez à SwitzerIT, pas à un chatbot.'},
              {icon:'📊',title:'Devis sous 24h',desc:'Réponse rapide et offre claire.'},
            ].map((x,i)=>(
              <div key={i} style={{padding:'14px',background:BG,borderRadius:12,display:'flex',gap:10,alignItems:'flex-start'}}>
                <span style={{fontSize:18}}>{x.icon}</span>
                <div><div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:3}}>{x.title}</div><div style={{fontSize:12,color:TEXT2}}>{x.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',borderRadius:14,padding:'24px 28px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <div style={{fontSize:32}}>📹</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:4}}>Démo gratuite via Teams</div>
            <div style={{fontSize:13,color:TEXT2}}>Avant tout engagement, nous vous présentons PlanPro en 30 minutes via Microsoft Teams. Vous voyez exactement ce que vous obtenez, posez vos questions, et repartez avec un devis personnalisé.</div>
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'12px 24px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',flexShrink:0}}>Réserver ma démo →</button>
        </div>
      </div>
    </div>
  )

  const PageContact=()=>(
    <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:800,margin:'0 auto',padding:'60px 24px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Contact</div>
          <h1 style={{fontSize:'clamp(28px,5vw,44px)',fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:14}}>Parlons de votre projet</h1>
          <p style={{fontSize:16,color:TEXT2,maxWidth:480,margin:'0 auto'}}>Remplissez le formulaire et nous vous recontacterons sous 24h pour organiser une démo Teams gratuite.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:18,padding:'32px'}}>
            {contactSent?(
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{fontSize:48,marginBottom:16}}>✅</div>
                <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:8}}>Demande envoyée !</div>
                <div style={{fontSize:14,color:TEXT2,lineHeight:1.6}}>Notre équipe SwitzerIT vous contactera sous 24h pour organiser votre démo Teams.</div>
                <button onClick={()=>{setContactSent(false);setContactForm({nom:'',email:'',entreprise:'',secteur:'',message:''})}} style={{marginTop:20,padding:'10px 20px',borderRadius:9,border:`1px solid ${BORDER}`,background:BG,color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Nouvelle demande</button>
              </div>
            ):(
              <>
                <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:6}}>Demander une démo Teams</div>
                <div style={{fontSize:12,color:TEXT2,marginBottom:20}}>Démo gratuite · 30 minutes · Sans engagement</div>
                {[{f:'nom',l:'Nom complet *',ph:'Jean Dupont',t:'text'},{f:'email',l:'Email professionnel *',ph:'jean@restaurant.fr',t:'email'},{f:'entreprise',l:"Nom de l'établissement *",ph:'Restaurant Le Bistrot',t:'text'}].map(({f,l,ph,t})=>(
                  <div key={f} style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:11,fontWeight:700,color:TEXT2,marginBottom:5}}>{l}</label>
                    <input type={t} placeholder={ph} value={contactForm[f]} onChange={e=>setContactForm(ff=>({...ff,[f]:e.target.value}))} style={inp}
                    onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                  </div>
                ))}
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:TEXT2,marginBottom:5}}>Secteur</label>
                  <select value={contactForm.secteur} onChange={e=>setContactForm(f=>({...f,secteur:e.target.value}))} style={inp}>
                    <option value="">Sélectionner...</option>
                    {['Restaurant','Hôtel','Garage','Commerce','Clinique','Spa & Salon','BTP','Logistique','Éducation','Autre'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:TEXT2,marginBottom:5}}>Message (optionnel)</label>
                  <textarea placeholder="Décrivez votre besoin..." value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} rows={3}
                  style={{...inp,resize:'vertical',fontFamily:'var(--font)'}}
                  onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
                </div>
                <button onClick={()=>{if(!contactForm.nom||!contactForm.email||!contactForm.entreprise){alert('Remplis les champs obligatoires');return}setContactSent(true)}}
                style={{width:'100%',height:46,borderRadius:10,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,113,227,.2)'}}>
                  Envoyer la demande →
                </button>
                <div style={{fontSize:11,color:TEXT3,textAlign:'center',marginTop:10}}>Réponse sous 24h ouvrées · Démo Teams offerte</div>
              </>
            )}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {[{icon:'📹',title:'Démo Teams offerte',desc:'30 minutes pour vous présenter PlanPro en direct, adapté à votre secteur.'},
              {icon:'🚀',title:'Mise en place par SwitzerIT',desc:"Notre équipe s'occupe de tout : configuration, formation, support."},
              {icon:'🇨🇭',title:'Facturation en CHF',desc:'Tarification locale, sans conversion ni frais cachés.'},
            ].map((info,i)=>(
              <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'18px',display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{width:42,height:42,background:'#e8f2fd',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{info.icon}</div>
                <div><div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:4}}>{info.title}</div><div style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{info.desc}</div></div>
              </div>
            ))}
            <div style={{background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',borderRadius:14,padding:'18px'}}>
              <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:6}}>Déjà client ?</div>
              <div style={{fontSize:12,color:TEXT2,marginBottom:12}}>Connectez-vous à votre espace gérant.</div>
              <button onClick={()=>openLogin()} style={{padding:'8px 18px',borderRadius:8,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Se connecter →</button>
            </div>
            <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'18px'}}>
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
        {h:"1. Objet",t:"Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme PlanPro, éditée par SwitzerIT, société basée en Suisse. En accédant à la plateforme, l'utilisateur accepte sans réserve les présentes CGU."},
        {h:"2. Description du service",t:"PlanPro est une solution SaaS (Software as a Service) de gestion d'équipes permettant la création de plannings, le badgeage par QR code, le suivi des présences et l'export de rapports."},
        {h:"3. Accès au service",t:"L'accès au service est réservé aux professionnels. Chaque compte est associé à un établissement client, géré par un gérant désigné."},
        {h:"4. Obligations de l'utilisateur",t:"L'utilisateur s'engage à fournir des informations exactes, maintenir la confidentialité de ses identifiants, utiliser le service conformément à sa destination."},
        {h:"5. Responsabilité",t:"SwitzerIT s'engage à assurer la disponibilité du service. La responsabilité de SwitzerIT est limitée au montant des sommes versées par le client au cours des 12 derniers mois."},
        {h:"6. Propriété intellectuelle",t:"L'ensemble des éléments de PlanPro est la propriété exclusive de SwitzerIT. Toute reproduction non autorisée est interdite."},
        {h:"7. Résiliation",t:"Chaque partie peut résilier le contrat avec un préavis de 30 jours."},
        {h:"8. Droit applicable",t:"Les présentes CGU sont soumises au droit suisse. Les tribunaux du canton de Vaud sont seuls compétents."},
      ]},
      confidentialite:{title:"Politique de Confidentialité",last:"11 mai 2026",content:[
        {h:"1. Responsable du traitement",t:"SwitzerIT, basé en Suisse. Contact : contact@switzerit.com"},
        {h:"2. Données collectées",t:"Données d'identification (nom, prénom, email), données professionnelles (établissement, poste), données de pointage (heures d'arrivée et de départ)."},
        {h:"3. Finalités du traitement",t:"Gestion des comptes, fonctionnement du service de planning et de badgeage, génération de rapports de présence."},
        {h:"4. Base légale",t:"Exécution du contrat (accès au service), intérêt légitime (amélioration du service)."},
        {h:"5. Conservation des données",t:"Durée du contrat + 3 ans pour les données de facturation. Les données de pointage sont conservées 5 ans."},
        {h:"6. Partage des données",t:"Les données ne sont jamais vendues. Elles peuvent être partagées avec nos sous-traitants techniques (Supabase, Vercel) avec garanties contractuelles."},
        {h:"7. Droits des personnes",t:"Conformément à la LPD suisse et au RGPD, vous disposez des droits d'accès, rectification, effacement, portabilité. Contact : contact@switzerit.com"},
        {h:"8. Sécurité",t:"Données chiffrées en transit (HTTPS/TLS) et au repos. Accès contrôlé par authentification sécurisée."},
      ]},
      rgpd:{title:"Conformité RGPD",last:"11 mai 2026",content:[
        {h:"Engagement RGPD",t:"PlanPro respecte le RGPD (UE 2016/679) pour les utilisateurs résidant dans l'Union Européenne, ainsi que la nLPD suisse."},
        {h:"Données personnelles traitées",t:"Noms et prénoms des employés, adresses email professionnelles, données de badgeage (heures de présence), informations sur le poste et l'établissement."},
        {h:"Durées de conservation",t:"Données employés actifs : durée du contrat. Données de facturation : 10 ans. Logs de sécurité : 12 mois."},
        {h:"Sous-traitants",t:"Supabase Inc. (base de données, USA - clauses contractuelles types), Vercel Inc. (hébergement, USA - clauses contractuelles types)."},
        {h:"Transferts hors UE",t:"Les transferts vers des pays tiers sont encadrés par des clauses contractuelles types approuvées par la Commission Européenne."},
        {h:"Contact DPO",t:"Pour toute question : contact@switzerit.com. Réponse dans un délai de 30 jours."},
        {h:"Droit de réclamation",t:"Vous pouvez déposer une plainte auprès du PFPDT (Suisse) ou de l'autorité de contrôle de votre pays de résidence (UE)."},
      ]},
      cookies:{title:"Politique de Cookies",last:"11 mai 2026",content:[
        {h:"Qu'est-ce qu'un cookie ?",t:"Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d'un site web."},
        {h:"Cookies strictement nécessaires",t:"Cookies de session d'authentification (sb-access-token), cookies de préférences de langue, cookies de sécurité CSRF. Ils ne peuvent pas être désactivés."},
        {h:"Cookies fonctionnels",t:"Restaurant sélectionné (restoplan_current_resto), état de déverrouillage de la borne, préférences d'affichage."},
        {h:"Cookies analytiques",t:"Nous n'utilisons pas de cookies analytiques tiers. Les statistiques sont collectées de manière agrégée et anonyme."},
        {h:"Cookies tiers",t:"Supabase et Vercel peuvent déposer leurs propres cookies techniques nécessaires au fonctionnement de l'infrastructure."},
        {h:"Gestion des cookies",t:"Vous pouvez contrôler les cookies via les paramètres de votre navigateur. La désactivation des cookies nécessaires peut empêcher le fonctionnement de PlanPro."},
        {h:"Durée de conservation",t:"Cookies de session : supprimés à la fermeture du navigateur. Cookies persistants : maximum 12 mois."},
      ]},
    }
    const s=sections[legalSection]
    return (
      <div style={{paddingTop:56,minHeight:'100vh',background:BG}}>
        <div style={{maxWidth:900,margin:'0 auto',padding:'60px 24px',display:'grid',gridTemplateColumns:'220px 1fr',gap:24,alignItems:'start'}}>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px 16px',position:'sticky',top:72}}>
            <div style={{fontSize:12,fontWeight:700,color:TEXT3,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:14}}>Légal</div>
            {[['cgu','CGU'],['confidentialite','Confidentialité'],['rgpd','RGPD'],['cookies','Cookies']].map(([id,label])=>(
              <button key={id} onClick={()=>setLegalSection(id)} style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'none',background:legalSection===id?'#e8f2fd':'transparent',color:legalSection===id?A:TEXT2,fontSize:13,fontWeight:legalSection===id?700:500,cursor:'pointer',textAlign:'left',marginBottom:4,display:'block'}}>{label}</button>
            ))}
          </div>
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:18,padding:'36px'}}>
            <div style={{fontSize:12,color:TEXT3,marginBottom:8}}>Dernière mise à jour : {s.last}</div>
            <h1 style={{fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:TEXT,letterSpacing:'-.02em',marginBottom:24}}>{s.title}</h1>
            {s.content.map((block,i)=>(
              <div key={i} style={{marginBottom:24}}>
                <h2 style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:8}}>{block.h}</h2>
                <p style={{fontSize:14,color:TEXT2,lineHeight:1.7,margin:0}}>{block.t}</p>
              </div>
            ))}
            <div style={{marginTop:32,padding:'16px 20px',background:'#e8f2fd',borderRadius:12,fontSize:13,color:A}}>
              <strong>Des questions ?</strong> Contactez-nous à <a href="mailto:contact@switzerit.com" style={{color:A}}>contact@switzerit.com</a>
            </div>
          </div>
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
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
          <div style={{background:SURF,borderRadius:20,padding:32,width:'100%',maxWidth:380,boxShadow:'0 24px 64px rgba(0,0,0,.15)',border:`1px solid ${BORDER}`,position:'relative'}}>
            <button onClick={()=>closeLogin()} style={{position:'absolute',top:16,right:16,width:32,height:32,borderRadius:'50%',border:`1px solid ${BORDER}`,background:BG,color:TEXT2,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✕</button>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{width:48,height:48,background:A,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:'white',fontWeight:800,margin:'0 auto 14px'}}>P</div>
              <div style={{fontSize:20,fontWeight:800,color:TEXT}}>Connexion</div>
              <div style={{fontSize:13,color:TEXT2,marginTop:5}}>Accédez à votre espace PlanPro</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:TEXT2,marginBottom:6}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required style={{...inp,padding:'11px 14px',fontSize:14}}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:TEXT2,marginBottom:6}}>Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{...inp,padding:'11px 14px',fontSize:14}}
                onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              {error&&<div style={{padding:'10px 14px',background:'#fff2f1',border:'1px solid rgba(255,59,48,.2)',borderRadius:10,fontSize:13,color:'#b02020',marginBottom:16,fontWeight:600}}>{error}</div>}
              <button type="submit" style={{width:'100%',height:48,borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,113,227,.25)'}}>Se connecter</button>
            </form>
            <div style={{textAlign:'center',marginTop:14}}>
              <span style={{fontSize:12,color:TEXT3}}>Pas encore client ? </span>
              <span style={{fontSize:12,color:A,fontWeight:600,cursor:'pointer'}} onClick={()=>{closeLogin();goPage('contact')}}>Demander une démo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
