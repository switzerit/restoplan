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

  // L'équipe qui travaille aujourd'hui (depuis les shifts du jour)
  const equipeAujourdhui=shiftsAujourdhui
    .map(sh=>{
      const emp=employes.find(e=>e.id===sh.employe_id&&!e.est_gerant)
      if(!emp) return null
      const pts=pointagesMap?.[emp.id]||[]
      const enCours=pts.find(p=>p.heure_arrivee&&!p.heure_depart)
      const fini=pts.length>0&&pts.every(p=>p.heure_depart)
      let statut='attente', statutLabel='Pas encore badgé'
      if(enCours){statut='present';statutLabel='Présent depuis '+enCours.heure_arrivee.slice(0,5)}
      else if(fini){statut='parti';statutLabel='Journée terminée'}
      return {emp,sh,statut,statutLabel}
    })
    .filter(Boolean)
    .sort((a,b)=>(a.sh.heure_debut||'').localeCompare(b.sh.heure_debut||''))

  const now=new Date()
  const dateLabel=now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})
  const numSemaine=(()=>{const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-((d.getDay()+6)%7));const w1=new Date(d.getFullYear(),0,4);return 1+Math.round(((d-w1)/86400000-3+((w1.getDay()+6)%7))/7)})()

  // Construire les stats selon les flags
  const stats=[]
  if(features.badgeage){
    stats.push({icon:'👥',l:'Présents',v:`${presentCount}/${nbEmployesReels}`,bg:'#e1f5ee'})
  }
  if(features.conges){
    stats.push({icon:'🏖️',l:'Absents',v:absentsAujourdhui.length,bg:'#faece7'})
  }
  stats.push({icon:'📅',l:'Shifts auj.',v:shiftsAujourdhui.length,bg:'#eeedfe'})

  // Actions rapides selon flags
  const actions=[
    {icon:'📅',l:'Créer un shift',bg:'#fbeaf0',onClick:onCreateShift},
    {icon:'👤',l:'Employé',bg:'#eeedfe',onClick:onAddEmploye},
  ]
  if(features.badgeage) actions.push({icon:'⏱️',l:'Pointage',bg:'#e1f5ee',onClick:()=>onGoTo('presences')})
  if(features.badgeage&&features.export_paie) actions.push({icon:'📄',l:'Export paie',bg:'#faece7',onClick:()=>onGoTo('presences')})

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
      <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(stats.length,3)},1fr)`,gap:isMobile?8:10}}>
        {stats.map((s,i)=>(
          <div key={i} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:13,padding:isMobile?'12px 13px':'14px 16px',display:'flex',alignItems:'center',gap:isMobile?10:13}}>
            <div style={{width:isMobile?36:40,height:isMobile?36:40,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?17:20,flexShrink:0}}>{s.icon}</div>
            <div>
              <div style={{fontSize:isMobile?20:22,fontWeight:800,color:'var(--text)',lineHeight:1,letterSpacing:'-.02em'}}>{s.v}</div>
              <div style={{fontSize:isMobile?11:12,color:'var(--text2)',marginTop:3}}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Rangée équipe + à traiter */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.5fr 1fr',gap:isMobile?12:14}}>
        {/* L'équipe aujourd'hui */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:isMobile?'14px 16px':'16px 18px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>L'équipe aujourd'hui</div>
            <span onClick={()=>onGoTo('planning')} style={{fontSize:12,color:'var(--accent)',cursor:'pointer',fontWeight:600}}>Planning →</span>
          </div>
          {equipeAujourdhui.length===0?(
            <div style={{fontSize:13,color:'var(--text2)',paddingTop:11,borderTop:'1px solid var(--border)'}}>Aucun shift planifié aujourd'hui</div>
          ):equipeAujourdhui.map((it,i)=>{
            const stColor=it.statut==='present'?'#15803d':it.statut==='parti'?'var(--text3)':'#b45309'
            return(
              <div key={it.sh.id||i} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 0',borderTop:'1px solid var(--border)'}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:'var(--accent-bg)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{ini(it.emp.prenom,it.emp.nom)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{it.emp.prenom} {it.emp.nom}</div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{it.emp.role}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{(it.sh.heure_debut||'').slice(0,5)} – {(it.sh.heure_fin||'').slice(0,5)}</div>
                  <div style={{fontSize:11,color:stColor,marginTop:1}}>{it.statutLabel}</div>
                </div>
              </div>
            )
          })}
        </div>
        {/* À traiter */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:isMobile?'14px 16px':'16px 18px'}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:12}}>À traiter</div>
          {aTraiter===0?(
            <div style={{display:'flex',alignItems:'center',gap:9,paddingTop:11,borderTop:'1px solid var(--border)'}}>
              <span style={{fontSize:18}}>✅</span>
              <div style={{fontSize:13,color:'var(--text2)'}}>Tout est à jour</div>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column'}}>
              {features.conges&&congesEnAttente.length>0&&(
                <div onClick={()=>onGoTo('conges')} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderTop:'1px solid var(--border)',cursor:'pointer'}}>
                  <div style={{width:32,height:32,borderRadius:9,background:'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🏖️</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{congesEnAttente.length} congé{congesEnAttente.length>1?'s':''}</div>
                    <div style={{fontSize:11,color:'var(--text2)'}}>en attente</div>
                  </div>
                  <span style={{fontSize:16,color:'var(--text3)'}}>›</span>
                </div>
              )}
              {features.signalements&&signalements.length>0&&(
                <div onClick={()=>onGoTo('signalements')} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderTop:'1px solid var(--border)',cursor:'pointer'}}>
                  <div style={{width:32,height:32,borderRadius:9,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>⚡</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{signalements.length} correction{signalements.length>1?'s':''}</div>
                    <div style={{fontSize:11,color:'var(--text2)'}}>de pointage</div>
                  </div>
                  <span style={{fontSize:16,color:'var(--text3)'}}>›</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Accès rapide */}
      <div>
        <div style={{fontSize:isMobile?12:13,fontWeight:700,color:'var(--text2)',marginBottom:10}}>Actions rapides</div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${Math.min(actions.length,4)},1fr)`,gap:isMobile?8:10}}>
          {actions.map((a,i)=>(
            <button key={i} onClick={a.onClick} style={{
              background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:isMobile?'12px 13px':'13px 14px',
              cursor:'pointer',display:'flex',alignItems:'center',gap:10,transition:'all .15s',textAlign:'left'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}>
              <div style={{width:32,height:32,borderRadius:9,background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{a.icon}</div>
              <span style={{fontSize:isMobile?12:13,fontWeight:600,color:'var(--text)'}}>{a.l}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
