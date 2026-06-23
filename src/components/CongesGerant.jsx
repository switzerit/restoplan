import { useState, useEffect } from 'react'
import socket from '../socketClient'
import { api } from '../apiClient'

const TYPES = {
  conge_paye:      {l:'Congé payé',   emoji:'🏖️',c:'#E11D48',bg:'#fff1f3',bc:'#fecdd3'},
  conges_reportes: {l:'Reportés N-1', emoji:'🔄',c:'#2563EB',bg:'#eff6ff',bc:'#bfdbfe'},
  maladie:         {l:'Maladie',      emoji:'🏥',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  rtt:             {l:'RTT',          emoji:'⏰',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
  sans_solde:      {l:'Sans solde',   emoji:'📋',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  autre:           {l:'Autre',        emoji:'📝',c:'#6b7280',bg:'#f5f5f5',bc:'#e0e0e0'},
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
function todayStr(){return new Date().toISOString().split('T')[0]}

function doExportPDF(conges,restaurant,employes,filtreEmp,dateDebut,dateFin){
  let filtered=conges
  if(filtreEmp) filtered=filtered.filter(c=>c.employe_id===filtreEmp)
  if(dateDebut) filtered=filtered.filter(c=>c.date_debut>=dateDebut)
  if(dateFin) filtered=filtered.filter(c=>c.date_fin<=dateFin)
  const byEmp={}
  filtered.forEach(c=>{if(!byEmp[c.employe_id])byEmp[c.employe_id]=[];byEmp[c.employe_id].push(c)})
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Congés — ${restaurant.nom}</title>
<style>body{font-family:Arial,sans-serif;padding:30px;font-size:13px;color:#111}
h1{font-size:18px;margin:0 0 4px}
.meta{color:#666;font-size:12px;margin-bottom:20px}
h3{font-size:14px;margin:16px 0 6px;padding:8px 12px;background:#fff1f3;border-radius:6px;color:#E11D48}
table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px}
th{background:#f5f5f5;padding:6px 10px;text-align:left;border:1px solid #ddd}
td{padding:6px 10px;border:1px solid #ddd}
.badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
.accepte{background:#f0fdf4;color:#16a34a}.refuse{background:#fef2f2;color:#dc2626}
.annule{background:#f3f4f6;color:#6b7280}.en_attente{background:#fff7ed;color:#ea580c}
</style></head><body>
<h1>Rapport congés — ${restaurant.nom}</h1>
<div class="meta">Généré le ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
${Object.entries(byEmp).map(([,cs])=>`
<h3>${cs[0]?.prenom||''} ${cs[0]?.nom||''}</h3>
<table><tr><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Statut</th><th>Message</th></tr>
${cs.map(c=>`<tr>
<td>${TYPES[c.type]?.emoji} ${TYPES[c.type]?.l||c.type}</td>
<td>${fmtDShort(c.date_debut)}</td><td>${fmtDShort(c.date_fin)}</td>
<td style="text-align:center;font-weight:700">${nbJ(c.date_debut,c.date_fin)}</td>
<td><span class="badge ${c.statut}">${STATUTS[c.statut]?.l||c.statut}</span></td>
<td style="color:#666;font-style:italic">${c.message||'—'}</td>
</tr>`).join('')}</table>`).join('')}
</body></html>`
  const w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(()=>w.print(),300)
}

export default function CongesGerant({restaurant,employes,showToast,onReloadEmployes,isMobile}){
  const [conges,setConges]=useState([])
  const [soldesMap,setSoldesMap]=useState({})
  const [page,setPage]=useState('demandes')
  const [selected,setSelected]=useState(null)
  const [commentaire,setCommentaire]=useState('')
  const [historiqueOpen,setHistoriqueOpen]=useState(false)
  const [filtreHisto,setFiltreHisto]=useState('tous')
  const [editSolde,setEditSolde]=useState(null)
  const [soldeTmp,setSoldeTmp]=useState('')
  const [exportModal,setExportModal]=useState(false)
  const [exportForm,setExportForm]=useState({emp:'',debut:'',fin:''})
  const [processing,setProcessing]=useState(false)

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
    setProcessing(true)
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
    setSelected(null);setCommentaire('');setProcessing(false)
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

  const today=todayStr()
  const enAttente=conges.filter(c=>c.statut==='en_attente')
  const absentsAujourdhui=conges.filter(c=>c.statut==='accepte'&&c.date_debut<=today&&c.date_fin>=today)
  const absentsCetteSemaine=(()=>{
    const d=new Date();const day=d.getDay();const diff=d.getDate()-day+(day===0?-6:1)
    const lun=new Date(d.setDate(diff)).toISOString().split('T')[0]
    const dim=new Date(new Date(lun).getTime()+6*86400000).toISOString().split('T')[0]
    return conges.filter(c=>c.statut==='accepte'&&c.date_debut<=dim&&c.date_fin>=lun)
  })()
  const historique=conges.filter(c=>c.statut!=='en_attente').filter(c=>filtreHisto==='tous'?true:c.statut===filtreHisto)

  const soldesData=employes.filter(e=>e.actif!==false&&!e.est_gerant).map(emp=>{
    const s=soldesMap[emp.id]||emp
    return{...emp,cpPris:s.conges_pris||0,cpTotal:s.conges_total||25,rttPris:s.rtt_pris||0,rttTotal:s.rtt_total||0,
      cpReportes:s.conges_reportes||0,cpReportPlafond:s.conges_report_plafond||0,cpReportExpiration:s.conges_report_expiration||null}
  })

  const sel=selected?conges.find(c=>c.id===selected):null
  const inp={width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box',fontFamily:'var(--font)'}

  // ─── PANNEAU DÉTAIL (slide-over desktop / bottom-sheet mobile) ───
  function DetailPanel(){
    if(!sel) return null
    const type=TYPES[sel.type]||TYPES.autre
    const stat=STATUTS[sel.statut]||STATUTS.en_attente
    const jours=nbJ(sel.date_debut,sel.date_fin)
    const solde=soldesMap[sel.employe_id]
    const cpS=(solde?.conges_total||25)-(solde?.conges_pris||0)
    const rttS=(solde?.rtt_total||0)-(solde?.rtt_pris||0)
    const repS=solde?.conges_reportes||0
    const emp=employes.find(e=>e.id===sel.employe_id)
    const isPending=sel.statut==='en_attente'

    const panelInner=(
      <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--surface)'}}>
        {/* Header */}
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
            <div style={{width:46,height:46,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,flexShrink:0,border:'1.5px solid #fecdd3'}}>
              {ini(sel.prenom,sel.nom)}
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:16,fontWeight:800,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{sel.prenom} {sel.nom}</div>
              <div style={{fontSize:12,color:'var(--text2)'}}>{emp?.role||'—'}{emp?.groupe_nom?` · ${emp.groupe_nom}`:''}</div>
            </div>
          </div>
          <button onClick={()=>{setSelected(null);setCommentaire('')}} style={{width:30,height:30,borderRadius:8,border:'none',background:'var(--bg)',cursor:'pointer',fontSize:16,color:'var(--text2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        {/* Corps scrollable */}
        <div style={{flex:1,padding:'18px 20px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:20,background:type.bg,color:type.c,fontSize:12,fontWeight:700,border:`1px solid ${type.bc}`}}>
              {type.emoji} {type.l}
            </span>
            <span style={{padding:'5px 12px',borderRadius:20,background:stat.bg,color:stat.c,fontSize:12,fontWeight:700,border:`1px solid ${stat.bc}`}}>{stat.l}</span>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:'var(--bg)',borderRadius:11,padding:'13px 14px',border:'1px solid var(--border)'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Période</div>
              <div style={{fontSize:13,fontWeight:700}}>{fmtDLong(sel.date_debut)}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>→ {fmtDLong(sel.date_fin)}</div>
              <div style={{fontSize:15,fontWeight:900,color:type.c,marginTop:7}}>{jours} jour{jours>1?'s':''}</div>
            </div>
            <div style={{background:'var(--bg)',borderRadius:11,padding:'13px 14px',border:'1px solid var(--border)'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Solde restant</div>
              {sel.type==='conge_paye'&&<><div style={{fontSize:26,fontWeight:900,color:cpS>=jours?'#16a34a':'#dc2626'}}>{cpS}j</div><div style={{fontSize:11,color:'var(--text2)'}}>sur {solde?.conges_total||25}j / an{cpS<jours&&<span style={{color:'#dc2626',fontWeight:700}}> ⚠️ insuffisant</span>}</div></>}
              {sel.type==='rtt'&&<><div style={{fontSize:26,fontWeight:900,color:'#7c3aed'}}>{rttS}j</div><div style={{fontSize:11,color:'var(--text2)'}}>RTT restants</div></>}
              {sel.type==='conges_reportes'&&<><div style={{fontSize:26,fontWeight:900,color:'#2563EB'}}>{repS}j</div><div style={{fontSize:11,color:'var(--text2)'}}>reportés restants</div></>}
              {(sel.type==='maladie'||sel.type==='sans_solde'||sel.type==='autre')&&<div style={{fontSize:13,color:'var(--text2)',marginTop:8}}>Pas de décompte de solde</div>}
            </div>
          </div>

          {sel.message&&(
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Message de l'employé</div>
              <div style={{background:'var(--bg)',borderRadius:11,padding:'12px 14px',border:'1px solid var(--border)',fontSize:13,color:'var(--text)',fontStyle:'italic'}}>"{sel.message}"</div>
            </div>
          )}

          {sel.commentaire_gerant&&(
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Votre réponse</div>
              <div style={{background:'var(--accent-bg)',borderRadius:11,padding:'12px 14px',fontSize:13,color:'var(--accent)'}}>{sel.commentaire_gerant}</div>
            </div>
          )}

          {isPending&&(
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Réponse (optionnel)</div>
              <textarea value={commentaire} onChange={e=>setCommentaire(e.target.value)} placeholder={`Un mot pour ${sel.prenom}...`} style={{...inp,resize:'none',height:70}}/>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {isPending&&(
          <div style={{padding:'16px 20px',borderTop:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,flexShrink:0}}>
            <button onClick={()=>traiter(sel.id,'refuse')} disabled={processing} style={{padding:'13px',borderRadius:12,border:'1.5px solid #fecaca',background:'var(--surface)',color:'#dc2626',fontSize:14,fontWeight:700,cursor:'pointer',opacity:processing?.6:1}}>Refuser</button>
            <button onClick={()=>traiter(sel.id,'accepte')} disabled={processing} style={{padding:'13px',borderRadius:12,border:'none',background:'#16a34a',color:'white',fontSize:14,fontWeight:800,cursor:'pointer',opacity:processing?.6:1}}>{processing?'...':'✓ Accepter le congé'}</button>
          </div>
        )}
        {!isPending&&sel.statut==='accepte'&&(
          <div style={{padding:'16px 20px',borderTop:'1px solid var(--border)',flexShrink:0}}>
            <button onClick={()=>traiter(sel.id,'annule')} disabled={processing} style={{width:'100%',padding:'13px',borderRadius:12,border:'1.5px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler ce congé</button>
          </div>
        )}
      </div>
    )

    // Overlay + positionnement
    return (
      <div onClick={()=>{setSelected(null);setCommentaire('')}}
        style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',
          alignItems:isMobile?'flex-end':'stretch',justifyContent:'flex-end'}}>
        <div onClick={e=>e.stopPropagation()} style={isMobile
          ?{width:'100%',maxHeight:'90vh',background:'var(--surface)',borderRadius:'20px 20px 0 0',overflow:'hidden',boxShadow:'0 -8px 40px rgba(0,0,0,.2)'}
          :{width:440,maxWidth:'92vw',height:'100%',background:'var(--surface)',boxShadow:'-8px 0 40px rgba(0,0,0,.16)'}}>
          {isMobile&&<div style={{display:'flex',justifyContent:'center',padding:'10px 0 4px'}}><div style={{width:36,height:4,borderRadius:2,background:'var(--border2)'}}/></div>}
          <div style={{height:isMobile?'calc(90vh - 18px)':'100%'}}>{panelInner}</div>
        </div>
      </div>
    )
  }

  // ─── Carte demande (cliquable) ───
  function DemandeCard(c){
    const type=TYPES[c.type]||TYPES.autre
    const jours=nbJ(c.date_debut,c.date_fin)
    return (
      <div key={c.id} onClick={()=>{setSelected(c.id);setCommentaire('')}} style={{
        background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'14px 16px',
        display:'flex',alignItems:'center',gap:12,cursor:'pointer',transition:'all .15s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=type.c;e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.05)'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
        <div style={{width:40,height:40,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,flexShrink:0,border:'1.5px solid #fecdd3'}}>
          {ini(c.prenom,c.nom)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{c.prenom} {c.nom}</div>
          <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:20,background:type.bg,color:type.c,border:`1px solid ${type.bc}`}}>{type.emoji} {type.l}</span>
            <span style={{fontSize:12,color:'var(--text2)'}}>{fmtD(c.date_debut)} → {fmtD(c.date_fin)} · <strong>{jours}j</strong></span>
          </div>
        </div>
        <span style={{fontSize:18,color:'var(--text3)',flexShrink:0}}>›</span>
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Header onglets + export */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:3,background:'var(--bg)',borderRadius:11,padding:3}}>
          {[{id:'demandes',l:'Demandes'},{id:'soldes',l:'Soldes'}].map(t=>(
            <button key={t.id} onClick={()=>setPage(t.id)} style={{
              padding:'8px 18px',borderRadius:9,border:'none',fontSize:13,fontWeight:page===t.id?700:500,
              cursor:'pointer',transition:'all .15s',position:'relative',
              background:page===t.id?'var(--surface)':'transparent',color:page===t.id?'var(--text)':'var(--text2)',
              boxShadow:page===t.id?'0 1px 4px rgba(0,0,0,.08)':'none'}}>
              {t.l}
              {t.id==='demandes'&&enAttente.length>0&&(
                <span style={{position:'absolute',top:4,right:4,minWidth:15,height:15,borderRadius:8,background:'#E11D48',color:'white',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{enAttente.length}</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={()=>setExportModal(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text2)',fontSize:12,fontWeight:600,cursor:'pointer'}}>📄 PDF</button>
      </div>

      {/* VUE DEMANDES */}
      {page==='demandes'&&(<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          <div style={{background:'#fff7ed',border:'1.5px solid #fed7aa',borderRadius:14,padding:'14px 12px'}}>
            <div style={{fontSize:28,fontWeight:800,color:'#c2410c',lineHeight:1}}>{enAttente.length}</div>
            <div style={{fontSize:11,fontWeight:600,color:'#c2410c',marginTop:4}}>En attente</div>
          </div>
          <div style={{background:'#faf5ff',border:'1.5px solid #e9d5ff',borderRadius:14,padding:'14px 12px'}}>
            <div style={{fontSize:28,fontWeight:800,color:'#7e22ce',lineHeight:1}}>{absentsAujourdhui.length}</div>
            <div style={{fontSize:11,fontWeight:600,color:'#7e22ce',marginTop:4}}>Absent{absentsAujourdhui.length>1?'s':''} aujourd'hui</div>
          </div>
          <div style={{background:'#f0fdf4',border:'1.5px solid #bbf7d0',borderRadius:14,padding:'14px 12px'}}>
            <div style={{fontSize:28,fontWeight:800,color:'#15803d',lineHeight:1}}>{absentsCetteSemaine.length}</div>
            <div style={{fontSize:11,fontWeight:600,color:'#15803d',marginTop:4}}>Cette semaine</div>
          </div>
        </div>

        {enAttente.length>0?(
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.5px'}}>À traiter · {enAttente.length}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>{enAttente.map(DemandeCard)}</div>
          </div>
        ):(
          <div style={{textAlign:'center',padding:'36px 20px',background:'var(--surface)',borderRadius:16,border:'1px solid var(--border)'}}>
            <div style={{fontSize:40,marginBottom:10}}>✅</div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Tout est traité</div>
            <div style={{fontSize:13,color:'var(--text2)'}}>Aucune demande en attente</div>
          </div>
        )}

        {/* Historique */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
          <button onClick={()=>setHistoriqueOpen(o=>!o)} style={{width:'100%',padding:'13px 16px',background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>Historique · {conges.filter(c=>c.statut!=='en_attente').length} demande{conges.filter(c=>c.statut!=='en_attente').length!==1?'s':''}</span>
            <span style={{fontSize:16,color:'var(--text3)',transform:historiqueOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>⌃</span>
          </button>
          {historiqueOpen&&(
            <div style={{borderTop:'1px solid var(--border)',padding:'12px 14px',display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2}}>
                {[{id:'tous',l:'Tous'},{id:'accepte',l:'Acceptés'},{id:'refuse',l:'Refusés'},{id:'annule',l:'Annulés'}].map(f=>(
                  <button key={f.id} onClick={()=>setFiltreHisto(f.id)} style={{flexShrink:0,padding:'5px 12px',borderRadius:20,fontSize:11,cursor:'pointer',fontWeight:filtreHisto===f.id?700:500,border:`1.5px solid ${filtreHisto===f.id?'#E11D48':'var(--border)'}`,background:filtreHisto===f.id?'#E11D48':'var(--surface)',color:filtreHisto===f.id?'white':'var(--text2)'}}>{f.l}</button>
                ))}
              </div>
              {historique.length===0?(
                <div style={{textAlign:'center',padding:'20px',color:'var(--text3)',fontSize:13}}>Aucune demande</div>
              ):historique.map(c=>{
                const type=TYPES[c.type]||TYPES.autre
                const stat=STATUTS[c.statut]||STATUTS.refuse
                const jours=nbJ(c.date_debut,c.date_fin)
                return (
                  <div key={c.id} onClick={()=>{setSelected(c.id);setCommentaire('')}} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 12px',background:'var(--bg)',borderRadius:12,border:'1px solid var(--border)',cursor:'pointer'}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:'#f5f5f5',color:'#555',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{ini(c.prenom,c.nom)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{c.prenom} {c.nom}</div>
                      <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:type.bg,color:type.c,border:`1px solid ${type.bc}`,fontWeight:600}}>{type.emoji} {type.l}</span>
                        <span style={{fontSize:11,color:'var(--text3)'}}>{fmtD(c.date_debut)} → {fmtD(c.date_fin)} · {jours}j</span>
                      </div>
                    </div>
                    <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:stat.bg,color:stat.c,border:`1px solid ${stat.bc}`,flexShrink:0,whiteSpace:'nowrap'}}>{stat.l}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </>)}

      {/* VUE SOLDES */}
      {page==='soldes'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:12,color:'var(--text2)',padding:'10px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)'}}>💡 Appuyez sur un solde souligné pour le modifier.</div>
          {soldesData.map(emp=>{
            const cpS=emp.cpTotal-emp.cpPris
            const rttS=emp.rttTotal-emp.rttPris
            const cpPct=emp.cpTotal>0?Math.min(100,Math.round(emp.cpPris/emp.cpTotal*100)):0
            const rttPct=emp.rttTotal>0?Math.min(100,Math.round(emp.rttPris/emp.rttTotal*100)):0
            const edCP=editSolde?.empId===emp.id&&editSolde?.type==='cp'
            const edRTT=editSolde?.empId===emp.id&&editSolde?.type==='rtt'
            const edRP=editSolde?.empId===emp.id&&editSolde?.type==='report_plafond'
            const edRE=editSolde?.empId===emp.id&&editSolde?.type==='report_expiration'
            return (
              <div key={emp.id} style={{background:'var(--surface)',borderRadius:16,border:'1px solid var(--border)',overflow:'hidden'}}>
                <div style={{padding:'13px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{ini(emp.prenom,emp.nom)}</div>
                  <div><div style={{fontSize:14,fontWeight:700}}>{emp.prenom} {emp.nom}</div><div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div></div>
                </div>
                <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
                      <span style={{fontSize:12,fontWeight:700,color:'#E11D48'}}>🏖️ Congés payés</span>
                      <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text2)'}}>
                        {emp.cpPris}j pris /&nbsp;
                        {edCP?(
                          <span style={{display:'inline-flex',gap:4,alignItems:'center'}}>
                            <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365" style={{width:44,padding:'3px 6px',borderRadius:7,border:'1.5px solid #E11D48',fontSize:12,textAlign:'center',outline:'none'}}/>
                            <button onClick={()=>saveSolde(emp.id,'cp')} style={{padding:'3px 8px',borderRadius:7,border:'none',background:'#E11D48',color:'white',fontSize:11,fontWeight:700,cursor:'pointer'}}>✓</button>
                            <button onClick={()=>setEditSolde(null)} style={{padding:'3px 6px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg)',fontSize:11,cursor:'pointer'}}>✕</button>
                          </span>
                        ):(
                          <button onClick={()=>{setEditSolde({empId:emp.id,type:'cp'});setSoldeTmp(String(emp.cpTotal))}} style={{border:'none',background:'transparent',color:'#E11D48',fontWeight:700,fontSize:12,cursor:'pointer',textDecoration:'underline'}}>{emp.cpTotal}j</button>
                        )}
                      </div>
                    </div>
                    <div style={{height:5,background:'var(--bg)',borderRadius:3,overflow:'hidden',border:'1px solid var(--border)'}}><div style={{height:'100%',background:cpPct>80?'#dc2626':cpPct>50?'#ea580c':'#16a34a',width:`${cpPct}%`,borderRadius:3,transition:'width .4s'}}/></div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
                      <span style={{fontSize:11,color:'var(--text3)'}}>{cpPct}% utilisé</span>
                      <span style={{fontSize:11,fontWeight:700,color:cpS>5?'#16a34a':cpS>0?'#ea580c':'#dc2626'}}>{cpS}j restants</span>
                    </div>
                  </div>

                  {(emp.rttTotal>0||edRTT)&&(
                    <div style={{borderTop:'1px solid var(--border)',paddingTop:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
                        <span style={{fontSize:12,fontWeight:700,color:'#7c3aed'}}>⏰ RTT</span>
                        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text2)'}}>
                          {emp.rttPris}j pris /&nbsp;
                          {edRTT?(
                            <span style={{display:'inline-flex',gap:4,alignItems:'center'}}>
                              <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365" style={{width:44,padding:'3px 6px',borderRadius:7,border:'1.5px solid #7c3aed',fontSize:12,textAlign:'center',outline:'none'}}/>
                              <button onClick={()=>saveSolde(emp.id,'rtt')} style={{padding:'3px 8px',borderRadius:7,border:'none',background:'#7c3aed',color:'white',fontSize:11,fontWeight:700,cursor:'pointer'}}>✓</button>
                              <button onClick={()=>setEditSolde(null)} style={{padding:'3px 6px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg)',fontSize:11,cursor:'pointer'}}>✕</button>
                            </span>
                          ):(
                            <button onClick={()=>{setEditSolde({empId:emp.id,type:'rtt'});setSoldeTmp(String(emp.rttTotal))}} style={{border:'none',background:'transparent',color:'#7c3aed',fontWeight:700,fontSize:12,cursor:'pointer',textDecoration:'underline'}}>{emp.rttTotal}j</button>
                          )}
                        </div>
                      </div>
                      {emp.rttTotal>0&&<div style={{height:5,background:'var(--bg)',borderRadius:3,overflow:'hidden',border:'1px solid var(--border)'}}><div style={{height:'100%',background:rttPct>80?'#dc2626':'#7c3aed',width:`${rttPct}%`,borderRadius:3}}/></div>}
                      <div style={{textAlign:'right',marginTop:5,fontSize:11,fontWeight:700,color:rttS>0?'#7c3aed':'#6b7280'}}>{rttS}j restants</div>
                    </div>
                  )}
                  {emp.rttTotal===0&&!edRTT&&(
                    <button onClick={()=>{setEditSolde({empId:emp.id,type:'rtt'});setSoldeTmp('0')}} style={{border:'1px dashed var(--border)',background:'transparent',borderRadius:9,padding:'7px',fontSize:11,color:'var(--text3)',cursor:'pointer',width:'100%'}}>+ Ajouter des RTT</button>
                  )}

                  <div style={{borderTop:'1px solid var(--border)',paddingTop:12}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:12,fontWeight:700,color:'#2563EB'}}>🔄 Report N-1</span>
                      <div style={{fontSize:15,fontWeight:900,color:'#2563EB'}}>{emp.cpReportes}j</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,color:'var(--text2)'}}>
                        <span>Plafond</span>
                        {edRP?(
                          <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                            <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365" style={{width:40,padding:'2px 5px',borderRadius:6,border:'1.5px solid #2563EB',fontSize:11,textAlign:'center',outline:'none'}}/>
                            <button onClick={()=>saveSolde(emp.id,'report_plafond')} style={{padding:'2px 6px',borderRadius:6,border:'none',background:'#2563EB',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                            <button onClick={()=>setEditSolde(null)} style={{padding:'2px 5px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                          </span>
                        ):(
                          <button onClick={()=>{setEditSolde({empId:emp.id,type:'report_plafond'});setSoldeTmp(String(emp.cpReportPlafond))}} style={{border:'none',background:'transparent',color:'#2563EB',fontWeight:700,fontSize:11,cursor:'pointer',textDecoration:'underline'}}>{emp.cpReportPlafond}j ✏️</button>
                        )}
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,color:'var(--text2)'}}>
                        <span>Expiration</span>
                        {edRE?(
                          <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                            <input type="date" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} style={{padding:'2px 5px',borderRadius:6,border:'1.5px solid #2563EB',fontSize:11,outline:'none'}}/>
                            <button onClick={()=>saveSolde(emp.id,'report_expiration')} style={{padding:'2px 6px',borderRadius:6,border:'none',background:'#2563EB',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                            <button onClick={()=>setEditSolde(null)} style={{padding:'2px 5px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                          </span>
                        ):(
                          <button onClick={()=>{setEditSolde({empId:emp.id,type:'report_expiration'});setSoldeTmp(emp.cpReportExpiration?String(emp.cpReportExpiration).split('T')[0]:'')}} style={{border:'none',background:'transparent',color:'#2563EB',fontWeight:700,fontSize:11,cursor:'pointer',textDecoration:'underline'}}>{emp.cpReportExpiration?new Date(String(emp.cpReportExpiration).split('T')[0]+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'Non définie ✏️'}</button>
                        )}
                      </div>
                      <button onClick={()=>resetAnnuel(emp.id,emp.cpTotal,emp.cpPris,emp.cpReportPlafond)} style={{padding:'6px',borderRadius:8,border:'1px solid #bfdbfe',background:'#eff6ff',color:'#2563EB',fontSize:11,fontWeight:700,cursor:'pointer',marginTop:2}}>Reset annuel</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Panneau détail */}
      <DetailPanel/>

      {/* MODAL EXPORT */}
      {exportModal&&(
        <div onClick={()=>setExportModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',backdropFilter:'blur(6px)',display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center',zIndex:400}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:isMobile?'20px 20px 0 0':20,padding:24,width:'100%',maxWidth:480,boxShadow:'0 8px 40px rgba(0,0,0,.2)'}}>
            {isMobile&&<div style={{display:'flex',justifyContent:'center',marginBottom:16}}><div style={{width:36,height:4,borderRadius:2,background:'var(--border)'}}/></div>}
            <div style={{fontSize:16,fontWeight:800,marginBottom:16}}>📄 Exporter en PDF</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Employé</label>
              <select value={exportForm.emp} onChange={e=>setExportForm(f=>({...f,emp:e.target.value}))} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}>
                <option value="">Tous les employés</option>
                {employes.filter(e=>e.actif!==false&&!e.est_gerant).map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div><label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Du</label><input type='date' value={exportForm.debut} onChange={e=>setExportForm(f=>({...f,debut:e.target.value}))} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/></div>
              <div><label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Au</label><input type='date' value={exportForm.fin} onChange={e=>setExportForm(f=>({...f,fin:e.target.value}))} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/></div>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {[{l:'Ce mois',d:new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0],f:new Date(new Date().getFullYear(),new Date().getMonth()+1,0).toISOString().split('T')[0]},{l:'Cette année',d:`${new Date().getFullYear()}-01-01`,f:`${new Date().getFullYear()}-12-31`}].map(p=>(
                <button key={p.l} onClick={()=>setExportForm(f=>({...f,debut:p.d,fin:p.f}))} style={{flex:1,padding:'8px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg)',fontSize:12,fontWeight:600,cursor:'pointer',color:'var(--text2)'}}>{p.l}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setExportModal(false)} style={{flex:1,height:46,borderRadius:11,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={()=>{doExportPDF(conges,restaurant,employes,exportForm.emp||null,exportForm.debut||null,exportForm.fin||null);setExportModal(false)}} style={{flex:2,height:46,borderRadius:11,border:'none',background:'#16a34a',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>📄 Générer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
