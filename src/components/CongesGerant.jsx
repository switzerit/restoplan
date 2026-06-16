import { useState, useEffect } from 'react'
import socket from '../socketClient'
import { api } from '../apiClient'

const TYPES = {
  conge_paye:{l:'Congé payé',emoji:'🏖️',c:'#E11D48',bg:'#fff1f3',bc:'#fecdd3'},
  conges_reportes:{l:'Congés reportés N-1',emoji:'🔄',c:'#2563EB',bg:'#eff6ff',bc:'#bfdbfe'},
  maladie:{l:'Arrêt maladie',emoji:'🏥',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  rtt:{l:'RTT',emoji:'⏰',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
  sans_solde:{l:'Sans solde',emoji:'📋',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  autre:{l:'Autre',emoji:'📝',c:'#555',bg:'#f5f5f5',bc:'#e0e0e0'},
}
const STATUTS = {
  en_attente:{l:'En attente',e:'⏳',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  accepte:{l:'Accepté',e:'✅',c:'#16a34a',bg:'#f0fdf4',bc:'#bbf7d0'},
  refuse:{l:'Refusé',e:'❌',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  annule:{l:'Annulé',e:'🚫',c:'#6b7280',bg:'#f3f4f6',bc:'#e5e7eb'},
}

function fmtLabel(s){if(!s)return '—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];const d=new Date(str+'T00:00:00');return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}
function fmtShort(s){if(!s)return '—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];const d=new Date(str+'T00:00:00');return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
function nbJours(d1,d2){return Math.max(1,Math.round((new Date(d2)-new Date(d1))/(1000*60*60*24))+1)}

function doExportPDF(conges, restaurant, employes, filtreEmp, dateDebut, dateFin){
  let filtered = conges
  if(filtreEmp) filtered = filtered.filter(c=>c.employe_id===filtreEmp)
  if(dateDebut) filtered = filtered.filter(c=>c.date_debut>=dateDebut)
  if(dateFin) filtered = filtered.filter(c=>c.date_fin<=dateFin)

  const byEmp={}
  filtered.forEach(c=>{if(!byEmp[c.employe_id])byEmp[c.employe_id]=[];byEmp[c.employe_id].push(c)})

  const periodLabel = dateDebut&&dateFin ? `${fmtShort(dateDebut)} → ${fmtShort(dateFin)}` : dateDebut ? `À partir du ${fmtShort(dateDebut)}` : dateFin ? `Jusqu'au ${fmtShort(dateFin)}` : 'Toute la période'
  const empLabel = filtreEmp ? (employes.find(e=>e.id===filtreEmp)||{prenom:'',nom:''}) : null

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Congés — ${restaurant.nom}</title>
<style>
body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:13px}
h1{font-size:20px;margin:0 0 4px}
.meta{color:#666;font-size:12px;margin-bottom:6px}
.period{display:inline-block;background:#fff1f3;color:#E11D48;border:1px solid #fecdd3;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:20px}
.cards{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.card{background:#f5f5f5;padding:10px 16px;border-radius:8px;text-align:center;min-width:90px}
.card-n{font-size:24px;font-weight:800}.card-l{font-size:10px;color:#666;margin-top:2px}
h2{font-size:13px;background:#fff1f3;padding:7px 12px;border-radius:6px;margin:16px 0 7px;color:#0051a8;display:flex;align-items:center;gap:8px}
table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px}
th{background:#f5f5f5;padding:6px 10px;text-align:left;border:1px solid #ddd;font-size:11px}
td{padding:6px 10px;border:1px solid #ddd}
.badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;display:inline-block}
.accepte{background:#f0fdf4;color:#16a34a}.refuse{background:#fef2f2;color:#dc2626}
.annule{background:#f3f4f6;color:#6b7280}.en_attente{background:#fff7ed;color:#ea580c}
.t-cp{background:#fff1f3;color:#E11D48}.t-rtt{background:#faf5ff;color:#7c3aed}
.t-maladie{background:#fef2f2;color:#dc2626}.t-sans_solde{background:#fff7ed;color:#ea580c}
.t-autre{background:#f5f5f5;color:#555}
@media print{body{padding:15px}button{display:none}}
</style></head><body>
<h1>📋 Rapport des congés — ${restaurant.nom}</h1>
<div class="meta">Généré le ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
${empLabel?`<div class="meta">Employé : <strong>${empLabel.prenom} ${empLabel.nom}</strong></div>`:''}
<div class="period">📅 ${periodLabel}</div>
<div class="cards">
  <div class="card"><div class="card-n">${filtered.length}</div><div class="card-l">Demandes</div></div>
  <div class="card"><div class="card-n">${filtered.filter(c=>c.statut==='accepte').length}</div><div class="card-l">Acceptées</div></div>
  <div class="card"><div class="card-n">${filtered.filter(c=>c.statut==='en_attente').length}</div><div class="card-l">En attente</div></div>
  <div class="card"><div class="card-n">${filtered.filter(c=>c.statut==='refuse'||c.statut==='annule').length}</div><div class="card-l">Refusés/Annulés</div></div>
  <div class="card"><div class="card-n">${filtered.filter(c=>c.statut==='accepte').reduce((a,c)=>a+nbJours(c.date_debut,c.date_fin),0)}</div><div class="card-l">Jours accordés</div></div>
</div>
${Object.keys(byEmp).length===0?'<p style="color:#666;text-align:center;padding:20px">Aucun congé pour cette période</p>':
Object.entries(byEmp).map(([,cs])=>{
  const emp=cs[0]?.employes||{}
  const total=cs.filter(c=>c.statut==='accepte').reduce((a,c)=>a+nbJours(c.date_debut,c.date_fin),0)
  return `<h2>👤 ${emp.prenom||''} ${emp.nom||''} <span style="font-weight:400;color:#666;font-size:11px">${emp.role||''}</span> <span style="margin-left:auto;font-weight:700;color:#16a34a">${total}j acceptés</span></h2>
<table><tr><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Statut</th><th>Message employé</th><th>Commentaire gérant</th></tr>
${cs.map(c=>`<tr>
  <td><span class="badge t-${c.type}">${TYPES[c.type]?.emoji} ${TYPES[c.type]?.l||c.type}</span></td>
  <td>${fmtShort(c.date_debut)}</td><td>${fmtShort(c.date_fin)}</td>
  <td style="font-weight:700;text-align:center">${nbJours(c.date_debut,c.date_fin)}</td>
  <td><span class="badge ${c.statut}">${STATUTS[c.statut]?.e} ${STATUTS[c.statut]?.l||c.statut}</span></td>
  <td style="color:#666;font-style:italic">${c.message||'—'}</td>
  <td style="color:#666;font-style:italic">${c.commentaire_gerant||'—'}</td>
</tr>`).join('')}</table>`}).join('')}
</body></html>`
  const w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(()=>w.print(),300)
}

export default function CongesGerant({restaurant, employes, showToast}) {
  const [conges,setConges]=useState([])
  const [tab,setTab]=useState('attente')
  const [selected,setSelected]=useState(null)
  const [commentaire,setCommentaire]=useState('')
  const [editSolde,setEditSolde]=useState(null)
  const [soldeTmp,setSoldeTmp]=useState('')
  const [annulerConfirm,setAnnulerConfirm]=useState(null)
  const [exportModal,setExportModal]=useState(false)
  const [exportForm,setExportForm]=useState({emp:'',debut:'',fin:''})

  useEffect(()=>{
    if(!restaurant) return
    loadConges()
    socket.connect()
    socket.on('conge', loadConges)
    return () => { socket.off('conge'); socket.disconnect() }
  },[restaurant?.id])

  async function loadConges(){
    const data=await api.get(`/conges?restaurant_id=${restaurant.id}`)
    setConges(data||[])
  }

  async function traiter(id, statut){
    const c=conges.find(x=>x.id===id)
    const jours=nbJours(c.date_debut,c.date_fin)
    await api.put(`/conges/${id}`, {statut,commentaire_gerant:commentaire||null})
    if(statut==='accepte'){
      if(c.type==='conge_paye') await api.put(`/employes/${c.employe_id}`, {conges_pris:(c.conges_pris||0)+jours})
      if(c.type==='rtt') await api.put(`/employes/${c.employe_id}`, {rtt_pris:(c.rtt_pris||0)+jours})
      // Supprimer les shifts en conflit automatiquement
      await api.delete(`/shifts/employe/${c.employe_id}?from=${c.date_debut}&to=${c.date_fin}`)
    }
    if((statut==='refuse'||statut==='annule')&&c?.statut==='accepte'){
      if(c.type==='conge_paye') await api.put(`/employes/${c.employe_id}`, {conges_pris:Math.max(0,(c.conges_pris||0)-jours)})
      if(c.type==='rtt') await api.put(`/employes/${c.employe_id}`, {rtt_pris:Math.max(0,(c.rtt_pris||0)-jours)})
    }
    // Envoyer email notification à l'employé
    const empEmail = c.email || c.employes?.email
    if(empEmail) {
      await api.post('/emails/conge', {
        body: {
          type: 'conge',
          to: empEmail,
          prenom: c.prenom || c.employes?.prenom || '',
          type_conge: c.type,
          statut,
          date_debut: c.date_debut,
          date_fin: c.date_fin,
          jours,
          commentaire: commentaire || ''
        }
      })
    }
    setSelected(null);setCommentaire('');setAnnulerConfirm(null)
    showToast(statut==='accepte'?'Congé accepté ✅':statut==='annule'?'Congé annulé 🚫':'Congé refusé ❌')
    loadConges()
  }

  async function saveSolde(empId,type){
    const val=parseInt(soldeTmp)
    if(isNaN(val)||val<0||val>365){showToast('Valeur invalide (0-365)');return}
    await api.put(`/employes/${empId}`, {[type==='rtt'?'rtt_total':'conges_total']:val})
    setEditSolde(null);setSoldeTmp('');showToast('Solde mis à jour ✓');loadConges()
  }

  const enAttente=conges.filter(c=>c.statut==='en_attente')
  const traites=conges.filter(c=>c.statut!=='en_attente')

  // Pour la vue soldes : données enrichies par employe
  const soldesData = employes.filter(e=>e.actif!==false).map(emp=>{
    const empD=conges.find(c=>c.employe_id===emp.id)?.employes||emp
    return {
      ...emp,
      cpPris:empD.conges_pris||0, cpTotal:empD.conges_total||25,
      rttPris:empD.rtt_pris||0, rttTotal:empD.rtt_total||0,
      cpReportes:empD.conges_reportes||0,
      cpReportPlafond:empD.conges_report_plafond||0,
      cpReportExpiration:empD.conges_report_expiration||null,
    }
  })

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:15,fontWeight:800}}>🏖️ Gestion des congés</div>
        <button onClick={()=>setExportModal(true)} style={{padding:'7px 14px',borderRadius:9,border:'none',background:'#16a34a',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>📄 Export PDF</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',background:'var(--bg)',borderRadius:12,padding:3,gap:3}}>
        {[{id:'attente',l:'En attente',badge:enAttente.length},{id:'historique',l:'Historique'},{id:'soldes',l:'Soldes'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'8px 4px',borderRadius:9,border:'none',background:tab===t.id?'var(--surface)':'transparent',color:tab===t.id?'var(--text)':'var(--text2)',fontSize:12,fontWeight:tab===t.id?700:500,cursor:'pointer',position:'relative',boxShadow:tab===t.id?'0 1px 4px rgba(0,0,0,.06)':'none',transition:'all .15s'}}>
            {t.l}
            {t.badge>0&&<span style={{position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',background:'#dc2626',color:'white',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* EN ATTENTE */}
      {tab==='attente'&&(
        enAttente.length===0
          ?<div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)'}}>
            <div style={{fontSize:36,marginBottom:10}}>✅</div>
            <div style={{fontSize:13}}>Aucune demande en attente</div>
          </div>
          :enAttente.map(c=>{
            const type=TYPES[c.type]||TYPES.autre
            const emp=c
            const jours=nbJours(c.date_debut,c.date_fin)
            const cpSolde=(c.conges_total||25)-(c.conges_pris||0)
            const rttSolde=(c.rtt_total||0)-(c.rtt_pris||0)
            return (
              <div key={c.id} style={{background:'var(--surface)',border:`2px solid ${type.bc}`,borderRadius:16,padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>{(emp?.prenom?.[0]||'')+(emp?.nom?.[0]||'')}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700}}>{emp?.prenom} {emp?.nom}</div>
                    <div style={{fontSize:11,color:'var(--text2)'}}>{emp?.role}</div>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#fff7ed',color:'#ea580c',border:'1px solid #fed7aa'}}>⏳ En attente</span>
                </div>
                <div style={{background:type.bg,borderRadius:10,padding:'10px 14px',marginBottom:10,border:`1px solid ${type.bc}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                    <span style={{fontSize:16}}>{type.emoji}</span>
                    <span style={{fontSize:13,fontWeight:700,color:type.c}}>{type.l}</span>
                    <span style={{fontSize:12,fontWeight:700,marginLeft:'auto'}}>📅 {jours}j</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:500}}>{fmtLabel(c.date_debut)} → {fmtLabel(c.date_fin)}</div>
                  {c.message&&<div style={{fontSize:12,color:'var(--text2)',fontStyle:'italic',marginTop:6,padding:'5px 8px',background:'rgba(255,255,255,.6)',borderRadius:6}}>"{c.message}"</div>}
                  {c.type==='conge_paye'&&<div style={{fontSize:11,marginTop:6,fontWeight:600,color:cpSolde>=jours?'#16a34a':'#dc2626'}}>Solde CP : {cpSolde}j restants {cpSolde<jours?'⚠️ insuffisant':'✓'}</div>}
                  {c.type==='rtt'&&<div style={{fontSize:11,marginTop:6,fontWeight:600,color:rttSolde>=jours?'#7c3aed':'#dc2626'}}>Solde RTT : {rttSolde}j restants {rttSolde<jours?'⚠️ insuffisant':'✓'}</div>}
                </div>
                {selected===c.id?(
                  <div>
                    <textarea value={commentaire} onChange={e=>setCommentaire(e.target.value)} placeholder="Commentaire optionnel..." rows={2}
                      style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg)',fontSize:12,color:'var(--text)',outline:'none',resize:'none',fontFamily:'inherit',boxSizing:'border-box',marginBottom:8}}/>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                      <button onClick={()=>traiter(c.id,'accepte')} style={{padding:'10px',borderRadius:10,border:'none',background:'#16a34a',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>✅ Accepter</button>
                      <button onClick={()=>traiter(c.id,'refuse')} style={{padding:'10px',borderRadius:10,border:'none',background:'#dc2626',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>❌ Refuser</button>
                      <button onClick={()=>{setSelected(null);setCommentaire('')}} style={{padding:'10px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:12,fontWeight:700,cursor:'pointer'}}>✕</button>
                    </div>
                  </div>
                ):(
                  <button onClick={()=>setSelected(c.id)} style={{width:'100%',padding:'11px',borderRadius:11,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Traiter cette demande →</button>
                )}
              </div>
            )
          })
      )}

      {/* HISTORIQUE */}
      {tab==='historique'&&(
        traites.length===0
          ?<div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)',fontSize:13}}>Aucun congé traité</div>
          :traites.map(c=>{
            const type=TYPES[c.type]||TYPES.autre
            const emp=c.employes
            const stat=STATUTS[c.statut]||STATUTS.refuse
            const jours=nbJours(c.date_debut,c.date_fin)
            return (
              <div key={c.id} style={{background:'var(--surface)',border:`2px solid ${stat.bc}`,borderRadius:14,padding:14}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700}}>{emp?.prenom} {emp?.nom}</div>
                    <div style={{fontSize:11,color:'var(--text2)'}}>{emp?.role}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:stat.bg,color:stat.c,border:`1px solid ${stat.bc}`,flexShrink:0,whiteSpace:'nowrap'}}>{stat.e} {stat.l}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:type.bg,borderRadius:9,marginBottom:8,border:`1px solid ${type.bc}`}}>
                  <span style={{fontSize:14}}>{type.emoji}</span>
                  <span style={{fontSize:12,fontWeight:700,color:type.c}}>{type.l}</span>
                  <span style={{fontSize:11,color:'var(--text2)',marginLeft:'auto'}}>{fmtLabel(c.date_debut)} → {fmtLabel(c.date_fin)}</span>
                  <span style={{fontSize:12,fontWeight:700,background:'white',padding:'1px 7px',borderRadius:20,border:`1px solid ${type.bc}`,color:type.c}}>{jours}j</span>
                </div>
                {c.message&&<div style={{fontSize:11,color:'var(--text2)',marginBottom:5,fontStyle:'italic'}}>💬 "{c.message}"</div>}
                {c.commentaire_gerant&&<div style={{fontSize:11,color:'var(--text2)',marginBottom:5,fontStyle:'italic'}}>🏢 {c.commentaire_gerant}</div>}
                {c.statut==='accepte'&&(
                  annulerConfirm===c.id?(
                    <div style={{display:'flex',gap:6,marginTop:8,alignItems:'center',padding:'10px',background:'#fef2f2',borderRadius:9,border:'1px solid #fecaca'}}>
                      <span style={{fontSize:12,color:'#dc2626',flex:1,fontWeight:600}}>Annuler ce congé accepté ?</span>
                      <button onClick={()=>traiter(c.id,'annule')} style={{padding:'6px 14px',borderRadius:8,border:'none',background:'#dc2626',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>Confirmer</button>
                      <button onClick={()=>setAnnulerConfirm(null)} style={{padding:'6px 12px',borderRadius:8,border:'1px solid #fecaca',background:'white',color:'#dc2626',fontSize:12,cursor:'pointer'}}>Non</button>
                    </div>
                  ):(
                    <button onClick={()=>setAnnulerConfirm(c.id)} style={{width:'100%',padding:'8px',borderRadius:9,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:12,fontWeight:700,cursor:'pointer',marginTop:4}}>🚫 Annuler ce congé</button>
                  )
                )}
              </div>
            )
          })
      )}

      {/* SOLDES — vue tableau compacte */}
      {tab==='soldes'&&(
        <div>
          <div style={{fontSize:12,color:'var(--text2)',padding:'10px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)',marginBottom:10}}>
            💡 Cliquez sur le total pour le modifier. Les compteurs se mettent à jour automatiquement.
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
            {/* Header tableau */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 130px 130px 160px',background:'var(--bg)',borderBottom:'2px solid var(--border)',padding:'10px 16px',gap:8}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text2)'}}>EMPLOYÉ</div>
              <div style={{fontSize:11,fontWeight:700,color:'#E11D48',textAlign:'center'}}>🏖️ CONGÉS PAYÉS</div>
              <div style={{fontSize:11,fontWeight:700,color:'#7c3aed',textAlign:'center'}}>⏰ RTT</div>
              <div style={{fontSize:11,fontWeight:700,color:'#2563EB',textAlign:'center'}}>🔄 REPORT N-1</div>
            </div>
            {soldesData.map((emp,i)=>{
              const cpS=emp.cpTotal-emp.cpPris
              const rttS=emp.rttTotal-emp.rttPris
              const cpPct=emp.cpTotal>0?Math.min(100,Math.round(emp.cpPris/emp.cpTotal*100)):0
              const rttPct=emp.rttTotal>0?Math.min(100,Math.round(emp.rttPris/emp.rttTotal*100)):0
              return (
                <div key={emp.id} style={{display:'grid',gridTemplateColumns:'1fr 130px 130px 160px',padding:'12px 16px',gap:8,borderBottom:i<soldesData.length-1?'1px solid var(--border)':'none',alignItems:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  {/* Nom */}
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{(emp.prenom?.[0]||'')+(emp.nom?.[0]||'')}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{emp.prenom} {emp.nom}</div>
                      <div style={{fontSize:10,color:'var(--text2)'}}>{emp.role}</div>
                    </div>
                  </div>
                  {/* CP */}
                  <div style={{textAlign:'center'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginBottom:3}}>
                      <span style={{fontSize:11,color:cpS>5?'#16a34a':cpS>0?'#ea580c':'#dc2626',fontWeight:700}}>{cpS}j restants</span>
                    </div>
                    <div style={{height:4,background:'var(--bg)',borderRadius:2,overflow:'hidden',border:'1px solid var(--border)',marginBottom:3}}>
                      <div style={{height:'100%',background:cpPct>80?'#dc2626':cpPct>50?'#ea580c':'#E11D48',width:`${cpPct}%`,borderRadius:2,transition:'width .3s'}}/>
                    </div>
                    <div style={{fontSize:10,color:'var(--text2)'}}>{emp.cpPris}j pris /&nbsp;
                      {editSolde?.empId===emp.id&&editSolde?.type==='cp'?(
                        <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                          <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                            style={{width:40,padding:'1px 4px',borderRadius:5,border:'1.5px solid #E11D48',fontSize:10,textAlign:'center',outline:'none'}}/>
                          <button onClick={()=>saveSolde(emp.id,'cp')} style={{padding:'1px 6px',borderRadius:5,border:'none',background:'#E11D48',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditSolde(null)} style={{padding:'1px 5px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                        </span>
                      ):(
                        <button onClick={()=>{setEditSolde({empId:emp.id,type:'cp'});setSoldeTmp(String(emp.cpTotal))}} style={{border:'none',background:'transparent',color:'#E11D48',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>{emp.cpTotal}j ✏️</button>
                      )}
                    </div>
                  </div>
                  {/* RTT */}
                  <div style={{textAlign:'center'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginBottom:3}}>
                      <span style={{fontSize:11,color:rttS>0?'#7c3aed':'#6b7280',fontWeight:700}}>{rttS}j restants</span>
                    </div>
                    <div style={{height:4,background:'var(--bg)',borderRadius:2,overflow:'hidden',border:'1px solid var(--border)',marginBottom:3}}>
                      <div style={{height:'100%',background:rttPct>80?'#dc2626':'#7c3aed',width:`${rttPct}%`,borderRadius:2,transition:'width .3s'}}/>
                    </div>
                    <div style={{fontSize:10,color:'var(--text2)'}}>{emp.rttPris}j pris /&nbsp;
                      {editSolde?.empId===emp.id&&editSolde?.type==='rtt'?(
                        <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                          <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                            style={{width:40,padding:'1px 4px',borderRadius:5,border:'1.5px solid #7c3aed',fontSize:10,textAlign:'center',outline:'none'}}/>
                          <button onClick={()=>saveSolde(emp.id,'rtt')} style={{padding:'1px 6px',borderRadius:5,border:'none',background:'#7c3aed',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditSolde(null)} style={{padding:'1px 5px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                        </span>
                      ):(
                        <button onClick={()=>{setEditSolde({empId:emp.id,type:'rtt'});setSoldeTmp(String(emp.rttTotal))}} style={{border:'none',background:'transparent',color:'#7c3aed',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>{emp.rttTotal}j ✏️</button>
                      )}
                    </div>
                  </div>
                  {/* REPORT N-1 */}
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#2563EB',marginBottom:4}}>
                      {emp.cpReportes>0?`${emp.cpReportes}j reportés`:'Aucun report'}
                    </div>
                    {/* Plafond */}
                    <div style={{fontSize:10,color:'var(--text2)',marginBottom:4}}>
                      Plafond :&nbsp;
                      {editSolde?.empId===emp.id&&editSolde?.type==='report_plafond'?(
                        <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                          <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                            style={{width:40,padding:'1px 4px',borderRadius:5,border:'1.5px solid #2563EB',fontSize:10,textAlign:'center',outline:'none'}}/>
                          <button onClick={()=>saveSolde(emp.id,'report_plafond')} style={{padding:'1px 6px',borderRadius:5,border:'none',background:'#2563EB',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditSolde(null)} style={{padding:'1px 5px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                        </span>
                      ):(
                        <button onClick={()=>{setEditSolde({empId:emp.id,type:'report_plafond'});setSoldeTmp(String(emp.cpReportPlafond))}} style={{border:'none',background:'transparent',color:'#2563EB',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>{emp.cpReportPlafond}j ✏️</button>
                      )}
                    </div>
                    {/* Date expiration */}
                    <div style={{fontSize:10,color:'var(--text2)'}}>
                      Expire :&nbsp;
                      {editSolde?.empId===emp.id&&editSolde?.type==='report_expiration'?(
                        <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                          <input type="date" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)}
                            style={{padding:'1px 4px',borderRadius:5,border:'1.5px solid #2563EB',fontSize:10,outline:'none'}}/>
                          <button onClick={()=>saveSolde(emp.id,'report_expiration')} style={{padding:'1px 6px',borderRadius:5,border:'none',background:'#2563EB',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditSolde(null)} style={{padding:'1px 5px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                        </span>
                      ):(
                        <button onClick={()=>{setEditSolde({empId:emp.id,type:'report_expiration'});setSoldeTmp(emp.cpReportExpiration?emp.cpReportExpiration.split('T')[0]:'')}} style={{border:'none',background:'transparent',color:'#2563EB',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>
                          {emp.cpReportExpiration?new Date(emp.cpReportExpiration).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'Non définie ✏️'}
                        </button>
                      )}
                    </div>
                    {/* Bouton reset annuel manuel */}
                    <button onClick={()=>resetAnnuel(emp.id,emp.cpTotal,emp.cpPris,emp.cpReportPlafond)}
                      style={{marginTop:6,padding:'3px 8px',borderRadius:6,border:'1px solid #bfdbfe',background:'#eff6ff',color:'#2563EB',fontSize:9,fontWeight:700,cursor:'pointer'}}>
                      Reset annuel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODAL EXPORT PDF */}
      {exportModal&&(
        <div onClick={()=>setExportModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:24,width:360,boxShadow:'0 8px 40px rgba(0,0,0,.15)'}}>
            <div style={{fontSize:16,fontWeight:800,marginBottom:4}}>📄 Exporter en PDF</div>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:16}}>Choisissez les filtres pour votre rapport</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Employé</label>
              <select value={exportForm.emp} onChange={e=>setExportForm(f=>({...f,emp:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}>
                <option value="">Tous les employés</option>
                {employes.filter(e=>e.actif!==false).map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Du</label>
                <input type='date' value={exportForm.debut} onChange={e=>setExportForm(f=>({...f,debut:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Au</label>
                <input type='date' value={exportForm.fin} onChange={e=>setExportForm(f=>({...f,fin:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:14}}>
              {[
                {l:'Ce mois',d:new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0],f:new Date(new Date().getFullYear(),new Date().getMonth()+1,0).toISOString().split('T')[0]},
                {l:'Mois dernier',d:new Date(new Date().getFullYear(),new Date().getMonth()-1,1).toISOString().split('T')[0],f:new Date(new Date().getFullYear(),new Date().getMonth(),0).toISOString().split('T')[0]},
                {l:'Année',d:`${new Date().getFullYear()}-01-01`,f:`${new Date().getFullYear()}-12-31`},
              ].map(p=>(
                <button key={p.l} onClick={()=>setExportForm(f=>({...f,debut:p.d,fin:p.f}))} style={{flex:1,padding:'6px 4px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',fontSize:11,fontWeight:600,cursor:'pointer',color:'var(--text2)'}}>{p.l}</button>
              ))}
            </div>
            <div style={{padding:'10px',background:'var(--accent-bg)',borderRadius:10,marginBottom:14,fontSize:12,color:'var(--accent)'}}>
              📋 Rapport PDF avec tableau par employé, statuts colorés et totaux
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setExportModal(false)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={()=>{doExportPDF(conges,restaurant,employes,exportForm.emp||null,exportForm.debut||null,exportForm.fin||null);setExportModal(false)}} style={{flex:1,height:42,borderRadius:10,border:'none',background:'#16a34a',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>📄 Générer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
