import { useState, useEffect } from 'react'
import { api } from '../apiClient'

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}
function todayStr(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),da=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${da}`}

const CONGE_LABELS={conge_paye:'Congé payé',conges_reportes:'Reportés N-1',maladie:'Maladie',rtt:'RTT',sans_solde:'Sans solde',autre:'Absence'}

export default function AccueilGerant({
  isMobile,
  restaurant, employes, features, trialStatut, trialDaysLeft,
  presentCount, pointagesMap, gerantPrenom,
  onGoTo, onAddEmploye, onCreateShift, onCorriger
}){
  const [conges,setConges]=useState([])
  const [signalements,setSignalements]=useState([])
  const [shiftsAujourdhui,setShiftsAujourdhui]=useState([])
  const [heure,setHeure]=useState(()=>new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}))
  useEffect(()=>{const t=setInterval(()=>setHeure(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})),30000);return()=>clearInterval(t)},[])

  useEffect(()=>{
    if(!restaurant?.id) return
    loadData()
  },[restaurant?.id])

  async function loadData(){
    const today=todayStr()
    const calls=[]
    if(features.conges) calls.push(api.get(`/conges?restaurant_id=${restaurant.id}`).then(d=>setConges(d||[])))
    if(features.signalements) calls.push(api.get(`/signalements?restaurant_id=${restaurant.id}`).then(d=>setSignalements((d||[]).filter(s=>s.statut==='en_attente'))))
    calls.push(api.get(`/shifts?restaurant_id=${restaurant.id}&from=${today}&to=${today}`).then(d=>setShiftsAujourdhui(d||[])))
    await Promise.all(calls)
  }

  const today=todayStr()
  const nbEmployesReels=employes.filter(e=>!e.est_gerant).length
  const congesEnAttente=conges.filter(c=>c.statut==='en_attente')
  const absentsAujourdhui=conges.filter(c=>c.statut==='accepte'&&c.date_debut<=today&&c.date_fin>=today)
  const aTraiter=congesEnAttente.length+signalements.length

  // Présents aujourd'hui (depuis pointagesMap)
  const presents=employes.filter(e=>{
    if(e.est_gerant) return false
    const pts=pointagesMap?.[e.id]||[]
    return pts.some(p=>p.heure_arrivee&&!p.heure_depart)
  })

  const now=new Date()
  const dateLabel=now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})
  const numSemaine=(()=>{const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-((d.getDay()+6)%7));const w1=new Date(d.getFullYear(),0,4);return 1+Math.round(((d-w1)/86400000-3+((w1.getDay()+6)%7))/7)})()

  // Construire les stats selon les flags
  const stats=[]
  if(features.badgeage){
    stats.push({icon:'👥',l:'Présents',v:`${presentCount}/${nbEmployesReels}`,ic:'#16a34a'})
  }
  if(features.conges){
    stats.push({icon:'🏖️',l:'Absents',v:absentsAujourdhui.length,ic:'#ea580c'})
  }
  stats.push({icon:'📅',l:"Shifts aujourd'hui",v:shiftsAujourdhui.length,ic:'#7c3aed'})

  // Actions rapides selon flags
  const actions=[
    {icon:'📅',l:'Créer un shift',onClick:onCreateShift},
    {icon:'👤',l:'Ajouter employé',onClick:onAddEmploye},
  ]
  if(features.badgeage) actions.push({icon:'⏱️',l:'Corriger pointage',onClick:()=>onGoTo('presences')})
  if(features.badgeage&&features.export_paie) actions.push({icon:'📄',l:'Export paie',onClick:()=>onGoTo('presences')})

  return(
    <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:20,WebkitOverflowScrolling:'touch'}}>

      {/* Bandeau essai */}
      {trialStatut==='trial'&&trialDaysLeft!=null&&(
        <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:14,padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:20}}>⏳</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:'#9a3412'}}>Période d'essai · {trialDaysLeft} jour{trialDaysLeft>1?'s':''} restant{trialDaysLeft>1?'s':''}</div>
            <div style={{fontSize:11,color:'#c2410c',marginTop:1}}>Souscrivez pour conserver l'accès à toutes les fonctionnalités</div>
          </div>
          <a href="https://www.varman.ch/contact" style={{background:'#c2410c',color:'white',textDecoration:'none',borderRadius:9,padding:'8px 14px',fontSize:12,fontWeight:700,flexShrink:0}}>Souscrire</a>
        </div>
      )}
      {trialStatut==='expired'&&(
        <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:14,padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:'#991b1b'}}>Votre essai est terminé</div>
            <div style={{fontSize:11,color:'#dc2626',marginTop:1}}>Souscrivez pour réactiver votre accès</div>
          </div>
          <a href="https://www.varman.ch/contact" style={{background:'#dc2626',color:'white',textDecoration:'none',borderRadius:9,padding:'8px 14px',fontSize:12,fontWeight:700,flexShrink:0}}>Souscrire</a>
        </div>
      )}

      {/* En-tête accueil */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:isMobile?20:22,fontWeight:800,color:'var(--text)',letterSpacing:'-.02em'}}>Bonjour, {gerantPrenom||'Gérant'} 👋</div>
          <div style={{fontSize:13,color:'var(--text2)',marginTop:4,textTransform:'capitalize'}}>{dateLabel} · {restaurant?.nom}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg)',border:'1px solid var(--border)',padding:'7px 13px',borderRadius:10}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:'#16a34a',display:'inline-block'}}/>
          <span style={{fontSize:13,color:'var(--text2)'}}>{heure} · Semaine {numSemaine}</span>
        </div>
      </div>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(stats.length,3)},1fr)`,gap:isMobile?8:12}}>
        {stats.map((s,i)=>(
          <div key={i} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:isMobile?'13px 14px':'16px 18px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:isMobile?8:12}}>
              <span style={{fontSize:isMobile?11:13,color:'var(--text2)'}}>{s.l}</span>
              <span style={{fontSize:isMobile?15:18}}>{s.icon}</span>
            </div>
            <div style={{fontSize:isMobile?24:28,fontWeight:800,color:'var(--text)',lineHeight:1,letterSpacing:'-.02em'}}>{s.v}</div>
          </div>
        ))}
      </div>
      {/* À faire maintenant — seulement si conges OU signalements actifs ET qu'il y a qqch */}
      {(features.conges||features.signalements)&&aTraiter>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            🔔 À faire maintenant
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {features.conges&&congesEnAttente.length>0&&(
              <div onClick={()=>onGoTo('conges')} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'13px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}>
                <div style={{width:38,height:38,borderRadius:10,background:'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏖️</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700}}>{congesEnAttente.length} demande{congesEnAttente.length>1?'s':''} de congé en attente</div>
                  <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>
                    {congesEnAttente.slice(0,3).map(c=>c.prenom).join(', ')}{congesEnAttente.length>3?'...':''} attend{congesEnAttente.length>1?'ent':''} une réponse
                  </div>
                </div>
                <span style={{fontSize:18,color:'var(--text3)',flexShrink:0}}>›</span>
              </div>
            )}
            {features.signalements&&signalements.length>0&&(
              <div onClick={()=>onGoTo('signalements')} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'13px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}>
                <div style={{width:38,height:38,borderRadius:10,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>⚡</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700}}>{signalements.length} correction{signalements.length>1?'s':''} de pointage</div>
                  <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>
                    {signalements.slice(0,3).map(s=>s.prenom).join(', ')}{signalements.length>3?'...':''} à traiter
                  </div>
                </div>
                <span style={{fontSize:18,color:'var(--text3)',flexShrink:0}}>›</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accès rapide */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
          ⚡ Accès rapide
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(actions.length,4)},1fr)`,gap:8}}>
          {actions.map((a,i)=>(
            <button key={i} onClick={a.onClick} style={{
              background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 12px',
              cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:8,transition:'all .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}>
              <span style={{fontSize:24}}>{a.icon}</span>
              <span style={{fontSize:12,fontWeight:600,textAlign:'center',color:'var(--text)'}}>{a.l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* L'équipe aujourd'hui — seulement si badgeage OU conges */}
      {(features.badgeage||features.conges)&&(presents.length>0||absentsAujourdhui.length>0)&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            👥 L'équipe aujourd'hui
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
            {features.badgeage&&presents.map((e,i)=>{
              const pts=pointagesMap?.[e.id]||[]
              const actif=pts.find(p=>p.heure_arrivee&&!p.heure_depart)
              return(
                <div key={e.id} style={{padding:'11px 16px',display:'flex',alignItems:'center',gap:10,
                  borderBottom:(i<presents.length-1||absentsAujourdhui.length>0)?'1px solid var(--border)':'none'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:'#f0fdf4',color:'#15803d',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
                    {ini(e.prenom,e.nom)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600}}>{e.prenom} {e.nom}</div>
                    <div style={{fontSize:11,color:'var(--text2)'}}>{e.role}{actif?.heure_arrivee?` · arrivée ${actif.heure_arrivee.slice(0,5)}`:''}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#f0fdf4',color:'#15803d',border:'1px solid #bbf7d0',flexShrink:0}}>Présent</span>
                </div>
              )
            })}
            {features.conges&&absentsAujourdhui.map((c,i)=>(
              <div key={c.id} style={{padding:'11px 16px',display:'flex',alignItems:'center',gap:10,
                borderBottom:i<absentsAujourdhui.length-1?'1px solid var(--border)':'none'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'#fff1f3',color:'#be123c',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
                  {ini(c.prenom,c.nom)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}>{c.prenom} {c.nom}</div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{CONGE_LABELS[c.type]||'Absence'} · retour le {new Date(c.date_fin+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#fff1f3',color:'#be123c',border:'1px solid #fecdd3',flexShrink:0}}>Absent</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
