import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = [
  {id:'conge_paye',l:'Congé payé',emoji:'🏖️',c:'#0066cc',bg:'#f0f7ff',bc:'#d0e8ff'},
  {id:'maladie',l:'Arrêt maladie',emoji:'🏥',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  {id:'rtt',l:'RTT',emoji:'⏰',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
  {id:'sans_solde',l:'Sans solde',emoji:'📋',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa'},
  {id:'autre',l:'Autre',emoji:'📝',c:'#555',bg:'#f5f5f5',bc:'#e0e0e0'},
]

const STATUT_STYLE = {
  en_attente:{l:'En attente',c:'#ea580c',bg:'#fff7ed',bc:'#fed7aa',emoji:'⏳'},
  accepte:{l:'Accepté',c:'#16a34a',bg:'#f0fdf4',bc:'#bbf7d0',emoji:'✅'},
  refuse:{l:'Refusé',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca',emoji:'❌'},
}

function fmtDate(d){return d.toISOString().split('T')[0]}
function fmtLabel(s){
  const d=new Date(s+'T00:00:00')
  return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})
}
function nbJours(d1,d2){
  const a=new Date(d1),b=new Date(d2)
  return Math.max(1,Math.round((b-a)/(1000*60*60*24))+1)
}

export default function CongesEmploye({employe}) {
  const [conges,setConges]=useState([])
  const [showForm,setShowForm]=useState(false)
  const [form,setForm]=useState({date_debut:fmtDate(new Date()),date_fin:fmtDate(new Date()),type:'conge_paye',message:''})
  const [loading,setLoading]=useState(false)
  const [sent,setSent]=useState(false)

  useEffect(()=>{
    loadConges()
    const ch=supabase.channel('conges-employe')
      .on('postgres_changes',{event:'*',schema:'public',table:'conges',filter:`employe_id=eq.${employe.id}`},loadConges)
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[employe.id])

  async function loadConges(){
    const {data}=await supabase.from('conges').select('*').eq('employe_id',employe.id).order('created_at',{ascending:false})
    setConges(data||[])
  }

  async function submit(){
    if(!form.date_debut||!form.date_fin){return}
    if(new Date(form.date_fin)<new Date(form.date_debut)){alert('La date de fin doit être après la date de début');return}
    setLoading(true)
    await supabase.from('conges').insert({
      employe_id:employe.id,
      restaurant_id:employe.restaurant_id,
      date_debut:form.date_debut,
      date_fin:form.date_fin,
      type:form.type,
      message:form.message,
      statut:'en_attente'
    })
    setLoading(false)
    setSent(true)
    setShowForm(false)
    setForm({date_debut:fmtDate(new Date()),date_fin:fmtDate(new Date()),type:'conge_paye',message:''})
    setTimeout(()=>setSent(false),3000)
    loadConges()
  }

  // Solde
  const totalDroit=employe.conges_total||25
  const prisPaye=conges.filter(c=>c.type==='conge_paye'&&c.statut==='accepte').reduce((a,c)=>a+nbJours(c.date_debut,c.date_fin),0)
  const solde=totalDroit-prisPaye
  const enAttente=conges.filter(c=>c.statut==='en_attente').length

  return (
    <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>

      {/* Solde */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,padding:20}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:12}}>MON SOLDE DE CONGÉS</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          <div style={{background:'#f0f7ff',border:'1px solid #d0e8ff',borderRadius:12,padding:'14px 10px',textAlign:'center'}}>
            <div style={{fontSize:28,fontWeight:900,color:'#0066cc',letterSpacing:'-.03em'}}>{totalDroit}</div>
            <div style={{fontSize:11,color:'#0066cc',marginTop:3,fontWeight:500}}>jours / an</div>
          </div>
          <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:12,padding:'14px 10px',textAlign:'center'}}>
            <div style={{fontSize:28,fontWeight:900,color:'#dc2626',letterSpacing:'-.03em'}}>{prisPaye}</div>
            <div style={{fontSize:11,color:'#dc2626',marginTop:3,fontWeight:500}}>pris</div>
          </div>
          <div style={{background:solde>5?'#f0fdf4':'#fff7ed',border:`1px solid ${solde>5?'#bbf7d0':'#fed7aa'}`,borderRadius:12,padding:'14px 10px',textAlign:'center'}}>
            <div style={{fontSize:28,fontWeight:900,color:solde>5?'#16a34a':'#ea580c',letterSpacing:'-.03em'}}>{solde}</div>
            <div style={{fontSize:11,color:solde>5?'#16a34a':'#ea580c',marginTop:3,fontWeight:500}}>restants</div>
          </div>
        </div>
        {enAttente>0&&(
          <div style={{marginTop:10,padding:'8px 12px',background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:9,fontSize:12,color:'#ea580c',fontWeight:500,textAlign:'center'}}>
            ⏳ {enAttente} demande{enAttente>1?'s':''} en attente de validation
          </div>
        )}
      </div>

      {/* Flash confirmation */}
      {sent&&(
        <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:10,fontSize:13,color:'#16a34a',fontWeight:600}}>
          ✅ Demande envoyée — votre gérant la traitera bientôt
        </div>
      )}

      {/* Bouton nouvelle demande */}
      {!showForm&&(
        <button onClick={()=>setShowForm(true)} style={{width:'100%',height:50,borderRadius:14,border:'none',background:'#0066cc',color:'white',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          <span style={{fontSize:18}}>➕</span> Nouvelle demande de congé
        </button>
      )}

      {/* Formulaire */}
      {showForm&&(
        <div style={{background:'var(--surface)',border:'2px solid #0066cc',borderRadius:18,padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:800,color:'var(--text)'}}>Nouvelle demande</div>
            <button onClick={()=>setShowForm(false)} style={{width:28,height:28,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>

          {/* Type */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:8}}>TYPE DE CONGÉ</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {TYPES.map(t=>(
                <label key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:form.type===t.id?t.bg:'var(--bg)',border:`1.5px solid ${form.type===t.id?t.bc:'var(--border)'}`,borderRadius:10,cursor:'pointer',transition:'all .15s'}}>
                  <input type="radio" name="type" value={t.id} checked={form.type===t.id} onChange={()=>setForm(f=>({...f,type:t.id}))} style={{accentColor:t.c}}/>
                  <span style={{fontSize:16}}>{t.emoji}</span>
                  <span style={{fontSize:13,fontWeight:600,color:form.type===t.id?t.c:'var(--text)'}}>{t.l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Du</label>
              <input type="date" value={form.date_debut} min={fmtDate(new Date())} onChange={e=>setForm(f=>({...f,date_debut:e.target.value,date_fin:e.target.value>f.date_fin?e.target.value:f.date_fin}))}
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Au</label>
              <input type="date" value={form.date_fin} min={form.date_debut} onChange={e=>setForm(f=>({...f,date_fin:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box'}}/>
            </div>
          </div>

          {/* Nb jours */}
          <div style={{marginBottom:14,padding:'8px 14px',background:'var(--bg)',borderRadius:9,fontSize:13,color:'var(--text2)',textAlign:'center'}}>
            📅 {nbJours(form.date_debut,form.date_fin)} jour{nbJours(form.date_debut,form.date_fin)>1?'s':''}
            {form.type==='conge_paye'&&solde>0&&nbJours(form.date_debut,form.date_fin)>solde&&(
              <span style={{color:'#dc2626',fontWeight:600}}> — ⚠️ dépasse votre solde ({solde}j restants)</span>
            )}
          </div>

          {/* Message */}
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Message (optionnel)</label>
            <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={3} placeholder="Motif, précisions..."
              style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',resize:'none',fontFamily:'var(--font)',boxSizing:'border-box'}}/>
          </div>

          <button onClick={submit} disabled={loading} style={{width:'100%',height:48,borderRadius:12,border:'none',background:'#0066cc',color:'white',fontSize:15,fontWeight:700,cursor:'pointer',opacity:loading?.7:1}}>
            {loading?'Envoi...':'Envoyer la demande'}
          </button>
        </div>
      )}

      {/* Historique demandes */}
      {conges.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>MES DEMANDES</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {conges.map(c=>{
              const type=TYPES.find(t=>t.id===c.type)||TYPES[4]
              const statut=STATUT_STYLE[c.statut]||STATUT_STYLE.en_attente
              return (
                <div key={c.id} style={{background:'var(--surface)',border:`1px solid ${statut.bc}`,borderRadius:14,padding:16}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:18}}>{type.emoji}</span>
                      <span style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{type.l}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:statut.bg,color:statut.c,border:`1px solid ${statut.bc}`}}>
                      {statut.emoji} {statut.l}
                    </span>
                  </div>
                  <div style={{fontSize:13,color:'var(--text2)',marginBottom:c.commentaire_gerant?8:0}}>
                    📅 {fmtLabel(c.date_debut)} → {fmtLabel(c.date_fin)} · <strong>{nbJours(c.date_debut,c.date_fin)}j</strong>
                  </div>
                  {c.message&&<div style={{fontSize:12,color:'var(--text2)',fontStyle:'italic',marginBottom:c.commentaire_gerant?6:0}}>"{c.message}"</div>}
                  {c.commentaire_gerant&&(
                    <div style={{fontSize:12,padding:'8px 12px',background:statut.bg,border:`1px solid ${statut.bc}`,borderRadius:8,color:statut.c}}>
                      💬 Gérant : {c.commentaire_gerant}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {conges.length===0&&!showForm&&(
        <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)'}}>
          <div style={{fontSize:40,marginBottom:12}}>🏖️</div>
          <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Aucune demande de congé</div>
          <div style={{fontSize:12}}>Appuyez sur le bouton pour faire une demande</div>
        </div>
      )}
    </div>
  )
}
