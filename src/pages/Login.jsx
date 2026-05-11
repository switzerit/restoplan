import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [page, setPage] = useState('home') // home | features | pricing | contact
  const [contactForm, setContactForm] = useState({nom:'',email:'',entreprise:'',secteur:'',message:''})
  const [contactSent, setContactSent] = useState(false)
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

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#fff',color:'#888',fontFamily:'var(--font)'}}>Chargement...</div>

  // DESIGN TOKENS - couleurs originales
  const A = '#0071e3'
  const A2 = '#0051a8'
  const BG = '#f5f5f7'
  const SURF = '#ffffff'
  const BORDER = '#e5e5ea'
  const TEXT = '#1d1d1f'
  const TEXT2 = '#6e6e73'
  const TEXT3 = '#aeaeb2'
  const GREEN = '#34c759'
  const nav = ['Fonctionnalités','Tarifs','Contact']

  const scrollTop = () => window.scrollTo({top:0,behavior:'smooth'})
  const goPage = (p) => { setPage(p); scrollTop() }

  // ── NAV ──────────────────────────────────────────────
  const Nav = () => (
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:56,background:'rgba(255,255,255,.9)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',padding:'0 28px',gap:8}}>
      <div onClick={()=>goPage('home')} style={{display:'flex',alignItems:'center',gap:8,flex:1,cursor:'pointer'}}>
        <div style={{width:30,height:30,background:A,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'white',fontWeight:800}}>P</div>
        <span style={{fontSize:16,fontWeight:800,color:TEXT,letterSpacing:'-.02em'}}>PlanPro</span>
        <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'#e8f2fd',color:A,marginLeft:2}}>Beta</span>
      </div>
      <div style={{display:'flex',gap:4,alignItems:'center'}}>
        {nav.map(n=>(
          <button key={n} onClick={()=>goPage(n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''))} style={{padding:'6px 14px',borderRadius:8,border:'none',background:'transparent',color:TEXT2,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            {n}
          </button>
        ))}
        <div style={{width:1,height:20,background:BORDER,margin:'0 8px'}}/>
        <button onClick={()=>setShowLogin(true)} style={{padding:'7px 16px',borderRadius:9,border:`1px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Connexion</button>
        <button onClick={()=>goPage('contact')} style={{padding:'7px 16px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Demander une démo</button>
      </div>
    </nav>
  )

  // ── FOOTER ──────────────────────────────────────────
  const Footer = () => (
    <footer style={{background:TEXT,color:'white',padding:'48px 32px 32px'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:40,marginBottom:40,flexWrap:'wrap'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <div style={{width:28,height:28,background:A,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'white',fontWeight:800}}>P</div>
              <span style={{fontSize:16,fontWeight:800}}>PlanPro</span>
            </div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.7,maxWidth:220}}>La solution de gestion d'équipes pour tous les professionnels.</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.3)',marginTop:12}}>Propulsé par <a href="https://switzerit.com" target="_blank" style={{color:'rgba(255,255,255,.5)',textDecoration:'none',fontWeight:600}}>SwitzerIT</a></div>
          </div>
          {[
            {title:'Produit',links:['Fonctionnalités','Tarifs','Roadmap','Nouveautés']},
            {title:'Support',links:['Documentation','Contact','FAQ','Statut système']},
            {title:'Légal',links:["Conditions d'utilisation",'Confidentialité','RGPD','Cookies']},
          ].map(col=>(
            <div key={col.title}>
              <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.4)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:14}}>{col.title}</div>
              {col.links.map(l=><div key={l} style={{fontSize:13,color:'rgba(255,255,255,.5)',marginBottom:9,cursor:'pointer'}}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,.3)'}}>© 2026 PlanPro by SwitzerIT. Tous droits réservés.</div>
          <div style={{display:'flex',gap:16,fontSize:12,color:'rgba(255,255,255,.3)'}}>
            <span style={{cursor:'pointer'}}>Confidentialité</span>
            <span style={{cursor:'pointer'}}>CGU</span>
            <span style={{cursor:'pointer'}}>RGPD</span>
          </div>
        </div>
      </div>
    </footer>
  )

  // ── PAGE HOME ────────────────────────────────────────
  const PageHome = () => (
    <>
      {/* HERO */}
      <section style={{paddingTop:120,paddingBottom:80,textAlign:'center',padding:'120px 24px 80px',background:`linear-gradient(180deg,#f0f7ff 0%,${BG} 100%)`}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:20,background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',marginBottom:24}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:GREEN,boxShadow:`0 0 8px ${GREEN}`,display:'inline-block'}}></span>
          <span style={{fontSize:12,fontWeight:600,color:A}}>Nouveau · Badgeage QR Code sécurisé disponible</span>
        </div>
        <h1 style={{fontSize:'clamp(36px,6vw,62px)',fontWeight:900,lineHeight:1.08,margin:'0 auto 20px',maxWidth:720,letterSpacing:'-.03em',color:TEXT}}>
          Le planning et le badgeage<br/>
          <span style={{color:A}}>réinventés.</span>
        </h1>
        <p style={{fontSize:'clamp(15px,2vw,18px)',color:TEXT2,maxWidth:540,margin:'0 auto 36px',lineHeight:1.7}}>
          PlanPro centralise la gestion des plannings, le badgeage QR code et le suivi des présences pour toutes vos équipes. Simple, rapide, fiable.
        </p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:48}}>
          <button onClick={()=>goPage('contact')} style={{padding:'14px 32px',borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.3)'}}>Demander une démo gratuite →</button>
          <button onClick={()=>goPage('fonctionnalites')} style={{padding:'14px 28px',borderRadius:12,border:`1px solid ${BORDER}`,background:SURF,color:TEXT,fontSize:15,fontWeight:600,cursor:'pointer'}}>Voir les fonctionnalités</button>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:24,flexWrap:'wrap'}}>
          {['✅ Sans engagement','⚡ Déploiement < 5 min','📱 iOS & Android','🔒 Données sécurisées'].map(t=>(
            <span key={t} style={{fontSize:12,color:TEXT3,fontWeight:500}}>{t}</span>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{background:SURF,borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`,padding:'40px 24px'}}>
        <div style={{maxWidth:800,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,textAlign:'center'}}>
          {[{v:'< 5 min',l:'pour déployer'},{v:'100%',l:'mobile-first'},{v:'24/7',l:'disponibilité'},{v:'0€',l:'pour commencer'}].map((s,i)=>(
            <div key={i}>
              <div style={{fontSize:28,fontWeight:900,color:A,letterSpacing:'-.02em'}}>{s.v}</div>
              <div style={{fontSize:13,color:TEXT2,marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES PREVIEW */}
      <section style={{padding:'80px 24px',maxWidth:1000,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Fonctionnalités clés</div>
          <div style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:800,letterSpacing:'-.02em',color:TEXT,marginBottom:10}}>Tout ce dont vous avez besoin</div>
          <div style={{fontSize:15,color:TEXT2}}>Une solution complète, sans complexité inutile</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          {[
            {icon:'📅',color:'#e8f2fd',ic:A,title:'Planning intelligent',desc:'Shifts simples ou coupés (10h-15h puis 18h-22h), vue semaine, publication en un clic.'},
            {icon:'📷',color:'#f0faf3',ic:'#1a6b35',title:'Badgeage QR Code',desc:'QR dynamique toutes les 30s sur tablette. L\'employé scanne depuis son téléphone. Sécurisé par restaurant.'},
            {icon:'👥',color:'#fff8ee',ic:'#8a4a00',title:'Présences en direct',desc:'Qui est là ? Heures prévues vs pointées, calcul automatique des écarts, export PDF.'},
            {icon:'📱',color:'#f0f0fc',ic:'#3a3880',title:'App employé',desc:'Planning perso, badgeage mobile, historique. Chaque employé a son espace connecté.'},
            {icon:'📄',color:'#fff2f1',ic:'#b02020',title:'Rapports PDF',desc:'Rapports de présence pour la paie, par période et par employé, avec totaux d\'heures.'},
            {icon:'🏢',color:'#fdf0f8',ic:'#8a2060',title:'Multi-sites',desc:'Gérez plusieurs restaurants ou établissements depuis un seul tableau de bord gérant.'},
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

      {/* SECTEURS */}
      <section style={{padding:'60px 24px',background:SURF,borderTop:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Secteurs</div>
          <div style={{fontSize:'clamp(20px,3vw,28px)',fontWeight:800,color:TEXT,marginBottom:8}}>Pour tous les professionnels</div>
          <div style={{fontSize:14,color:TEXT2,marginBottom:32}}>PlanPro s'adapte à n'importe quel secteur avec des équipes</div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            {['🍽️ Restaurants','🏨 Hôtels','🔧 Garages','🏪 Commerce','🏥 Cliniques','💆 Spas','🏗️ BTP','📦 Logistique','🎓 Éducation','🛡️ Sécurité'].map(s=>(
              <span key={s} style={{padding:'8px 16px',borderRadius:20,background:BG,border:`1px solid ${BORDER}`,fontSize:13,fontWeight:600,color:TEXT2}}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section style={{padding:'80px 24px',maxWidth:900,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Mise en place</div>
          <div style={{fontSize:'clamp(22px,3.5vw,32px)',fontWeight:800,color:TEXT,marginBottom:8}}>Opérationnel en 5 minutes</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
          {[
            {n:'1',title:'Créez votre compte',desc:'Renseignez votre établissement et vos informations gérant.'},
            {n:'2',title:'Ajoutez vos employés',desc:'Importez votre équipe avec leurs emails et postes.'},
            {n:'3',title:'Installez la borne',desc:'Ouvrez l\'URL sur une tablette à l\'entrée de l\'établissement.'},
            {n:'4',title:'C\'est parti !',desc:'Vos employés scannent le QR code pour pointer. Vous suivez en direct.'},
          ].map((s,i)=>(
            <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px 18px',position:'relative'}}>
              <div style={{width:32,height:32,borderRadius:10,background:'#e8f2fd',color:A,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,marginBottom:12}}>{s.n}</div>
              <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:6}}>{s.title}</div>
              <div style={{fontSize:12,color:TEXT2,lineHeight:1.5}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:'80px 24px',background:`linear-gradient(135deg,#e8f2fd,#f0f0fc)`,borderTop:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:560,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:'clamp(24px,4vw,38px)',fontWeight:800,color:TEXT,marginBottom:14,letterSpacing:'-.02em'}}>Prêt à moderniser votre gestion ?</div>
          <div style={{fontSize:15,color:TEXT2,marginBottom:32,lineHeight:1.6}}>Rejoignez les entreprises qui font confiance à PlanPro pour gérer leurs équipes terrain.</div>
          <button onClick={()=>goPage('contact')} style={{padding:'15px 36px',borderRadius:12,border:'none',background:A,color:'white',fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,113,227,.25)'}}>
            Demander une démo →
          </button>
          <div style={{fontSize:12,color:TEXT3,marginTop:12}}>Gratuit • Sans engagement • Réponse sous 24h</div>
        </div>
      </section>
    </>
  )

  // ── PAGE FONCTIONNALITÉS ─────────────────────────────
  const PageFeatures = () => (
    <div style={{paddingTop:80,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:960,margin:'0 auto',padding:'60px 24px'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Fonctionnalités</div>
          <h1 style={{fontSize:'clamp(28px,5vw,48px)',fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:14}}>Tout ce que PlanPro peut faire</h1>
          <p style={{fontSize:16,color:TEXT2,maxWidth:540,margin:'0 auto'}}>Une solution pensée pour les équipes terrain, avec toutes les fonctionnalités dont vous avez besoin.</p>
        </div>

        {[
          {icon:'📅',title:'Planning intelligent',color:'#e8f2fd',ic:A,items:[
            'Création de shifts simples (9h-17h) ou coupés (10h-15h puis 18h-22h)',
            'Vue semaine complète en grille sur desktop',
            'Vue jour par jour sur mobile avec navigation rapide',
            'Postes personnalisables : Cuisine, Salle, Bar...',
            'Publication du planning à toute l\'équipe',
            'Modification rapide par clic sur n\'importe quelle case',
          ]},
          {icon:'📷',title:'Badgeage QR Code sécurisé',color:'#f0faf3',ic:'#1a6b35',items:[
            'QR code dynamique qui change toutes les 30 secondes',
            'Scan depuis le smartphone de l\'employé',
            'Vérification que l\'employé appartient bien au restaurant',
            'Badgeage multiple dans la journée (arrivée/pause/reprise)',
            'Flash de confirmation visuel après chaque scan',
            'Borne tablette avec PIN d\'accès sécurisé',
          ]},
          {icon:'👥',title:'Suivi des présences',color:'#fff8ee',ic:'#8a4a00',items:[
            'Visualisation en temps réel de qui est présent',
            'Comparaison heures planifiées vs heures pointées',
            'Calcul automatique des écarts (+ ou -)',
            'Historique complet des pointages par date',
            'Correction manuelle des pointages par le gérant',
            'Statuts : Présent, Parti, Absent, En cours',
          ]},
          {icon:'📄',title:'Rapports et export PDF',color:'#fff2f1',ic:'#b02020',items:[
            'Génération de rapports PDF professionnels',
            'Filtrage par période (semaine, mois, dates custom)',
            'Détail par employé avec toutes les entrées/sorties',
            'Total des heures planifiées vs pointées',
            'Calcul des écarts pour faciliter la paie',
            'Export en un clic depuis le dashboard',
          ]},
          {icon:'📱',title:'Espace employé mobile',color:'#f0f0fc',ic:'#3a3880',items:[
            'Application web installable sur iPhone et Android',
            'Planning personnel de la semaine',
            'Shifts simples et coupés affichés clairement',
            'Bouton de scan QR intégré dans l\'app',
            'Historique des pointages personnels',
            'Fonctionne hors connexion pour consulter le planning',
          ]},
          {icon:'🏢',title:'Multi-établissements',color:'#fdf0f8',ic:'#8a2060',items:[
            'Un gérant peut gérer plusieurs restaurants/sites',
            'Changement rapide entre établissements',
            'Données isolées par établissement',
            'Dashboard super admin pour gérer tous les clients',
            'Ajout de nouveaux sites en quelques clics',
            'Isolation complète des données entre clients',
          ]},
        ].map((f,i)=>(
          <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:18,padding:'32px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
              <div style={{width:52,height:52,background:f.color,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{f.icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:TEXT}}>{f.title}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:10}}>
              {f.items.map((item,j)=>(
                <div key={j} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',background:f.color,borderRadius:10}}>
                  <span style={{color:f.ic,fontSize:14,flexShrink:0,marginTop:1}}>✓</span>
                  <span style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{background:`linear-gradient(135deg,#e8f2fd,#f0f0fc)`,borderRadius:18,padding:'36px',textAlign:'center',marginTop:24}}>
          <div style={{fontSize:22,fontWeight:800,color:TEXT,marginBottom:10}}>Des fonctionnalités à venir</div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:20}}>
            {['📧 Notifications email planning','📊 Analytics avancées','🔗 Intégration paie','📋 Contrats & documents','💬 Messagerie équipe','🌍 Multi-langue'].map(f=>(
              <span key={f} style={{padding:'7px 14px',borderRadius:20,background:'rgba(0,113,227,.08)',border:'1px solid rgba(0,113,227,.15)',fontSize:12,fontWeight:600,color:A}}>{f}</span>
            ))}
          </div>
          <button onClick={()=>goPage('contact')} style={{padding:'12px 28px',borderRadius:10,border:'none',background:A,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Demander une démo →</button>
        </div>
      </div>
    </div>
  )

  // ── PAGE TARIFS ──────────────────────────────────────
  const PagePricing = () => (
    <div style={{paddingTop:80,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:900,margin:'0 auto',padding:'60px 24px'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Tarifs</div>
          <h1 style={{fontSize:'clamp(28px,5vw,48px)',fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:14}}>Simple et transparent</h1>
          <p style={{fontSize:16,color:TEXT2,maxWidth:480,margin:'0 auto'}}>Commencez gratuitement, évoluez selon vos besoins. Pas de frais cachés.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginBottom:40}}>
          {[
            {name:'Starter',price:'Gratuit',period:'pour toujours',color:SURF,badge:null,features:[
              '1 établissement','Jusqu\'à 10 employés','Planning semaine','Badgeage QR Code','Suivi présences','Export PDF basique','Support email',
            ],cta:'Commencer gratuitement',ctaStyle:{background:BG,color:TEXT,border:`1px solid ${BORDER}`}},
            {name:'Pro',price:'29€',period:'/ mois / établissement',color:SURF,badge:'Populaire',features:[
              'Établissements illimités','Employés illimités','Tout Starter +','Shifts coupés avancés','Rapports PDF détaillés','Analytics présences','Support prioritaire','Multi-gérants',
            ],cta:'Démarrer l\'essai gratuit',ctaStyle:{background:A,color:'white',border:'none',boxShadow:'0 4px 16px rgba(0,113,227,.25)'}},
            {name:'Enterprise',price:'Sur devis',period:'adapté à vos besoins',color:SURF,badge:null,features:[
              'Tout Pro +','Intégration logiciel paie','API personnalisée','Formation équipe','SLA garanti 99.9%','Manager dédié','Données on-premise',
            ],cta:'Nous contacter',ctaStyle:{background:TEXT,color:'white',border:'none'}},
          ].map((plan,i)=>(
            <div key={i} style={{background:plan.color,border:i===1?`2px solid ${A}`:`1px solid ${BORDER}`,borderRadius:18,padding:'28px 24px',position:'relative',boxShadow:i===1?'0 8px 32px rgba(0,113,227,.12)':'none'}}>
              {plan.badge&&<div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',padding:'4px 14px',borderRadius:20,background:A,color:'white',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{plan.badge}</div>}
              <div style={{fontSize:14,fontWeight:700,color:TEXT2,marginBottom:8}}>{plan.name}</div>
              <div style={{fontSize:32,fontWeight:900,color:TEXT,letterSpacing:'-.02em',marginBottom:2}}>{plan.price}</div>
              <div style={{fontSize:12,color:TEXT3,marginBottom:24}}>{plan.period}</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
                {plan.features.map(f=>(
                  <div key={f} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:TEXT2}}>
                    <span style={{color:A,fontWeight:700,flexShrink:0}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button onClick={()=>goPage('contact')} style={{width:'100%',height:44,borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',...plan.ctaStyle}}>{plan.cta}</button>
            </div>
          ))}
        </div>

        <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:16,padding:'28px 32px'}}>
          <div style={{fontSize:16,fontWeight:800,color:TEXT,marginBottom:16}}>Comparaison détaillée</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${BORDER}`}}>
                  <th style={{textAlign:'left',padding:'10px 12px',color:TEXT2,fontWeight:600}}>Fonctionnalité</th>
                  {['Starter','Pro','Enterprise'].map(p=><th key={p} style={{textAlign:'center',padding:'10px 12px',color:p==='Pro'?A:TEXT2,fontWeight:700}}>{p}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Planning semaine','✓','✓','✓'],
                  ['Badgeage QR Code','✓','✓','✓'],
                  ['Suivi présences','✓','✓','✓'],
                  ['Export PDF','Basique','Complet','Personnalisé'],
                  ['Shifts coupés','✓','✓','✓'],
                  ['Multi-établissements','1','Illimité','Illimité'],
                  ['Employés','10 max','Illimité','Illimité'],
                  ['Analytics','—','✓','✓'],
                  ['API','—','—','✓'],
                  ['Support','Email','Prioritaire','Dédié'],
                ].map((row,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${BORDER}`,background:i%2===0?BG:SURF}}>
                    {row.map((cell,j)=>(
                      <td key={j} style={{padding:'10px 12px',color:j===0?TEXT:cell==='—'?TEXT3:cell==='✓'?A:TEXT,fontWeight:j>0&&cell==='✓'?700:400,textAlign:j===0?'left':'center'}}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',borderRadius:14,padding:'20px 24px',marginTop:16,display:'flex',alignItems:'center',gap:14}}>
          <span style={{fontSize:24}}>💡</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:4}}>Besoin d'un plan sur mesure ?</div>
            <div style={{fontSize:13,color:TEXT2}}>Pour les groupes, franchises ou besoins spécifiques, contactez-nous pour un devis personnalisé.</div>
          </div>
          <button onClick={()=>goPage('contact')} style={{marginLeft:'auto',padding:'9px 20px',borderRadius:9,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0}}>Nous contacter</button>
        </div>
      </div>
    </div>
  )

  // ── PAGE CONTACT ─────────────────────────────────────
  const PageContact = () => (
    <div style={{paddingTop:80,minHeight:'100vh',background:BG}}>
      <div style={{maxWidth:800,margin:'0 auto',padding:'60px 24px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:A,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12}}>Contact</div>
          <h1 style={{fontSize:'clamp(28px,5vw,44px)',fontWeight:900,color:TEXT,letterSpacing:'-.03em',marginBottom:14}}>Parlons de votre projet</h1>
          <p style={{fontSize:16,color:TEXT2,maxWidth:480,margin:'0 auto'}}>Remplissez le formulaire et nous vous recontacterons sous 24h pour une démo personnalisée.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          {/* FORMULAIRE */}
          <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:18,padding:'32px'}}>
            {contactSent ? (
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{fontSize:48,marginBottom:16}}>✅</div>
                <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:8}}>Message envoyé !</div>
                <div style={{fontSize:14,color:TEXT2,lineHeight:1.6}}>Merci pour votre intérêt. Notre équipe vous recontactera sous 24h.</div>
                <button onClick={()=>setContactSent(false)} style={{marginTop:20,padding:'10px 20px',borderRadius:9,border:`1px solid ${BORDER}`,background:BG,color:TEXT,fontSize:13,fontWeight:600,cursor:'pointer'}}>Envoyer un autre message</button>
              </div>
            ) : (
              <>
                <div style={{fontSize:17,fontWeight:800,color:TEXT,marginBottom:20}}>Demander une démo</div>
                {[
                  {f:'nom',l:'Nom complet *',ph:'Jean Dupont',t:'text'},
                  {f:'email',l:'Email professionnel *',ph:'jean@restaurant.fr',t:'email'},
                  {f:'entreprise',l:'Nom de l\'établissement *',ph:'Restaurant Le Bistrot'},
                ].map(({f,l,ph,t})=>(
                  <div key={f} style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:11,fontWeight:700,color:TEXT2,marginBottom:5}}>{l}</label>
                    <input type={t} placeholder={ph} value={contactForm[f]} onChange={e=>setContactForm(ff=>({...ff,[f]:e.target.value}))}
                    style={{width:'100%',padding:'10px 12px',borderRadius:9,border:`1.5px solid ${BORDER}`,background:BG,fontSize:13,color:TEXT,outline:'none'}}
                    onFocus={e=>e.target.style.borderColor=A}
                    onBlur={e=>e.target.style.borderColor=BORDER}/>
                  </div>
                ))}
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:TEXT2,marginBottom:5}}>Secteur d'activité</label>
                  <select value={contactForm.secteur} onChange={e=>setContactForm(f=>({...f,secteur:e.target.value}))}
                  style={{width:'100%',padding:'10px 12px',borderRadius:9,border:`1.5px solid ${BORDER}`,background:BG,fontSize:13,color:TEXT,outline:'none'}}>
                    <option value="">Sélectionner...</option>
                    {['Restaurant','Hôtel','Garage','Commerce','Clinique','Spa & Salon','BTP','Logistique','Éducation','Autre'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:TEXT2,marginBottom:5}}>Message (optionnel)</label>
                  <textarea placeholder="Décrivez votre besoin..." value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} rows={3}
                  style={{width:'100%',padding:'10px 12px',borderRadius:9,border:`1.5px solid ${BORDER}`,background:BG,fontSize:13,color:TEXT,outline:'none',resize:'vertical',fontFamily:'var(--font)'}}
                  onFocus={e=>e.target.style.borderColor=A}
                  onBlur={e=>e.target.style.borderColor=BORDER}/>
                </div>
                <button onClick={()=>{
                  if(!contactForm.nom||!contactForm.email||!contactForm.entreprise){alert('Remplis les champs obligatoires');return}
                  setContactSent(true)
                }} style={{width:'100%',height:46,borderRadius:10,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,113,227,.2)'}}>
                  Envoyer la demande →
                </button>
                <div style={{fontSize:11,color:TEXT3,textAlign:'center',marginTop:10}}>Réponse garantie sous 24h ouvrées</div>
              </>
            )}
          </div>

          {/* INFOS CONTACT */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {[
              {icon:'⚡',title:'Démo personnalisée',desc:'Nous vous présentons PlanPro adapté à votre secteur et vos besoins spécifiques.'},
              {icon:'🚀',title:'Mise en place rapide',desc:'Déploiement en moins de 5 minutes. Formation de vos équipes incluse.'},
              {icon:'💬',title:'Support réactif',desc:'Une question ? Notre équipe vous répond rapidement par email ou appel.'},
            ].map((info,i)=>(
              <div key={i} style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px 18px',display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{width:42,height:42,background:'#e8f2fd',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{info.icon}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:4}}>{info.title}</div>
                  <div style={{fontSize:13,color:TEXT2,lineHeight:1.5}}>{info.desc}</div>
                </div>
              </div>
            ))}
            <div style={{background:'#e8f2fd',border:'1px solid rgba(0,113,227,.15)',borderRadius:14,padding:'20px 18px'}}>
              <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:6}}>Vous êtes déjà client ?</div>
              <div style={{fontSize:12,color:TEXT2,marginBottom:12}}>Connectez-vous à votre espace gérant pour gérer vos équipes.</div>
              <button onClick={()=>setShowLogin(true)} style={{padding:'8px 18px',borderRadius:8,border:'none',background:A,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Se connecter →</button>
            </div>
            <div style={{background:SURF,border:`1px solid ${BORDER}`,borderRadius:14,padding:'20px 18px'}}>
              <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:8}}>Contact direct</div>
              <div style={{fontSize:13,color:TEXT2,marginBottom:4}}>📧 contact@switzerit.com</div>
              <div style={{fontSize:13,color:TEXT2}}>🌐 switzerit.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const currentPage = page

  return (
    <div style={{minHeight:'100vh',background:BG,fontFamily:'var(--font)',color:TEXT}}>
      <Nav/>
      {currentPage==='home' && <PageHome/>}
      {currentPage==='fonctionnalites' && <PageFeatures/>}
      {currentPage==='tarifs' && <PagePricing/>}
      {currentPage==='contact' && <PageContact/>}
      <Footer/>

      {/* LOGIN MODAL */}
      {showLogin&&(
        <div onClick={()=>setShowLogin(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:SURF,borderRadius:20,padding:32,width:'100%',maxWidth:380,boxShadow:'0 24px 64px rgba(0,0,0,.15)',border:`1px solid ${BORDER}`}}>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{width:48,height:48,background:A,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:'white',fontWeight:800,margin:'0 auto 14px'}}>P</div>
              <div style={{fontSize:20,fontWeight:800,color:TEXT}}>Connexion</div>
              <div style={{fontSize:13,color:TEXT2,marginTop:5}}>Accédez à votre espace PlanPro</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:TEXT2,marginBottom:6}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" required
                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1.5px solid ${BORDER}`,background:BG,fontSize:14,color:TEXT,outline:'none'}}
                onFocus={e=>e.target.style.borderColor=A}
                onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:TEXT2,marginBottom:6}}>Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:`1.5px solid ${BORDER}`,background:BG,fontSize:14,color:TEXT,outline:'none'}}
                onFocus={e=>e.target.style.borderColor=A}
                onBlur={e=>e.target.style.borderColor=BORDER}/>
              </div>
              {error&&<div style={{padding:'10px 14px',background:'#fff2f1',border:'1px solid rgba(255,59,48,.2)',borderRadius:10,fontSize:13,color:'#b02020',marginBottom:16,fontWeight:600}}>{error}</div>}
              <button type="submit" style={{width:'100%',height:48,borderRadius:12,border:'none',background:A,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,113,227,.25)'}}>
                Se connecter
              </button>
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
