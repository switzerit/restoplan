import { useState, useEffect } from 'react'
import socket from '../socketClient'
import { api } from '../apiClient'

const TYPES = {
  conge_paye:      {l:'Congé payé',       emoji:'🏖️',c:'#E11D48',bg:'#fff1f3',bc:'#fecdd3'},
  conges_reportes: {l:'Reportés N-1',     emoji:'🔄',c:'#2563EB',bg:'#eff6ff',bc:'#bfdbfe'},
  maladie:         {l:'Arrêt maladie',    emoji:'🏥',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  rtt:             {l:'RTT',              emoji:'⏰',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
  sans_solde:      {l:'Sans solde',       emoji:'📋',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  autre:           {l:'Autre',            emoji:'📝',c:'#6b7280',bg:'#f5f5f5',bc:'#e0e0e0'},
}
const STATUTS = {
  en_attente:{l:'En attente',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  accepte:   {l:'Accepté',   c:'#16a34a',bg:'#f0fdf4',bc:'#bbf7d0'},
  refuse:    {l:'Refusé',    c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  annule:    {l:'Annulé',    c:'#6b7280',bg:'#f3f4f6',bc:'#e5e7eb'},
}

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}
function fmtD(s){if(!s)return'—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];return new Date(str+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
function fmtDLong(s){if(!s)return'—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];return new Date(str+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
function fmtDShort(s){if(!s)return'—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];return new Date(str+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
function nbJ(d1,d2){return Math.max(1,Math.round((new Date(d2)-new Date(d1))/(1000*60*60*24))+1)}

function doExportPDF(conges,restaurant,employes,filtreEmp,dateDebut,dateFin){
  let filtered=conges
  if(filtreEmp) filtered=filtered.filter(c=>c.employe_id===filtreEmp)
  if(dateDebut) filtered=filtered.filter(c=>c.date_debut>=dateDebut)
  if(dateFin) filtered=filtered.filter(c=>c.date_fin<=dateFin)
  const byEmp={}
  filtered.forEach(c=>{if(!byEmp[c.employe_id])byEmp[c.employe_id]=[];byEmp[c.employe_id].push(c)})
  const periodLabel=dateDebut&&dateFin?`${fmtDShort(dateDebut)} → ${fmtDShort(dateFin)}`:'Toute la période'
  const empLabel=filtreEmp?(employes.find(e=>e.id===filtreEmp)||{prenom:'',nom:''}):null
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Congés — ${restaurant.nom}</title>
<style>body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:13px}
h1{font-size:20px;margin:0 0 4px}.meta{color:#666;font-size:12px;margin-bottom:6px}
.period{display:inline-block;background:#fff1f3;color:#E11D48;border:1px solid #fecdd3;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:20px}
.cards{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.card{background:#f5f5f5;padding:10px 16px;border-radius:8px;text-align:center;min-width:90px}
.card-n{font-size:24px;font-weight:800}.card-l{font-size:10px;color:#666;margin-top:2px}
h2{font-size:13px;background:#fff1f3;padding:7px 12px;border-radius:6px;margin:16px 0 7px;color:#E11D48}
table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px}
th{background:#f5f5f5;padding:6px 10px;text-align:left;border:1px solid #ddd;font-size:11px}
td{padding:6px 10px;border:1px solid #ddd}
.badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;display:inline-block}
.accepte{background:#f0fdf4;color:#16a34a}.refuse{background:#fef2f2;color:#dc2626}
.annule{background:#f3f4f6;color:#6b7280}.en_attente{background:#fff7ed;color:#ea580c}
</style></head><body>
<h1>📋 Rapport des congés — ${restaurant.nom}</h1>
<div class="meta">Généré le ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
${empLabel?`<div class="meta">Employé : <strong>${empLabel.prenom} ${empLabel.nom}</strong></div>`:''}
<div class="period">📅 ${periodLabel}</div>
<div class="cards">
  <div class="card"><div class="card-n">${filtered.length}</div><div class="card-l">Demandes</div></div>
  <div class="card"><div class="card-n">${filtered.filter(c=>c.statut==='accepte').length}</div><div class="card-l">Acceptées</div></div>
  <div class="card"><div class="card-n">${filtered.filter(c=>c.statut==='en_attente').length}</div><div class="card-l">En attente</div></div>
  <div class="card"><div class="card-n">${filtered.filter(c=>c.statut==='accepte').reduce((a,c)=>a+nbJ(c.date_debut,c.date_fin),0)}</div><div class="card-l">Jours accordés</div></div>
</div>
${Object.entries(byEmp).map(([,cs])=>{
  const total=cs.filter(c=>c.statut==='accepte').reduce((a,c)=>a+nbJ(c.date_debut,c.date_fin),0)
  return `<h2>👤 ${cs[0]?.prenom||''} ${cs[0]?.nom||''} — ${total}j acceptés</h2>
<table><tr><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Statut</th><th>Message</th></tr>
${cs.map(c=>`<tr>
  <td>${TYPES[c.type]?.emoji} ${TYPES[c.type]?.l||c.type}</td>
  <td>${fmtDShort(c.date_debut)}</td><td>${fmtDShort(c.date_fin)}</td>
  <td style="text-align:center;font-weight:700">${nbJ(c.date_debut,c.date_fin)}</td>
  <td><span class="badge ${c.statut}">${STATUTS[c.statut]?.l||c.statut}</span></td>
  <td style="color:#666;font-style:italic">${c.message||'—'}</td>
</tr>`).join('')}</table>`}).join('')}
</body></html>`
  const w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(()=>w.print(),300)
}

export default function CongesGerant({restaurant,employes,showToast,onReloadEmployes}){
  const [conges,setConges]=useState([])
  const [soldesMap,setSoldesMap]=useState({})
  const [view,setView]=useState('demandes') // demandes | soldes
  const [filtre,setFiltre]=useState('en_attente') // en_attente | tous | accepte | refuse
  const [selected,setSelected]=useState(null)
  const [commentaire,setCommentaire]=useState('')
  const [editSolde,setEditSolde]=useState(null)
  const [soldeTmp,setSoldeTmp]=useState('')
  const [annulerConfirm,setAnnulerConfirm]=useState(null)
  const [exportModal,setExportModal]=useState(false)
  const [exportForm,setExportForm]=useState({emp:'',debut:'',fin:''})
  const [isMobile,setIsMobile]=useState(window.innerWidth<768)

  useEffect(()=>{
    const handler=()=>setIsMobile(window.innerWidth<768)
    window.addEventListener('resize',handler)
    return ()=>window.removeEventListener('resize',handler)
  },[])

  useEffect(()=>{
    if(!restaurant) return
    loadAll()
    socket.connect()
    socket.on('conge',loadConges)
    return ()=>{socket.off('conge');socket.disconnect()}
  },[restaurant?.id])

  async function loadAll(){
    await Promise.all([loadConges(),loadSoldes()])
  }

  async function loadConges(){
    const data=await api.get(`/conges?restaurant_id=${restaurant.id}`)
    setConges(data||[])
  }

  async function loadSoldes(){
    const data=await api.get(`/employes/${restaurant.id}`)
    if(data){const m={};data.forEach(e=>{m[e.id]=e});setSoldesMap(m)}
  }

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
    setSelected(null);setCommentaire('');setAnnulerConfirm(null)
    showToast(statut==='accepte'?'Congé accepté ✅':statut==='annule'?'Congé annulé':'Congé refusé')
    await loadAll()
    if(onReloadEmployes) onReloadEmployes()
  }

  async function saveSolde(empId,type){
    let body={}
    if(type==='report_expiration'){
      if(!soldeTmp){showToast('Date invalide');return}
      body={conges_report_expiration:soldeTmp}
    } else if(type==='report_plafond'){
      const val=parseInt(soldeTmp);if(isNaN(val)||val<0){showToast('Valeur invalide');return}
      body={conges_report_plafond:val}
    } else {
      const val=parseInt(soldeTmp);if(isNaN(val)||val<0||val>365){showToast('Valeur invalide (0-365)');return}
      body={[type==='rtt'?'rtt_total':'conges_total']:val}
    }
    await api.put(`/employes/${empId}`,body)
    setEditSolde(null);setSoldeTmp('')
    showToast('Solde mis à jour ✓')
    await loadAll()
    if(onReloadEmployes) onReloadEmployes()
  }

  async function resetAnnuel(empId,cpTotal,cpPris,plafond){
    const nonPris=Math.max(0,(cpTotal||25)-(cpPris||0))
    const reportes=(plafond||0)>0?Math.min(nonPris,plafond):0
    await api.put(`/employes/${empId}`,{conges_pris:0,conges_reportes:reportes})
    showToast(`Reset effectué — ${reportes}j reportés ✓`)
    await loadAll()
    if(onReloadEmployes) onReloadEmployes()
  }

  const enAttente=conges.filter(c=>c.statut==='en_attente')
  const filteredConges=conges.filter(c=>{
    if(filtre==='en_attente') return c.statut==='en_attente'
    if(filtre==='accepte') return c.statut==='accepte'
    if(filtre==='refuse') return c.statut==='refuse'||c.statut==='annule'
    return true
  })

  const soldesData=employes.filter(e=>e.actif!==false).map(emp=>{
    const s=soldesMap[emp.id]||emp
    return{...emp,
      cpPris:s.conges_pris||0,cpTotal:s.conges_total||25,
      rttPris:s.rtt_pris||0,rttTotal:s.rtt_total||0,
      cpReportes:s.conges_reportes||0,
      cpReportPlafond:s.conges_report_plafond||0,
      cpReportExpiration:s.conges_report_expiration||null,
    }
  })

  // Styles réutilisables
  const inp={width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box'}

  // Carte demande (liste)
  function CarteConge({c,onClick,actif}){
    const type=TYPES[c.type]||TYPES.autre
    const stat=STATUTS[c.statut]||STATUTS.en_attente
    const jours=nbJ(c.date_debut,c.date_fin)
    return(
      <div onClick={onClick} style={{
        padding:'14px 16px',cursor:'pointer',
        background:actif?'#fff1f3':'var(--surface)',
        borderLeft:actif?`3px solid #E11D48`:'3px solid transparent',
        borderBottom:'1px solid var(--border)',
        transition:'all .12s'
      }}
      onMouseEnter={e=>{if(!actif)e.currentTarget.style.background='var(--bg)'}}
      onMouseLeave={e=>{if(!actif)e.currentTarget.style.background='var(--surface)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>
            {ini(c.prenom,c.nom)}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{c.prenom} {c.nom}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20,
                background:type.bg,color:type.c,border:`1px solid ${type.bc}`}}>
                {type.emoji} {type.l}
              </span>
              <span style={{fontSize:10,color:'var(--text3)'}}>
                {fmtD(c.date_debut)} → {fmtD(c.date_fin)} · {jours}j
              </span>
            </div>
          </div>
          <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,
            background:stat.bg,color:stat.c,border:`1px solid ${stat.bc}`,flexShrink:0}}>
            {stat.l}
          </span>
        </div>
        {c.message&&<div style={{marginTop:8,fontSize:11,color:'var(--text2)',fontStyle:'italic',
          background:'var(--bg)',borderRadius:7,padding:'5px 9px'}}>"{c.message}"</div>}
      </div>
    )
  }

  // Panel détail
  function DetailPanel({c}){
    if(!c) return(
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        height:'100%',gap:12,color:'var(--text3)',padding:40}}>
        <div style={{fontSize:48}}>🏖️</div>
        <div style={{fontSize:15,fontWeight:600}}>Sélectionnez une demande</div>
        <div style={{fontSize:13}}>Cliquez sur une demande pour voir les détails et agir</div>
      </div>
    )
    const type=TYPES[c.type]||TYPES.autre
    const stat=STATUTS[c.statut]||STATUTS.en_attente
    const jours=nbJ(c.date_debut,c.date_fin)
    const solde=soldesMap[c.employe_id]
    const cpSolde=(solde?.conges_total||25)-(solde?.conges_pris||0)
    const rttSolde=(solde?.rtt_total||0)-(solde?.rtt_pris||0)
    const repSolde=solde?.conges_reportes||0
    return(
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflowY:'auto'}}>
        {/* Header employé */}
        <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',
          background:`linear-gradient(135deg, ${type.bg} 0%, var(--surface) 60%)`}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:'50%',background:'white',color:'#E11D48',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,
              border:'2px solid #fecdd3',boxShadow:'0 2px 8px rgba(225,29,72,.15)'}}>
              {ini(c.prenom,c.nom)}
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>{c.prenom} {c.nom}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{c.role}</div>
            </div>
            <div style={{marginLeft:'auto'}}>
              <span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20,
                background:stat.bg,color:stat.c,border:`1.5px solid ${stat.bc}`}}>
                {stat.l}
              </span>
            </div>
          </div>
          {/* Type + dates */}
          <div style={{background:'white',borderRadius:12,padding:'14px 16px',border:`1.5px solid ${type.bc}`}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{fontSize:20}}>{type.emoji}</span>
              <span style={{fontSize:14,fontWeight:800,color:type.c}}>{type.l}</span>
              <span style={{marginLeft:'auto',fontSize:13,fontWeight:800,color:'var(--text)'}}>{jours} jour{jours>1?'s':''}</span>
            </div>
            <div style={{display:'flex',gap:16}}>
              <div>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>DU</div>
                <div style={{fontSize:13,fontWeight:700}}>{fmtDLong(c.date_debut)}</div>
              </div>
              <div style={{color:'var(--text3)',alignSelf:'center'}}>→</div>
              <div>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>AU</div>
                <div style={{fontSize:13,fontWeight:700}}>{fmtDLong(c.date_fin)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div style={{padding:'16px 24px',flex:1,display:'flex',flexDirection:'column',gap:14}}>
          {/* Soldes employé */}
          <div style={{background:'var(--bg)',borderRadius:12,padding:'12px 16px',border:'1px solid var(--border)'}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:10}}>SOLDES ACTUELS</div>
            <div style={{display:'flex',gap:12}}>
              {[
                {l:'CP',v:cpSolde,total:solde?.conges_total||25,c:'#E11D48',bg:'#fff1f3'},
                ...(rttSolde>0||solde?.rtt_total>0?[{l:'RTT',v:rttSolde,total:solde?.rtt_total||0,c:'#7c3aed',bg:'#faf5ff'}]:[]),
                ...(repSolde>0?[{l:'Reportés',v:repSolde,total:repSolde,c:'#2563EB',bg:'#eff6ff'}]:[]),
              ].map((s,i)=>(
                <div key={i} style={{flex:1,textAlign:'center',padding:'10px 8px',background:s.bg,borderRadius:10}}>
                  <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:9,color:s.c,fontWeight:700,marginTop:2}}>{s.l}</div>
                  <div style={{fontSize:9,color:'var(--text3)',marginTop:1}}>/ {s.total}</div>
                </div>
              ))}
            </div>
            {/* Warning solde insuffisant */}
            {c.type==='conge_paye'&&jours>cpSolde&&(
              <div style={{marginTop:10,padding:'7px 10px',background:'#fef2f2',borderRadius:8,
                fontSize:11,color:'#dc2626',fontWeight:600,border:'1px solid #fecaca'}}>
                ⚠️ Solde insuffisant — {jours}j demandés pour {cpSolde}j restants
              </div>
            )}
          </div>

          {/* Message employé */}
          {c.message&&(
            <div style={{background:'var(--bg)',borderRadius:12,padding:'12px 16px',border:'1px solid var(--border)'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',marginBottom:6}}>MESSAGE DE L'EMPLOYÉ</div>
              <div style={{fontSize:13,fontStyle:'italic',color:'var(--text)'}}>"{c.message}"</div>
            </div>
          )}

          {/* Commentaire gérant existant */}
          {c.commentaire_gerant&&c.statut!=='en_attente'&&(
            <div style={{background:'#fff1f3',borderRadius:12,padding:'12px 16px',border:'1px solid #fecdd3'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#E11D48',marginBottom:6}}>VOTRE RÉPONSE</div>
              <div style={{fontSize:13,color:'#E11D48'}}>{c.commentaire_gerant}</div>
            </div>
          )}

          {/* Actions */}
          {c.statut==='en_attente'?(
            <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:10}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'var(--text2)',marginBottom:6}}>RÉPONSE À L'EMPLOYÉ (optionnel)</div>
                <textarea value={commentaire} onChange={e=>setCommentaire(e.target.value)}
                  placeholder="Ex : Congé approuvé, bon repos !"
                  style={{...inp,resize:'none',height:72,fontFamily:'var(--font)'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:8}}>
                <button onClick={()=>traiter(c.id,'refuse')}
                  style={{height:46,borderRadius:11,border:'1.5px solid #fecaca',
                    background:'#fef2f2',color:'#dc2626',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  Refuser
                </button>
                <button onClick={()=>traiter(c.id,'accepte')}
                  style={{height:46,borderRadius:11,border:'none',
                    background:'#16a34a',color:'white',fontSize:14,fontWeight:800,cursor:'pointer'}}>
                  ✅ Accepter le congé
                </button>
              </div>
            </div>
          ):c.statut==='accepte'?(
            <div style={{marginTop:'auto'}}>
              {annulerConfirm===c.id?(
                <div style={{padding:'14px',background:'#fef2f2',borderRadius:12,border:'1px solid #fecaca'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#dc2626',marginBottom:10}}>
                    Annuler ce congé accepté ? Les jours seront recrédités.
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setAnnulerConfirm(null)}
                      style={{flex:1,height:40,borderRadius:9,border:'1px solid #fecaca',background:'white',color:'#dc2626',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      Non
                    </button>
                    <button onClick={()=>traiter(c.id,'annule')}
                      style={{flex:2,height:40,borderRadius:9,border:'none',background:'#dc2626',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                      Confirmer l'annulation
                    </button>
                  </div>
                </div>
              ):(
                <button onClick={()=>setAnnulerConfirm(c.id)}
                  style={{width:'100%',height:42,borderRadius:11,border:'1.5px solid #fecaca',
                    background:'#fef2f2',color:'#dc2626',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  🚫 Annuler ce congé
                </button>
              )}
            </div>
          ):(
            <button onClick={()=>traiter(c.id,'en_attente')}
              style={{marginTop:'auto',width:'100%',height:42,borderRadius:11,
                border:'1.5px solid #fed7aa',background:'#fff7ed',color:'#ea580c',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              ↩️ Rouvrir la demande
            </button>
          )}
        </div>
      </div>
    )
  }

  return(
    <div style={{display:'flex',flexDirection:'column',gap:0,height:'100%'}}>

      {/* Barre supérieure */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        {/* Toggle vue */}
        <div style={{display:'flex',background:'var(--bg)',borderRadius:10,padding:3,gap:2}}>
          {[{id:'demandes',l:'Demandes'},{id:'soldes',l:'Soldes équipe'}].map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)}
              style={{padding:'7px 14px',borderRadius:8,border:'none',
                background:view===v.id?'var(--surface)':'transparent',
                color:view===v.id?'var(--text)':'var(--text2)',
                fontSize:12,fontWeight:view===v.id?700:500,cursor:'pointer',
                boxShadow:view===v.id?'0 1px 4px rgba(0,0,0,.06)':'none',
                transition:'all .15s',position:'relative'}}>
              {v.l}
              {v.id==='demandes'&&enAttente.length>0&&(
                <span style={{position:'absolute',top:2,right:2,width:14,height:14,borderRadius:'50%',
                  background:'#dc2626',color:'white',fontSize:8,fontWeight:700,
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {enAttente.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {view==='demandes'&&(
          <div style={{display:'flex',gap:6,flex:1,overflowX:'auto'}}>
            {[
              {id:'en_attente',l:`En attente${enAttente.length>0?` (${enAttente.length})`:''}`,urgent:enAttente.length>0},
              {id:'accepte',l:'Acceptées'},
              {id:'refuse',l:'Refusées'},
              {id:'tous',l:'Toutes'},
            ].map(f=>(
              <button key={f.id} onClick={()=>setFiltre(f.id)}
                style={{flexShrink:0,padding:'6px 12px',borderRadius:20,
                  border:`1.5px solid ${filtre===f.id?'#E11D48':'var(--border)'}`,
                  background:filtre===f.id?'#E11D48':'var(--surface)',
                  color:filtre===f.id?'white':f.urgent?'#ea580c':'var(--text2)',
                  fontSize:11,fontWeight:filtre===f.id?700:500,cursor:'pointer',
                  transition:'all .15s'}}>
                {f.l}
              </button>
            ))}
          </div>
        )}

        <button onClick={()=>setExportModal(true)}
          style={{marginLeft:'auto',padding:'7px 14px',borderRadius:9,border:'none',
            background:'#16a34a',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>
          📄 PDF
        </button>
      </div>

      {/* VUE DEMANDES — split layout */}
      {view==='demandes'&&(
        isMobile?(
          // Mobile : liste pleine + bottom sheet détail
          <div>
            <div style={{background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden'}}>
              {filteredConges.length===0?(
                <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text3)'}}>
                  <div style={{fontSize:40,marginBottom:10}}>✅</div>
                  <div style={{fontSize:14,fontWeight:600}}>
                    {filtre==='en_attente'?'Aucune demande en attente':'Aucune demande'}
                  </div>
                </div>
              ):filteredConges.map(c=>(
                <CarteConge key={c.id} c={c} onClick={()=>setSelected(s=>s?.id===c.id?null:c)} actif={selected?.id===c.id}/>
              ))}
            </div>
            {/* Bottom sheet mobile */}
            {selected&&(
              <>
                <div onClick={()=>setSelected(null)}
                  style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',backdropFilter:'blur(6px)',zIndex:300}}/>
                <div style={{position:'fixed',bottom:0,left:0,right:0,
                  background:'var(--surface)',borderRadius:'20px 20px 0 0',
                  maxHeight:'85vh',overflowY:'auto',zIndex:301,
                  boxShadow:'0 -4px 40px rgba(0,0,0,.2)'}}>
                  <div style={{display:'flex',justifyContent:'center',padding:'10px 0 4px'}}>
                    <div style={{width:36,height:4,borderRadius:2,background:'var(--border)'}}/>
                  </div>
                  <DetailPanel c={selected}/>
                </div>
              </>
            )}
          </div>
        ):(
          // Desktop : split view
          <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:0,
            background:'var(--surface)',borderRadius:16,border:'1px solid var(--border)',
            overflow:'hidden',minHeight:500}}>
            {/* Liste gauche */}
            <div style={{borderRight:'1px solid var(--border)',overflowY:'auto',maxHeight:680}}>
              {filteredConges.length===0?(
                <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text3)'}}>
                  <div style={{fontSize:40,marginBottom:10}}>✅</div>
                  <div style={{fontSize:14,fontWeight:600}}>
                    {filtre==='en_attente'?'Aucune demande en attente':'Aucune demande'}
                  </div>
                  <div style={{fontSize:12,marginTop:4}}>Les demandes apparaîtront ici</div>
                </div>
              ):filteredConges.map(c=>(
                <CarteConge key={c.id} c={c} onClick={()=>{setSelected(c);setCommentaire(c.commentaire_gerant||'');setAnnulerConfirm(null)}} actif={selected?.id===c.id}/>
              ))}
            </div>
            {/* Détail droite */}
            <div style={{overflowY:'auto',maxHeight:680}}>
              <DetailPanel c={selected}/>
            </div>
          </div>
        )
      )}

      {/* VUE SOLDES */}
      {view==='soldes'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{fontSize:12,color:'var(--text2)',padding:'10px 14px',
            background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)'}}>
            💡 Cliquez sur un solde pour le modifier. Les changements sont immédiats.
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
            {/* Header */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 120px 100px 180px',
              background:'var(--bg)',borderBottom:'2px solid var(--border)',padding:'10px 16px',gap:8}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text2)'}}>EMPLOYÉ</div>
              <div style={{fontSize:11,fontWeight:700,color:'#E11D48',textAlign:'center'}}>🏖️ CP</div>
              <div style={{fontSize:11,fontWeight:700,color:'#7c3aed',textAlign:'center'}}>⏰ RTT</div>
              <div style={{fontSize:11,fontWeight:700,color:'#2563EB',textAlign:'center'}}>🔄 REPORT N-1</div>
            </div>
            {soldesData.map((emp,i)=>{
              const cpS=emp.cpTotal-emp.cpPris
              const rttS=emp.rttTotal-emp.rttPris
              const cpPct=emp.cpTotal>0?Math.min(100,Math.round(emp.cpPris/emp.cpTotal*100)):0
              const rttPct=emp.rttTotal>0?Math.min(100,Math.round(emp.rttPris/emp.rttTotal*100)):0
              return(
                <div key={emp.id} style={{display:'grid',gridTemplateColumns:'1fr 120px 100px 180px',
                  padding:'14px 16px',gap:8,
                  borderBottom:i<soldesData.length-1?'1px solid var(--border)':'none',alignItems:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  {/* Nom */}
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:'#fff1f3',color:'#E11D48',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>
                      {ini(emp.prenom,emp.nom)}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{emp.prenom} {emp.nom}</div>
                      <div style={{fontSize:10,color:'var(--text2)'}}>{emp.role}</div>
                    </div>
                  </div>
                  {/* CP */}
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:800,color:cpS>5?'#16a34a':cpS>0?'#ea580c':'#dc2626',marginBottom:3}}>{cpS}j</div>
                    <div style={{height:3,background:'var(--bg)',borderRadius:2,overflow:'hidden',border:'1px solid var(--border)',marginBottom:4}}>
                      <div style={{height:'100%',background:cpPct>80?'#dc2626':cpPct>50?'#ea580c':'#E11D48',width:`${cpPct}%`,borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:10,color:'var(--text2)'}}>
                      {emp.cpPris}j pris /&nbsp;
                      {editSolde?.empId===emp.id&&editSolde?.type==='cp'?(
                        <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                          <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                            style={{width:38,padding:'1px 4px',borderRadius:5,border:'1.5px solid #E11D48',fontSize:10,textAlign:'center',outline:'none'}}/>
                          <button onClick={()=>saveSolde(emp.id,'cp')} style={{padding:'1px 5px',borderRadius:5,border:'none',background:'#E11D48',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditSolde(null)} style={{padding:'1px 4px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                        </span>
                      ):(
                        <button onClick={()=>{setEditSolde({empId:emp.id,type:'cp'});setSoldeTmp(String(emp.cpTotal))}}
                          style={{border:'none',background:'transparent',color:'#E11D48',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>
                          {emp.cpTotal}j ✏️
                        </button>
                      )}
                    </div>
                  </div>
                  {/* RTT */}
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:800,color:rttS>0?'#7c3aed':'#6b7280',marginBottom:3}}>{rttS}j</div>
                    <div style={{height:3,background:'var(--bg)',borderRadius:2,overflow:'hidden',border:'1px solid var(--border)',marginBottom:4}}>
                      <div style={{height:'100%',background:rttPct>80?'#dc2626':'#7c3aed',width:`${rttPct}%`,borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:10,color:'var(--text2)'}}>
                      {emp.rttPris}j pris /&nbsp;
                      {editSolde?.empId===emp.id&&editSolde?.type==='rtt'?(
                        <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                          <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                            style={{width:38,padding:'1px 4px',borderRadius:5,border:'1.5px solid #7c3aed',fontSize:10,textAlign:'center',outline:'none'}}/>
                          <button onClick={()=>saveSolde(emp.id,'rtt')} style={{padding:'1px 5px',borderRadius:5,border:'none',background:'#7c3aed',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditSolde(null)} style={{padding:'1px 4px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                        </span>
                      ):(
                        <button onClick={()=>{setEditSolde({empId:emp.id,type:'rtt'});setSoldeTmp(String(emp.rttTotal))}}
                          style={{border:'none',background:'transparent',color:'#7c3aed',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>
                          {emp.rttTotal}j ✏️
                        </button>
                      )}
                    </div>
                  </div>
                  {/* REPORT */}
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:800,color:'#2563EB',marginBottom:2}}>
                      {emp.cpReportes>0?`${emp.cpReportes}j`:'—'}
                    </div>
                    <div style={{fontSize:10,color:'var(--text2)',marginBottom:3}}>
                      Plafond :&nbsp;
                      {editSolde?.empId===emp.id&&editSolde?.type==='report_plafond'?(
                        <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                          <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                            style={{width:38,padding:'1px 4px',borderRadius:5,border:'1.5px solid #2563EB',fontSize:10,textAlign:'center',outline:'none'}}/>
                          <button onClick={()=>saveSolde(emp.id,'report_plafond')} style={{padding:'1px 5px',borderRadius:5,border:'none',background:'#2563EB',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditSolde(null)} style={{padding:'1px 4px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                        </span>
                      ):(
                        <button onClick={()=>{setEditSolde({empId:emp.id,type:'report_plafond'});setSoldeTmp(String(emp.cpReportPlafond))}}
                          style={{border:'none',background:'transparent',color:'#2563EB',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>
                          {emp.cpReportPlafond}j ✏️
                        </button>
                      )}
                    </div>
                    <div style={{fontSize:10,color:'var(--text2)',marginBottom:4}}>
                      Expire :&nbsp;
                      {editSolde?.empId===emp.id&&editSolde?.type==='report_expiration'?(
                        <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
                          <input type="date" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)}
                            style={{padding:'1px 4px',borderRadius:5,border:'1.5px solid #2563EB',fontSize:10,outline:'none'}}/>
                          <button onClick={()=>saveSolde(emp.id,'report_expiration')} style={{padding:'1px 5px',borderRadius:5,border:'none',background:'#2563EB',color:'white',fontSize:10,fontWeight:700,cursor:'pointer'}}>✓</button>
                          <button onClick={()=>setEditSolde(null)} style={{padding:'1px 4px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg)',fontSize:10,cursor:'pointer'}}>✕</button>
                        </span>
                      ):(
                        <button onClick={()=>{setEditSolde({empId:emp.id,type:'report_expiration'});setSoldeTmp(emp.cpReportExpiration?emp.cpReportExpiration.split('T')[0]:'')}}
                          style={{border:'none',background:'transparent',color:'#2563EB',fontWeight:700,fontSize:10,cursor:'pointer',textDecoration:'underline'}}>
                          {emp.cpReportExpiration?new Date(emp.cpReportExpiration+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'Non définie ✏️'}
                        </button>
                      )}
                    </div>
                    <button onClick={()=>resetAnnuel(emp.id,emp.cpTotal,emp.cpPris,emp.cpReportPlafond)}
                      style={{padding:'3px 8px',borderRadius:6,border:'1px solid #bfdbfe',
                        background:'#eff6ff',color:'#2563EB',fontSize:9,fontWeight:700,cursor:'pointer'}}>
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
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:16}}>Filtrez votre rapport de congés</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Employé</label>
              <select value={exportForm.emp} onChange={e=>setExportForm(f=>({...f,emp:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}>
                <option value="">Tous les employés</option>
                {employes.filter(e=>e.actif!==false).map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Du</label>
                <input type='date' value={exportForm.debut} onChange={e=>setExportForm(f=>({...f,debut:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Au</label>
                <input type='date' value={exportForm.fin} onChange={e=>setExportForm(f=>({...f,fin:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:14}}>
              {[
                {l:'Ce mois',d:new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0],f:new Date(new Date().getFullYear(),new Date().getMonth()+1,0).toISOString().split('T')[0]},
                {l:'Mois dernier',d:new Date(new Date().getFullYear(),new Date().getMonth()-1,1).toISOString().split('T')[0],f:new Date(new Date().getFullYear(),new Date().getMonth(),0).toISOString().split('T')[0]},
                {l:'Année',d:`${new Date().getFullYear()}-01-01`,f:`${new Date().getFullYear()}-12-31`},
              ].map(p=>(
                <button key={p.l} onClick={()=>setExportForm(f=>({...f,debut:p.d,fin:p.f}))}
                  style={{flex:1,padding:'6px 4px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',fontSize:11,fontWeight:600,cursor:'pointer',color:'var(--text2)'}}>
                  {p.l}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setExportModal(false)}
                style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                Annuler
              </button>
              <button onClick={()=>{doExportPDF(conges,restaurant,employes,exportForm.emp||null,exportForm.debut||null,exportForm.fin||null);setExportModal(false)}}
                style={{flex:1,height:42,borderRadius:10,border:'none',background:'#16a34a',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                📄 Générer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
