import { useState, useEffect } from 'react'
import socket from '../socketClient'
import { api } from '../apiClient'

const TYPES = {
  conge_paye:      {l:'Congé payé',    emoji:'🏖️',c:'#E11D48',bg:'#fff1f3',bc:'#fecdd3'},
  conges_reportes: {l:'Reportés N-1',  emoji:'🔄',c:'#2563EB',bg:'#eff6ff',bc:'#bfdbfe'},
  maladie:         {l:'Maladie',       emoji:'🏥',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  rtt:             {l:'RTT',           emoji:'⏰',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
  sans_solde:      {l:'Sans solde',    emoji:'📋',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  autre:           {l:'Autre',         emoji:'📝',c:'#6b7280',bg:'#f5f5f5',bc:'#e0e0e0'},
}
const STATUTS = {
  en_attente:{l:'En attente',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  accepte:   {l:'Accepté',  c:'#16a34a',bg:'#f0fdf4',bc:'#bbf7d0'},
  refuse:    {l:'Refusé',   c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  annule:    {l:'Annulé',   c:'#6b7280',bg:'#f3f4f6',bc:'#e5e7eb'},
}

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}
function fmtD(s){if(!s)return'—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];return new Date(str+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
function fmtDLong(s){if(!s)return'—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];return new Date(str+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
function fmtDShort(s){if(!s)return'—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];return new Date(str+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
function nbJ(d1,d2){return Math.max(1,Math.round((new Date(d2)-new Date(d1))/(1000*60*60*24))+1)}

function doExportPDF(conges,restaurant,employes,filtreEmp,dateDebut,dateFin){
  let filtered=conges
  if(filtreEmp) filtered=filtered.filter(c=>c.employe_id===filtreEmp)
  if(dateDebut) filtered=filtered.filter(c=>c.date_debut>=dateDebut)
  if(dateFin) filtered=filtered.filter(c=>c.date_fin<=dateFin)
  const byEmp={}
  filtered.forEach(c=>{if(!byEmp[c.employe_id])byEmp[c.employe_id]=[];byEmp[c.employe_id].push(c)})
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Congés</title>
<style>body{font-family:Arial,sans-serif;padding:30px;font-size:13px}
h1{font-size:18px;margin:0 0 16px}table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px}
th{background:#f5f5f5;padding:6px 10px;text-align:left;border:1px solid #ddd}td{padding:6px 10px;border:1px solid #ddd}
.badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;display:inline-block}
.accepte{background:#f0fdf4;color:#16a34a}.refuse{background:#fef2f2;color:#dc2626}.en_attente{background:#fff7ed;color:#ea580c}
</style></head><body><h1>Congés — ${restaurant.nom}</h1>
${Object.entries(byEmp).map(([,cs])=>`
<h3>${cs[0]?.prenom} ${cs[0]?.nom}</h3>
<table><tr><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Statut</th></tr>
${cs.map(c=>`<tr><td>${TYPES[c.type]?.l||c.type}</td><td>${fmtDShort(c.date_debut)}</td><td>${fmtDShort(c.date_fin)}</td><td>${nbJ(c.date_debut,c.date_fin)}</td><td><span class="badge ${c.statut}">${STATUTS[c.statut]?.l}</span></td></tr>`).join('')}
</table>`).join('')}
</body></html>`
  const w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(()=>w.print(),300)
}

export default function CongesGerant({restaurant,employes,showToast,onReloadEmployes}){
  const [conges,setConges]=useState([])
  const [soldesMap,setSoldesMap]=useState({})
  const [page,setPage]=useState('demandes') // demandes | soldes
  const [expanded,setExpanded]=useState(null)
  const [commentaire,setCommentaire]=useState('')
  const [historiqueOpen,setHistoriqueOpen]=useState(false)
  const [editSolde,setEditSolde]=useState(null)
  const [soldeTmp,setSoldeTmp]=useState('')
  const [exportModal,setExportModal]=useState(false)
  const [exportForm,setExportForm]=useState({emp:'',debut:'',fin:''})
  const [filtrHistorique,setFiltrHistorique]=useState('tous')

  useEffect(()=>{
    if(!restaurant) return
    loadAll()
    socket.connect()
    socket.on('conge',loadConges)
    return ()=>{socket.off('conge');socket.disconnect()}
  },[restaurant?.id])

  async function loadAll(){await Promise.all([loadConges(),loadSoldes()])}
  async function loadConges(){const d=await api.get(`/conges?restaurant_id=${restaurant.id}`);setConges(d||[])}
  async function loadSoldes(){const d=await api.get(`/employes/${restaurant.id}`);if(d){const m={};d.forEach(e=>{m[e.id]=e});setSoldesMap(m)}}

  async function traiter(id,statut){
    const c=conges.find(x=>x.id===id)
    const jours=nbJ(c.date_debut,c.date_fin)
    await api.put(`/conges/${id}`,{statut,commentaire_gerant:commentaire||null})
    if(statut==='accepte'&&c.statut!=='accepte'){
      if(c.type==='conge_paye') await api.put(`/employes/${c.employe_id}`,{conges_pris:(c.conges_pris||0)+jours})
      if(c.type==='rtt') await api.put(`/employes/${c.employe_id}`,{rtt_pris:(c.rtt_pris||0)+jours})
      if(c.type==='conges_reportes') await api.put(`/employes/${c.employe_id}`,{conges_reportes:Math.max(0,(c.conges_reportes||0)-jours)})
      await api.delete(`/shifts/employe/${c.employe_id}?from=${c.date_debut}&to=${c.date_fin}`)
    }
    if((statut==='refuse'||statut==='annule')&&c.statut==='accepte'){
      if(c.type==='conge_paye') await api.put(`/employes/${c.employe_id}`,{conges_pris:Math.max(0,(c.conges_pris||0)-jours)})
      if(c.type==='rtt') await api.put(`/employes/${c.employe_id}`,{rtt_pris:Math.max(0,(c.rtt_pris||0)-jours)})
      if(c.type==='conges_reportes') await api.put(`/employes/${c.employe_id}`,{conges_reportes:(c.conges_reportes||0)+jours})
    }
    setExpanded(null);setCommentaire('')
    showToast(statut==='accepte'?'Congé accepté ✅':'Congé refusé ❌')
    await loadAll();if(onReloadEmployes)onReloadEmployes()
  }

  async function saveSolde(empId,type){
    let body={}
    if(type==='report_expiration'){if(!soldeTmp){showToast('Date invalide');return};body={conges_report_expiration:soldeTmp}}
    else if(type==='report_plafond'){const v=parseInt(soldeTmp);if(isNaN(v)||v<0){showToast('Invalide');return};body={conges_report_plafond:v}}
    else{const v=parseInt(soldeTmp);if(isNaN(v)||v<0||v>365){showToast('Invalide (0-365)');return};body={[type==='rtt'?'rtt_total':'conges_total']:v}}
    await api.put(`/employes/${empId}`,body)
    setEditSolde(null);setSoldeTmp('');showToast('Mis à jour ✓')
    await loadAll();if(onReloadEmployes)onReloadEmployes()
  }

  async function resetAnnuel(empId,cpTotal,cpPris,plafond){
    const nonPris=Math.max(0,(cpTotal||25)-(cpPris||0))
    const rep=(plafond||0)>0?Math.min(nonPris,plafond):0
    await api.put(`/employes/${empId}`,{conges_pris:0,conges_reportes:rep})
    showToast(`Reset — ${rep}j reportés ✓`)
    await loadAll();if(onReloadEmployes)onReloadEmployes()
  }

  const enAttente=conges.filter(c=>c.statut==='en_attente')
  const historique=conges.filter(c=>c.statut!=='en_attente').filter(c=>{
    if(filtrHistorique==='tous') return true
    return c.statut===filtrHistorique
  })
  const joursAccordesMois=conges.filter(c=>c.statut==='accepte'&&c.date_debut?.slice(0,7)===new Date().toISOString().slice(0,7)).reduce((a,c)=>a+nbJ(c.date_debut,c.date_fin),0)

  const soldesData=employes.filter(e=>e.actif!==false).map(emp=>{
    const s=soldesMap[emp.id]||emp
    return{...emp,cpPris:s.conges_pris||0,cpTotal:s.conges_total||25,rttPris:s.rtt_pris||0,rttTotal:s.rtt_total||0,cpReportes:s.conges_reportes||0,cpReportPlafond:s.conges_report_plafond||0,cpReportExpiration:s.conges_report_expiration||null}
  })

  const inp={width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box'}

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Nav tabs */}
      <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'space-between',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4,background:'var(--bg)',borderRadius:12,padding:4}}>
          {[{id:'demandes',l:'Demandes'},{id:'soldes',l:'Soldes'}].map(t=>(
            <button key={t.id} onClick={()=>setPage(t.id)} style={{
              padding:'8px 18px',borderRadius:9,border:'none',fontSize:13,fontWeight:page===t.id?700:500,cursor:'pointer',
              background:page===t.id?'var(--surface)':'transparent',
              color:page===t.id?'var(--text)':'var(--text2)',
              boxShadow:page===t.id?'0 1px 4px rgba(0,0,0,.08)':'none',
              position:'relative',transition:'all .15s'
            }}>
              {t.l}
              {t.id==='demandes'&&enAttente.length>0&&(
                <span style={{position:'absolute',top:4,right:4,minWidth:16,height:16,borderRadius:8,
                  background:'#E11D48',color:'white',fontSize:9,fontWeight:800,
                  display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>
                  {enAttente.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={()=>setExportModal(true)} style={{padding:'8px 16px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text2)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
          📄 Exporter PDF
        </button>
      </div>

      {/* PAGE DEMANDES */}
      {page==='demandes'&&(<>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[
            {n:enAttente.length,l:'En attente',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa',icon:'⏳'},
            {n:conges.filter(c=>c.statut==='accepte'&&c.date_debut?.slice(0,7)===new Date().toISOString().slice(0,7)).length,l:'Acceptées ce mois',c:'#16a34a',bg:'#f0fdf4',bc:'#bbf7d0',icon:'✅'},
            {n:joursAccordesMois,l:'Jours accordés',c:'#2563EB',bg:'#eff6ff',bc:'#bfdbfe',icon:'📅'},
          ].map((s,i)=>(
            <div key={i} style={{background:s.bg,borderRadius:14,padding:'14px 16px',border:`1.5px solid ${s.bc}`}}>
              <div style={{fontSize:24,fontWeight:900,color:s.c}}>{s.n}</div>
              <div style={{fontSize:11,color:s.c,marginTop:4,fontWeight:600}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* EN ATTENTE */}
        {enAttente.length>0&&(
          <div>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.5px'}}>
              À traiter · {enAttente.length}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {enAttente.map(c=>{
                const type=TYPES[c.type]||TYPES.autre
                const jours=nbJ(c.date_debut,c.date_fin)
                const solde=soldesMap[c.employe_id]
                const cpS=(solde?.conges_total||25)-(solde?.conges_pris||0)
                const isOpen=expanded===c.id
                return(
                  <div key={c.id} style={{
                    background:'var(--surface)',borderRadius:16,
                    border:`2px solid ${isOpen?'#E11D48':type.bc}`,
                    overflow:'hidden',transition:'border-color .2s'
                  }}>
                    {/* Ligne principale cliquable */}
                    <div onClick={()=>{setExpanded(isOpen?null:c.id);setCommentaire('')}}
                      style={{padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                      {/* Avatar */}
                      <div style={{width:42,height:42,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,flexShrink:0,
                        border:'2px solid #fecdd3'}}>
                        {ini(c.prenom,c.nom)}
                      </div>
                      {/* Infos */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{c.prenom} {c.nom}</div>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                          <span style={{fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:20,
                            background:type.bg,color:type.c,border:`1px solid ${type.bc}`}}>
                            {type.emoji} {type.l}
                          </span>
                          <span style={{fontSize:12,color:'var(--text2)',fontWeight:500}}>
                            {fmtD(c.date_debut)} → {fmtD(c.date_fin)}
                          </span>
                          <span style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{jours}j</span>
                        </div>
                      </div>
                      {/* Chevron */}
                      <div style={{color:'var(--text3)',fontSize:18,transform:isOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>⌃</div>
                    </div>

                    {/* Panneau expandé */}
                    {isOpen&&(
                      <div style={{borderTop:`1px solid ${type.bc}`,background:type.bg,padding:'16px 18px',display:'flex',flexDirection:'column',gap:14}}>
                        {/* Détails */}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                          <div style={{background:'white',borderRadius:10,padding:'12px 14px',border:`1px solid ${type.bc}`}}>
                            <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:4}}>PÉRIODE</div>
                            <div style={{fontSize:13,fontWeight:700}}>{fmtDLong(c.date_debut)}</div>
                            <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>→ {fmtDLong(c.date_fin)}</div>
                            <div style={{fontSize:12,fontWeight:800,color:type.c,marginTop:6}}>{jours} jour{jours>1?'s':''}</div>
                          </div>
                          <div style={{background:'white',borderRadius:10,padding:'12px 14px',border:`1px solid ${type.bc}`}}>
                            <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:4}}>SOLDE ACTUEL</div>
                            {c.type==='conge_paye'&&(
                              <>
                                <div style={{fontSize:22,fontWeight:900,color:cpS>=jours?'#16a34a':'#dc2626'}}>{cpS}j</div>
                                <div style={{fontSize:10,color:'var(--text2)'}}>restants / {solde?.conges_total||25}j</div>
                                {cpS<jours&&<div style={{fontSize:10,color:'#dc2626',fontWeight:700,marginTop:4}}>⚠️ Insuffisant</div>}
                              </>
                            )}
                            {c.type==='rtt'&&(
                              <>
                                <div style={{fontSize:22,fontWeight:900,color:'#7c3aed'}}>{(solde?.rtt_total||0)-(solde?.rtt_pris||0)}j</div>
                                <div style={{fontSize:10,color:'var(--text2)'}}>RTT restants</div>
                              </>
                            )}
                            {c.type==='conges_reportes'&&(
                              <>
                                <div style={{fontSize:22,fontWeight:900,color:'#2563EB'}}>{solde?.conges_reportes||0}j</div>
                                <div style={{fontSize:10,color:'var(--text2)'}}>reportés restants</div>
                              </>
                            )}
                            {(c.type==='maladie'||c.type==='sans_solde'||c.type==='autre')&&(
                              <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>Pas de solde associé</div>
                            )}
                          </div>
                        </div>

                        {c.message&&(
                          <div style={{background:'white',borderRadius:10,padding:'12px 14px',border:`1px solid ${type.bc}`}}>
                            <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:4}}>MESSAGE</div>
                            <div style={{fontSize:13,fontStyle:'italic',color:'var(--text)'}}>"{c.message}"</div>
                          </div>
                        )}

                        {/* Commentaire + actions */}
                        <textarea value={commentaire} onChange={e=>setCommentaire(e.target.value)}
                          placeholder="Réponse à l'employé (optionnel)..."
                          style={{...inp,resize:'none',height:68,background:'white',border:`1.5px solid ${type.bc}`,fontFamily:'var(--font)'}}/>

                        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10}}>
                          <button onClick={()=>traiter(c.id,'refuse')} style={{
                            height:48,borderRadius:12,border:'2px solid #fecaca',
                            background:'white',color:'#dc2626',fontSize:14,fontWeight:700,cursor:'pointer'}}>
                            ✕ Refuser
                          </button>
                          <button onClick={()=>traiter(c.id,'accepte')} style={{
                            height:48,borderRadius:12,border:'none',
                            background:'#16a34a',color:'white',fontSize:14,fontWeight:800,cursor:'pointer',
                            boxShadow:'0 2px 12px rgba(22,163,74,.3)'}}>
                            ✓ Accepter le congé
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {enAttente.length===0&&(
          <div style={{textAlign:'center',padding:'32px 20px',background:'var(--surface)',borderRadius:16,border:'1px solid var(--border)'}}>
            <div style={{fontSize:40,marginBottom:10}}>✅</div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Tout est traité</div>
            <div style={{fontSize:13,color:'var(--text2)'}}>Aucune demande en attente</div>
          </div>
        )}

        {/* HISTORIQUE */}
        <div>
          <button onClick={()=>setHistoriqueOpen(o=>!o)} style={{
            width:'100%',padding:'12px 16px',borderRadius:12,border:'1px solid var(--border)',
            background:'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',
            fontSize:13,fontWeight:700,color:'var(--text)'}}>
            <span>Historique · {historique.length} demande{historique.length!==1?'s':''}</span>
            <span style={{transform:historiqueOpen?'rotate(180deg)':'none',transition:'transform .2s',color:'var(--text3)'}}>⌃</span>
          </button>

          {historiqueOpen&&(
            <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:8}}>
              {/* Filtres historique */}
              <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2}}>
                {[{id:'tous',l:'Tous'},{id:'accepte',l:'Acceptés'},{id:'refuse',l:'Refusés'},{id:'annule',l:'Annulés'}].map(f=>(
                  <button key={f.id} onClick={()=>setFiltrHistorique(f.id)} style={{
                    flexShrink:0,padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:filtrHistorique===f.id?700:500,cursor:'pointer',
                    border:`1.5px solid ${filtrHistorique===f.id?'#E11D48':'var(--border)'}`,
                    background:filtrHistorique===f.id?'#E11D48':'var(--surface)',
                    color:filtrHistorique===f.id?'white':'var(--text2)',transition:'all .15s'}}>
                    {f.l}
                  </button>
                ))}
              </div>

              {historique.length===0?(
                <div style={{textAlign:'center',padding:'24px',color:'var(--text3)',fontSize:13}}>Aucune demande</div>
              ):historique.map(c=>{
                const type=TYPES[c.type]||TYPES.autre
                const stat=STATUTS[c.statut]||STATUTS.refuse
                const jours=nbJ(c.date_debut,c.date_fin)
                return(
                  <div key={c.id} style={{background:'var(--surface)',borderRadius:12,border:'1px solid var(--border)',padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:'#f5f5f5',color:'#555',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>
                      {ini(c.prenom,c.nom)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{c.prenom} {c.nom}</div>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                        <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:type.bg,color:type.c,border:`1px solid ${type.bc}`,fontWeight:600}}>
                          {type.emoji} {type.l}
                        </span>
                        <span style={{fontSize:11,color:'var(--text3)'}}>{fmtD(c.date_debut)} → {fmtD(c.date_fin)} · {jours}j</span>
                      </div>
                    </div>
                    <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,
                      background:stat.bg,color:stat.c,border:`1px solid ${stat.bc}`,flexShrink:0,whiteSpace:'nowrap'}}>
                      {stat.l}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </>)}

      {/* PAGE SOLDES */}
      {page==='soldes'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{fontSize:12,color:'var(--text2)',padding:'10px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)'}}>
            💡 Appuyez sur un solde souligné pour le modifier directement.
          </div>
          {soldesData.map((emp,i)=>{
            const cpS=emp.cpTotal-emp.cpPris
            const rttS=emp.rttTotal-emp.rttPris
            const cpPct=emp.cpTotal>0?Math.min(100,Math.round(emp.cpPris/emp.cpTotal*100)):0
            return(
              <div key={emp.id} style={{background:'var(--surface)',borderRadius:16,border:'1px solid var(--border)',overflow:'hidden'}}>
                {/* Header employé */}
                <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>
                    {ini(emp.prenom,emp.nom)}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{emp.prenom} {emp.nom}</div>
                    <div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div>
                  </div>
                </div>
                {/* Soldes */}
                <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:14}}>
                  {/* CP */}
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:13}}>🏖️</span>
                        <span style={{fontSize:12,fontWeight:700,color:'#E11D48'}}>Congés payés</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:12,color:'var(--text2)'}}>{emp.cpPris}j pris /</span>
                        {editSolde?.empId===emp.id&&editSolde?.type==='cp'?(
                          <span style={{display:'inline-flex',gap:4,alignItems:'center'}}>
                            <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                              style={{width:44,padding:'3px 6px',borderRadius:7,border:'1.5px solid #E11D48',fontSize:12,textAlign:'center',outline:'none'}}/>
                            <button onClick={()=>saveSolde(emp.id,'cp')} style={{padding:'3px 8px',borderRadius:7,border:'none',background:'#E11D48',color:'white',fontSize:11,fontWeight:700,cursor:'pointer'}}>✓</button>
                            <button onClick={()=>setEditSolde(null)} style={{padding:'3px 6px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg)',fontSize:11,cursor:'pointer'}}>✕</button>
                          </span>
                        ):(
                          <button onClick={()=>{setEditSolde({empId:emp.id,type:'cp'});setSoldeTmp(String(emp.cpTotal))}}
                            style={{border:'none',background:'transparent',color:'#E11D48',fontWeight:700,fontSize:12,cursor:'pointer',textDecoration:'underline'}}>
                            {emp.cpTotal}j
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{height:6,background:'var(--bg)',borderRadius:3,overflow:'hidden',border:'1px solid var(--border)'}}>
                      <div style={{height:'100%',background:cpPct>80?'#dc2626':cpPct>50?'#ea580c':'#16a34a',width:`${cpPct}%`,borderRadius:3,transition:'width .4s'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                      <span style={{fontSize:11,color:'var(--text3)'}}>{cpPct}% utilisé</span>
                      <span style={{fontSize:11,fontWeight:700,color:cpS>5?'#16a34a':cpS>0?'#ea580c':'#dc2626'}}>{cpS}j restants</span>
                    </div>
                  </div>

                  {/* RTT */}
                  {emp.rttTotal>0&&(
                    <div style={{borderTop:'1px solid var(--border)',paddingTop:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontSize:13}}>⏰</span>
                          <span style={{fontSize:12,fontWeight:700,color:'#7c3aed'}}>RTT</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:12,color:'var(--text2)'}}>{emp.rttPris}j pris /</span>
                          {editSolde?.empId===emp.id&&editSolde?.type==='rtt'?(
                            <span style={{display:'inline-flex',gap:4,alignItems:'center'}}>
                              <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                                style={{width:44,padding:'3px 6px',borderRadius:7,border:'1.5px solid #7c3aed',fontSize:12,textAlign:'center',outline:'none'}}/>
                              <button onClick={()=>saveSolde(emp.id,'rtt')} style={{padding:'3px 8px',borderRadius:7,border:'none',background:'#7c3aed',color:'white',fontSize:11,fontWeight:700,cursor:'pointer'}}>✓</button>
                              <button onClick={()=>setEditSolde(null)} style={{padding:'3px 6px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg)',fontSize:11,cursor:'pointer'}}>✕</button>
                            </span>
                          ):(
                            <button onClick={()=>{setEditSolde({empId:emp.id,type:'rtt'});setSoldeTmp(String(emp.rttTotal))}}
                              style={{border:'none',background:'transparent',color:'#7c3aed',fontWeight:700,fontSize:12,cursor:'pointer',textDecoration:'underline'}}>
                              {emp.rttTotal}j
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{fontSize:11,fontWeight:700,color:rttS>0?'#7c3aed':'#6b7280',textAlign:'right'}}>{rttS}j restants</div>
                    </div>
                  )}

                  {/* Report N-1 */}
                  <div style={{borderTop:'1px solid var(--border)',paddingTop:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:13}}>🔄</span>
                        <span style={{fontSize:12,fontWeight:700,color:'#2563EB'}}>Report N-1</span>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <div style={{fontSize:15,fontWeight:900,color:'#2563EB'}}>{emp.cpReportes}j</div>
                        <div style={{fontSize:10,color:'var(--text2)',display:'flex',alignItems:'center',gap:4}}>
                          Plafond :&nbsp;
                          {editSolde?.empId===emp.id&&editSolde?.type==='report_plafond'?(
                            <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                              <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                                style={{width:38,padding:'2px 4px',borderRadius:6,border:'1.5px solid #2563EB',fontSize:10,textAlign:'center',outline:'none'}}/>
                              <button onClick={()=>saveSolde(emp.id,'report_plafond')} style={{padding:'2px 6px',borderRadius:6,border:'none',background:'#2563EB',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                              <button onClick={()=>setEditSolde(null)} style={{padding:'2px 5px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                            </span>
                          ):(
                            <button onClick={()=>{setEditSolde({empId:emp.id,type:'report_plafond'});setSoldeTmp(String(emp.cpReportPlafond))}}
                              style={{border:'none',background:'transparent',color:'#2563EB',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>
                              {emp.cpReportPlafond}j ✏️
                            </button>
                          )}
                        </div>
                        <div style={{fontSize:10,color:'var(--text2)',display:'flex',alignItems:'center',gap:4}}>
                          Expire :&nbsp;
                          {editSolde?.empId===emp.id&&editSolde?.type==='report_expiration'?(
                            <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                              <input type="date" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)}
                                style={{padding:'2px 4px',borderRadius:6,border:'1.5px solid #2563EB',fontSize:10,outline:'none'}}/>
                              <button onClick={()=>saveSolde(emp.id,'report_expiration')} style={{padding:'2px 6px',borderRadius:6,border:'none',background:'#2563EB',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                              <button onClick={()=>setEditSolde(null)} style={{padding:'2px 5px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                            </span>
                          ):(
                            <button onClick={()=>{setEditSolde({empId:emp.id,type:'report_expiration'});setSoldeTmp(emp.cpReportExpiration?emp.cpReportExpiration.split('T')[0]:'')}}
                              style={{border:'none',background:'transparent',color:'#2563EB',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>
                              {emp.cpReportExpiration?new Date(emp.cpReportExpiration+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'Non définie ✏️'}
                            </button>
                          )}
                        </div>
                        <button onClick={()=>resetAnnuel(emp.id,emp.cpTotal,emp.cpPris,emp.cpReportPlafond)}
                          style={{padding:'3px 10px',borderRadius:7,border:'1px solid #bfdbfe',background:'#eff6ff',color:'#2563EB',fontSize:10,fontWeight:700,cursor:'pointer',marginTop:2}}>
                          Reset annuel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL EXPORT */}
      {exportModal&&(
        <div onClick={()=>setExportModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:24,width:'100%',maxWidth:360,boxShadow:'0 8px 40px rgba(0,0,0,.2)'}}>
            <div style={{fontSize:16,fontWeight:800,marginBottom:16}}>📄 Export PDF</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Employé</label>
              <select value={exportForm.emp} onChange={e=>setExportForm(f=>({...f,emp:e.target.value}))}
                style={{...inp}}>
                <option value="">Tous</option>
                {employes.filter(e=>e.actif!==false).map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Du</label>
                <input type='date' value={exportForm.debut} onChange={e=>setExportForm(f=>({...f,debut:e.target.value}))} style={{...inp}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Au</label>
                <input type='date' value={exportForm.fin} onChange={e=>setExportForm(f=>({...f,fin:e.target.value}))} style={{...inp}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {[{l:'Ce mois',d:new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0],f:new Date(new Date().getFullYear(),new Date().getMonth()+1,0).toISOString().split('T')[0]},{l:'Année',d:`${new Date().getFullYear()}-01-01`,f:`${new Date().getFullYear()}-12-31`}].map(p=>(
                <button key={p.l} onClick={()=>setExportForm(f=>({...f,debut:p.d,fin:p.f}))}
                  style={{flex:1,padding:'7px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',fontSize:12,fontWeight:600,cursor:'pointer',color:'var(--text2)'}}>{p.l}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setExportModal(false)} style={{flex:1,height:44,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={()=>{doExportPDF(conges,restaurant,employes,exportForm.emp||null,exportForm.debut||null,exportForm.fin||null);setExportModal(false)}}
                style={{flex:2,height:44,borderRadius:10,border:'none',background:'#16a34a',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>📄 Générer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
