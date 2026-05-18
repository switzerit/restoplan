import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = {
  conge_paye:{l:'Congé payé',emoji:'🏖️',c:'#0066cc',bg:'#f0f7ff',bc:'#d0e8ff'},
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

function fmtLabel(s){const d=new Date(s+'T00:00:00');return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}
function fmtShort(s){const d=new Date(s+'T00:00:00');return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
function nbJours(d1,d2){return Math.max(1,Math.round((new Date(d2)-new Date(d1))/(1000*60*60*24))+1)}

function exportPDF(conges, restaurant, employes){
  const byEmp={}
  conges.forEach(c=>{if(!byEmp[c.employe_id])byEmp[c.employe_id]=[];byEmp[c.employe_id].push(c)})
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Congés — ${restaurant.nom}</title>
<style>body{font-family:Arial,sans-serif;padding:30px;color:#111}h1{font-size:20px;margin-bottom:4px}.sub{color:#666;font-size:13px;margin-bottom:24px}
.cards{display:flex;gap:14px;margin-bottom:24px}.card{background:#f5f5f5;padding:12px 18px;border-radius:8px;text-align:center}.card-n{font-size:26px;font-weight:800}.card-l{font-size:11px;color:#666}
h2{font-size:14px;background:#f0f7ff;padding:8px 12px;border-radius:6px;margin:16px 0 8px;color:#0051a8}
table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f5f5f5;padding:7px 10px;text-align:left;font-size:12px;border:1px solid #ddd}td{padding:7px 10px;font-size:12px;border:1px solid #ddd}
.badge{padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;display:inline-block}
.accepte{background:#f0fdf4;color:#16a34a}.refuse{background:#fef2f2;color:#dc2626}.annule{background:#f3f4f6;color:#6b7280}.en_attente{background:#fff7ed;color:#ea580c}
</style></head><body>
<h1>📋 Rapport congés — ${restaurant.nom}</h1>
<div class="sub">Généré le ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
<div class="cards">
  <div class="card"><div class="card-n">${conges.length}</div><div class="card-l">Total</div></div>
  <div class="card"><div class="card-n">${conges.filter(c=>c.statut==='accepte').length}</div><div class="card-l">Acceptés</div></div>
  <div class="card"><div class="card-n">${conges.filter(c=>c.statut==='en_attente').length}</div><div class="card-l">En attente</div></div>
  <div class="card"><div class="card-n">${conges.filter(c=>c.statut==='refuse'||c.statut==='annule').length}</div><div class="card-l">Refusés / Annulés</div></div>
  <div class="card"><div class="card-n">${conges.filter(c=>c.statut==='accepte').reduce((a,c)=>a+nbJours(c.date_debut,c.date_fin),0)}</div><div class="card-l">Jours accordés</div></div>
</div>
${Object.entries(byEmp).map(([,cs])=>{
  const emp=cs[0]?.employes||{}
  const total=cs.filter(c=>c.statut==='accepte').reduce((a,c)=>a+nbJours(c.date_debut,c.date_fin),0)
  return `<h2>👤 ${emp.prenom||''} ${emp.nom||''} <span style="font-weight:400;color:#666">${emp.role||''}</span> — ${total}j acceptés</h2>
<table><tr><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Statut</th><th>Commentaire gérant</th></tr>
${cs.map(c=>`<tr><td>${TYPES[c.type]?.emoji||'📝'} ${TYPES[c.type]?.l||c.type}</td><td>${fmtShort(c.date_debut)}</td><td>${fmtShort(c.date_fin)}</td><td style="font-weight:700">${nbJours(c.date_debut,c.date_fin)}j</td><td><span class="badge ${c.statut}">${STATUTS[c.statut]?.e||''} ${STATUTS[c.statut]?.l||c.statut}</span></td><td style="color:#666;font-style:italic">${c.commentaire_gerant||'—'}</td></tr>`).join('')}
</table>`}).join('')}
</body></html>`
  const w=window.open('','_blank');w.document.write(html);w.document.close();w.print()
}

export default function CongesGerant({restaurant, employes, showToast}) {
  const [conges,setConges]=useState([])
  const [tab,setTab]=useState('attente')
  const [selected,setSelected]=useState(null)
  const [commentaire,setCommentaire]=useState('')
  const [editSolde,setEditSolde]=useState(null)
  const [soldeTmp,setSoldeTmp]=useState('')
  const [annulerConfirm,setAnnulerConfirm]=useState(null)

  useEffect(()=>{
    if(!restaurant) return
    loadConges()
    const ch=supabase.channel('conges-gerant')
      .on('postgres_changes',{event:'*',schema:'public',table:'conges',filter:`restaurant_id=eq.${restaurant.id}`},loadConges)
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[restaurant?.id])

  async function loadConges(){
    const {data}=await supabase.from('conges')
      .select('*,employes(id,prenom,nom,role,conges_total,conges_pris,rtt_total,rtt_pris)')
      .eq('restaurant_id',restaurant.id)
      .order('created_at',{ascending:false})
    setConges(data||[])
  }

  async function traiter(id, statut){
    const c=conges.find(x=>x.id===id)
    const jours=nbJours(c.date_debut,c.date_fin)
    await supabase.from('conges').update({statut,commentaire_gerant:commentaire||null}).eq('id',id)
    if(statut==='accepte'){
      if(c.type==='conge_paye') await supabase.from('employes').update({conges_pris:(c.employes?.conges_pris||0)+jours}).eq('id',c.employe_id)
      if(c.type==='rtt') await supabase.from('employes').update({rtt_pris:(c.employes?.rtt_pris||0)+jours}).eq('id',c.employe_id)
    }
    if((statut==='refuse'||statut==='annule')&&c?.statut==='accepte'){
      if(c.type==='conge_paye') await supabase.from('employes').update({conges_pris:Math.max(0,(c.employes?.conges_pris||0)-jours)}).eq('id',c.employe_id)
      if(c.type==='rtt') await supabase.from('employes').update({rtt_pris:Math.max(0,(c.employes?.rtt_pris||0)-jours)}).eq('id',c.employe_id)
    }
    setSelected(null);setCommentaire('');setAnnulerConfirm(null)
    showToast(statut==='accepte'?'Congé accepté ✅':statut==='annule'?'Congé annulé 🚫':'Congé refusé ❌')
    loadConges()
  }

  async function saveSolde(empId,type){
    const val=parseInt(soldeTmp)
    if(isNaN(val)||val<0||val>365){showToast('Valeur invalide (0-365)');return}
    await supabase.from('employes').update({[type==='rtt'?'rtt_total':'conges_total']:val}).eq('id',empId)
    setEditSolde(null);setSoldeTmp('');showToast('Solde mis à jour ✓');loadConges()
  }

  const enAttente=conges.filter(c=>c.statut==='en_attente')
  const traites=conges.filter(c=>c.statut!=='en_attente')

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:15,fontWeight:800}}>🏖️ Gestion des congés</div>
        <button onClick={()=>exportPDF(conges,restaurant,employes)} style={{padding:'7px 14px',borderRadius:9,border:'none',background:'#16a34a',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>📄 Export PDF</button>
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
            const emp=c.employes
            const jours=nbJours(c.date_debut,c.date_fin)
            const cpSolde=(emp?.conges_total||25)-(emp?.conges_pris||0)
            const rttSolde=(emp?.rtt_total||0)-(emp?.rtt_pris||0)
            return (
              <div key={c.id} style={{background:'var(--surface)',border:`2px solid ${type.bc}`,borderRadius:16,padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:type.bg,color:type.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>{(emp?.prenom?.[0]||'')+(emp?.nom?.[0]||'')}</div>
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
                    <span style={{fontSize:12,fontWeight:700,marginLeft:'auto'}}>📅 {jours} jour{jours>1?'s':''}</span>
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
                      <span style={{fontSize:12,color:'#dc2626',flex:1,fontWeight:600}}>Annuler ce congé ?</span>
                      <button onClick={()=>traiter(c.id,'annule')} style={{padding:'6px 14px',borderRadius:8,border:'none',background:'#dc2626',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>Confirmer</button>
                      <button onClick={()=>setAnnulerConfirm(null)} style={{padding:'6px 12px',borderRadius:8,border:'1px solid #fecaca',background:'white',color:'#dc2626',fontSize:12,cursor:'pointer'}}>Non</button>
                    </div>
                  ):(
                    <button onClick={()=>setAnnulerConfirm(c.id)} style={{width:'100%',padding:'8px',borderRadius:9,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:12,fontWeight:700,cursor:'pointer',marginTop:6}}>
                      🚫 Annuler ce congé
                    </button>
                  )
                )}
              </div>
            )
          })
      )}

      {/* SOLDES */}
      {tab==='soldes'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:12,color:'var(--text2)',padding:'10px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)'}}>
            💡 Les compteurs se mettent à jour automatiquement à chaque acceptation ou annulation.
          </div>
          {employes.filter(e=>e.actif!==false).map(emp=>{
            const empD=conges.find(c=>c.employe_id===emp.id)?.employes||emp
            const cpP=empD.conges_pris||0, cpT=empD.conges_total||25, cpS=cpT-cpP
            const rttP=empD.rtt_pris||0, rttT=empD.rtt_total||0, rttS=rttT-rttP
            return (
              <div key={emp.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:'#f0f7ff',color:'#0066cc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{(emp.prenom?.[0]||'')+(emp.nom?.[0]||'')}</div>
                  <div><div style={{fontSize:13,fontWeight:700}}>{emp.prenom} {emp.nom}</div><div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div></div>
                </div>
                <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:12}}>
                  {/* CP */}
                  {[{key:'cp',emoji:'🏖️',label:'Congés payés',color:'#0066cc',bg:'#f0f7ff',bc:'#d0e8ff',pris:cpP,total:cpT,solde:cpS},{key:'rtt',emoji:'⏰',label:'RTT',color:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff',pris:rttP,total:rttT,solde:rttS}].map(({key,emoji,label,color,bg,bc,pris,total,solde})=>(
                    <div key={key}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                          <span style={{fontSize:13}}>{emoji}</span>
                          <span style={{fontSize:12,fontWeight:700,color}}>{label}</span>
                        </div>
                        {editSolde?.empId===emp.id&&editSolde?.type===key?(
                          <div style={{display:'flex',gap:4,alignItems:'center'}}>
                            <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365" style={{width:52,padding:'4px 6px',borderRadius:7,border:`1.5px solid ${color}`,background:'var(--bg)',fontSize:12,color:'var(--text)',outline:'none',textAlign:'center'}}/>
                            <button onClick={()=>saveSolde(emp.id,key)} style={{padding:'4px 10px',borderRadius:7,border:'none',background:color,color:'white',fontSize:11,fontWeight:700,cursor:'pointer'}}>OK</button>
                            <button onClick={()=>setEditSolde(null)} style={{padding:'4px 8px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:11,cursor:'pointer'}}>✕</button>
                          </div>
                        ):(
                          <button onClick={()=>{setEditSolde({empId:emp.id,type:key});setSoldeTmp(String(total))}} style={{padding:'3px 10px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text)',fontSize:11,fontWeight:700,cursor:'pointer'}}>{total}j total ✏️</button>
                        )}
                      </div>
                      <div style={{display:'flex',gap:5,marginBottom:5}}>
                        <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:bg,color,border:`1px solid ${bc}`}}>{pris}j pris</span>
                        <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:solde>0?'#f0fdf4':'#f5f5f5',color:solde>0?'#16a34a':'#6b7280',border:`1px solid ${solde>0?'#bbf7d0':'#e0e0e0'}`}}>{solde}j restants</span>
                      </div>
                      {total>0&&<div style={{height:5,background:'var(--bg)',borderRadius:3,overflow:'hidden',border:'1px solid var(--border)'}}>
                        <div style={{height:'100%',background:pris/total>0.8?'#dc2626':color,borderRadius:3,width:`${Math.min(100,Math.round(pris/total*100))}%`,transition:'width .3s'}}/>
                      </div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
