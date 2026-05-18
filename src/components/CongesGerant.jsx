import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = {
  conge_paye:{l:'Congé payé',emoji:'🏖️',c:'#0066cc',bg:'#f0f7ff',bc:'#d0e8ff'},
  maladie:{l:'Arrêt maladie',emoji:'🏥',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  rtt:{l:'RTT',emoji:'⏰',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
  sans_solde:{l:'Sans solde',emoji:'📋',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  autre:{l:'Autre',emoji:'📝',c:'#555',bg:'#f5f5f5',bc:'#e0e0e0'},
}

function fmtLabel(s){
  const d=new Date(s+'T00:00:00')
  return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})
}
function nbJours(d1,d2){return Math.max(1,Math.round((new Date(d2)-new Date(d1))/(1000*60*60*24))+1)}

export default function CongesGerant({restaurant, employes, showToast}) {
  const [conges,setConges]=useState([])
  const [tab,setTab]=useState('attente')
  const [selected,setSelected]=useState(null)
  const [commentaire,setCommentaire]=useState('')
  const [editSolde,setEditSolde]=useState(null)
  const [soldeTmp,setSoldeTmp]=useState('')

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
      .select('*,employes(prenom,nom,role,conges_total,conges_pris)')
      .eq('restaurant_id',restaurant.id)
      .order('created_at',{ascending:false})
    setConges(data||[])
  }

  async function traiter(id, statut){
    await supabase.from('conges').update({statut, commentaire_gerant:commentaire||null}).eq('id',id)
    // Si accepté congé payé — mettre à jour conges_pris
    const c=conges.find(x=>x.id===id)
    if(statut==='accepte'&&c?.type==='conge_paye'){
      const jours=nbJours(c.date_debut,c.date_fin)
      const actuel=c.employes?.conges_pris||0
      await supabase.from('employes').update({conges_pris:actuel+jours}).eq('id',c.employe_id)
    }
    // Si refus après acceptation — rembourser
    if(statut==='refuse'&&c?.statut==='accepte'&&c?.type==='conge_paye'){
      const jours=nbJours(c.date_debut,c.date_fin)
      const actuel=c.employes?.conges_pris||0
      await supabase.from('employes').update({conges_pris:Math.max(0,actuel-jours)}).eq('id',c.employe_id)
    }
    setSelected(null)
    setCommentaire('')
    showToast(statut==='accepte'?'Congé accepté ✅':'Congé refusé')
    loadConges()
  }

  async function saveSolde(empId){
    const val=parseInt(soldeTmp)
    if(isNaN(val)||val<0||val>365){showToast('Valeur invalide (0-365)');return}
    await supabase.from('employes').update({conges_total:val}).eq('id',empId)
    setEditSolde(null)
    setSoldeTmp('')
    showToast('Solde mis à jour')
    loadConges()
  }

  const enAttente=conges.filter(c=>c.statut==='en_attente')
  const traites=conges.filter(c=>c.statut!=='en_attente')

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>

      {/* Tabs */}
      <div style={{display:'flex',background:'var(--bg)',borderRadius:12,padding:3,gap:3}}>
        {[{id:'attente',l:'En attente',badge:enAttente.length},{id:'historique',l:'Historique'},{id:'soldes',l:'Soldes congés'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'8px 4px',borderRadius:9,border:'none',background:tab===t.id?'var(--surface)':'transparent',color:tab===t.id?'var(--text)':'var(--text2)',fontSize:12,fontWeight:tab===t.id?700:500,cursor:'pointer',position:'relative',boxShadow:tab===t.id?'0 1px 4px rgba(0,0,0,.06)':'none',transition:'all .15s'}}>
            {t.l}
            {t.badge>0&&<span style={{position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',background:'#dc2626',color:'white',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* EN ATTENTE */}
      {tab==='attente'&&(
        enAttente.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)'}}>
            <div style={{fontSize:36,marginBottom:10}}>✅</div>
            <div style={{fontSize:13}}>Aucune demande en attente</div>
          </div>
        ):enAttente.map(c=>{
          const type=TYPES[c.type]||TYPES.autre
          const emp=c.employes
          const solde=(emp?.conges_total||25)-(emp?.conges_pris||0)
          return (
            <div key={c.id} style={{background:'var(--surface)',border:'1px solid #fed7aa',borderRadius:16,padding:16}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'#f0f7ff',color:'#0066cc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>
                  {(emp?.prenom?.[0]||'')+(emp?.nom?.[0]||'')}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{emp?.prenom} {emp?.nom}</div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{emp?.role}</div>
                </div>
                <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#fff7ed',color:'#ea580c',border:'1px solid #fed7aa'}}>⏳ En attente</span>
              </div>
              <div style={{background:'var(--bg)',borderRadius:10,padding:'10px 14px',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                  <span style={{fontSize:16}}>{type.emoji}</span>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{type.l}</span>
                  <span style={{fontSize:12,color:'var(--text2)',marginLeft:'auto'}}>📅 {nbJours(c.date_debut,c.date_fin)}j</span>
                </div>
                <div style={{fontSize:13,color:'var(--text2)'}}>{fmtLabel(c.date_debut)} → {fmtLabel(c.date_fin)}</div>
                {c.message&&<div style={{fontSize:12,color:'var(--text2)',fontStyle:'italic',marginTop:4}}>"{c.message}"</div>}
                {c.type==='conge_paye'&&(
                  <div style={{fontSize:11,marginTop:6,color:solde>=nbJours(c.date_debut,c.date_fin)?'#16a34a':'#dc2626',fontWeight:500}}>
                    Solde restant : {solde}j {solde<nbJours(c.date_debut,c.date_fin)?'⚠️ insuffisant':'✓'}
                  </div>
                )}
              </div>
              {selected===c.id?(
                <div>
                  <textarea value={commentaire} onChange={e=>setCommentaire(e.target.value)} placeholder="Commentaire optionnel..." rows={2}
                    style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg)',fontSize:12,color:'var(--text)',outline:'none',resize:'none',fontFamily:'var(--font)',boxSizing:'border-box',marginBottom:8}}/>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                    <button onClick={()=>traiter(c.id,'accepte')} style={{padding:'10px',borderRadius:10,border:'none',background:'#16a34a',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>✅ Accepter</button>
                    <button onClick={()=>traiter(c.id,'refuse')} style={{padding:'10px',borderRadius:10,border:'none',background:'#dc2626',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>❌ Refuser</button>
                    <button onClick={()=>{setSelected(null);setCommentaire('')}} style={{padding:'10px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:12,fontWeight:700,cursor:'pointer'}}>Annuler</button>
                  </div>
                </div>
              ):(
                <button onClick={()=>setSelected(c.id)} style={{width:'100%',padding:'11px',borderRadius:11,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  Traiter cette demande →
                </button>
              )}
            </div>
          )
        })
      )}

      {/* HISTORIQUE */}
      {tab==='historique'&&(
        traites.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)',fontSize:13}}>Aucun congé traité</div>
        ):traites.map(c=>{
          const type=TYPES[c.type]||TYPES.autre
          const emp=c.employes
          const statStyle=c.statut==='accepte'?{c:'#16a34a',bg:'#f0fdf4',bc:'#bbf7d0',l:'Accepté',e:'✅'}:{c:'#dc2626',bg:'#fef2f2',bc:'#fecaca',l:'Refusé',e:'❌'}
          return (
            <div key={c.id} style={{background:'var(--surface)',border:`1px solid ${statStyle.bc}`,borderRadius:14,padding:14}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{emp?.prenom} {emp?.nom}</div>
                <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:statStyle.bg,color:statStyle.c,border:`1px solid ${statStyle.bc}`}}>{statStyle.e} {statStyle.l}</span>
              </div>
              <div style={{fontSize:12,color:'var(--text2)'}}>{type.emoji} {type.l} · {fmtLabel(c.date_debut)} → {fmtLabel(c.date_fin)} · {nbJours(c.date_debut,c.date_fin)}j</div>
              {c.commentaire_gerant&&<div style={{fontSize:11,color:'var(--text2)',marginTop:4,fontStyle:'italic'}}>💬 {c.commentaire_gerant}</div>}
            </div>
          )
        })
      )}

      {/* SOLDES */}
      {tab==='soldes'&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Définissez le nombre de jours de congés payés alloués par employé.</div>
          {employes.filter(e=>e.actif).map(emp=>{
            const congesPris=emp.conges_pris||0
            const congesTotal=emp.conges_total||25
            const solde=congesTotal-congesPris
            const pct=Math.min(100,Math.round(congesPris/congesTotal*100))
            return (
              <div key={emp.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#f0f7ff',color:'#0066cc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>
                    {(emp.prenom?.[0]||'')+(emp.nom?.[0]||'')}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{emp.prenom} {emp.nom}</div>
                    <div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div>
                  </div>
                  {editSolde===emp.id?(
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <input type="number" value={soldeTmp} onChange={e=>setSoldeTmp(e.target.value)} min="0" max="365"
                        style={{width:60,padding:'6px 8px',borderRadius:8,border:'1.5px solid var(--accent)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',textAlign:'center'}}/>
                      <button onClick={()=>saveSolde(emp.id)} style={{padding:'6px 12px',borderRadius:8,border:'none',background:'var(--accent)',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>OK</button>
                      <button onClick={()=>setEditSolde(null)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:12,cursor:'pointer'}}>✕</button>
                    </div>
                  ):(
                    <button onClick={()=>{setEditSolde(emp.id);setSoldeTmp(String(congesTotal))}} style={{padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                      ✏️ {congesTotal}j
                    </button>
                  )}
                </div>
                <div style={{display:'flex',gap:6,marginBottom:8}}>
                  <span style={{fontSize:11,padding:'2px 9px',borderRadius:20,background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca'}}>{congesPris}j pris</span>
                  <span style={{fontSize:11,padding:'2px 9px',borderRadius:20,background:solde>5?'#f0fdf4':'#fff7ed',color:solde>5?'#16a34a':'#ea580c',border:`1px solid ${solde>5?'#bbf7d0':'#fed7aa'}`}}>{solde}j restants</span>
                </div>
                <div style={{height:6,background:'var(--bg)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',background:pct>80?'#dc2626':pct>50?'#ea580c':'#16a34a',borderRadius:3,width:`${pct}%`,transition:'width .3s'}}/>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
