import { useState, useEffect } from 'react'
import { api } from '../apiClient'

const TYPES = {
  conge_paye: {l:'Congé payé',emoji:'🏖️',c:'#E11D48',bg:'#fff1f3',bc:'#fecdd3'},
  maladie:    {l:'Maladie',emoji:'🏥',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
  rtt:        {l:'RTT',emoji:'⏰',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
  autre:      {l:'Autre',emoji:'📝',c:'#6b7280',bg:'#f5f5f5',bc:'#e0e0e0'},
}
function fmtD(s){if(!s)return'—';const str=typeof s==='string'?s:s.toISOString().split('T')[0];return new Date(str+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
function nbJ(d1,d2){return Math.max(1,Math.round((new Date(d2)-new Date(d1))/(1000*60*60*24))+1)}

export default function MesAbsencesGerant({gerantId, gerantPrenom, gerantNom, restaurant, employeId, onProfilCreated, onReloadEmployes, showToast}){
  const [profil, setProfil] = useState(null)
  const [absences, setAbsences] = useState([])
  const [visible, setVisible] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({type:'conge_paye', date_debut:'', date_fin:'', message:''})
  const [activForm, setActivForm] = useState({prenom:gerantPrenom||'', nom:gerantNom||'', role:'Gérant', visible_equipe:true})
  const [loading, setLoading] = useState(false)
  const [editInfos, setEditInfos] = useState(false)
  const [infosForm, setInfosForm] = useState({prenom:'', nom:'', role:''})

  useEffect(()=>{
    if(employeId) loadProfil()
  },[employeId])

  async function loadProfil(){
    if(!employeId||!restaurant) return
    const emps = await api.get(`/employes/${restaurant.id}?include_gerant=true`)
    const me = (emps||[]).find(e=>e.id===employeId)
    if(me){ setProfil(me); setVisible(me.visible_equipe!==false) }
    const cs = await api.get(`/conges?restaurant_id=${restaurant.id}&include_gerant=true`)
    setAbsences((cs||[]).filter(c=>c.employe_id===employeId))
  }

  async function activerProfil(){
    if(!activForm.prenom.trim()||!activForm.nom.trim()){showToast('Nom et prénom requis');return}
    setLoading(true)
    const res = await api.post(`/gerants/${gerantId}/profil-employe`, {
      restaurant_id: restaurant.id,
      prenom: activForm.prenom.trim(),
      nom: activForm.nom.trim(),
      role: activForm.role||'Gérant',
      visible_equipe: activForm.visible_equipe
    })
    setLoading(false)
    if(res?.id){
      setProfil(res); setVisible(res.visible_equipe!==false)
      if(onProfilCreated) onProfilCreated(res.id)
      if(onReloadEmployes) onReloadEmployes()
      showToast('Profil activé ✓')
    } else showToast('Erreur')
  }

  async function toggleVisible(){
    const nv = !visible
    setVisible(nv)
    await api.put(`/gerants/${gerantId}/profil-employe/visibilite`, {visible_equipe:nv})
    showToast(nv?'Visible par l\'équipe':'Masqué de l\'équipe')
    if(profil) setProfil({...profil, visible_equipe:nv})
    if(onReloadEmployes) onReloadEmployes()
  }

  async function poserAbsence(){
    if(!form.date_debut||!form.date_fin){showToast('Dates requises');return}
    if(form.date_fin<form.date_debut){showToast('Date de fin invalide');return}
    setLoading(true)
    // Auto-accepté car c'est le gérant
    const res = await api.post('/conges', {
      employe_id: employeId,
      restaurant_id: restaurant.id,
      type: form.type,
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      message: form.message||null,
      statut: 'accepte'
    })
    setLoading(false)
    if(res?.id){
      setShowForm(false)
      setForm({type:'conge_paye', date_debut:'', date_fin:'', message:''})
      showToast('Absence enregistrée ✓')
      loadProfil()
      if(onReloadEmployes) onReloadEmployes()
    } else showToast('Erreur')
  }

  async function saveInfos(){
    if(!infosForm.prenom.trim()||!infosForm.nom.trim()){showToast('Nom et prénom requis');return}
    await api.put(`/gerants/${gerantId}/profil-employe`, {
      prenom: infosForm.prenom.trim(),
      nom: infosForm.nom.trim(),
      role: infosForm.role||'Gérant'
    })
    setProfil(p=>({...p, prenom:infosForm.prenom.trim(), nom:infosForm.nom.trim(), role:infosForm.role}))
    setEditInfos(false)
    showToast('Infos mises à jour ✓')
    loadProfil()
    if(onReloadEmployes) onReloadEmployes()
  }

  async function supprimerAbsence(id){
    if(!confirm('Supprimer cette absence ?')) return
    await api.delete(`/conges/${id}`)
    showToast('Absence supprimée')
    loadProfil()
  }

  const inp={width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box'}

  // ── PAS ENCORE DE PROFIL : écran d'activation ──
  if(!employeId||!profil){
    return (
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
          <div style={{fontSize:14,fontWeight:800}}>Mes absences</div>
          <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>Posez vos propres congés en tant que gérant</div>
        </div>
        <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:12}}>
          <div style={{padding:'12px 14px',background:'var(--accent-bg)',borderRadius:10,fontSize:12,color:'var(--accent)',lineHeight:1.5}}>
            💡 Activez votre profil pour poser vos absences. Elles seront automatiquement validées. Vous choisissez si votre équipe peut les voir.
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Prénom</label>
              <input value={activForm.prenom} onChange={e=>setActivForm(f=>({...f,prenom:e.target.value}))} style={inp}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Nom</label>
              <input value={activForm.nom} onChange={e=>setActivForm(f=>({...f,nom:e.target.value}))} style={inp}/>
            </div>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Poste affiché</label>
            <input value={activForm.role} onChange={e=>setActivForm(f=>({...f,role:e.target.value}))} placeholder="Gérant" style={inp}/>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)',cursor:'pointer'}}>
            <input type="checkbox" checked={activForm.visible_equipe} onChange={e=>setActivForm(f=>({...f,visible_equipe:e.target.checked}))} style={{width:18,height:18,cursor:'pointer'}}/>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>Visible par mon équipe</div>
              <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>Vos absences apparaîtront dans "Présences du jour" des employés</div>
            </div>
          </label>
          <button onClick={activerProfil} disabled={loading} style={{height:44,borderRadius:11,border:'none',background:'var(--accent)',color:'white',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading?.6:1}}>
            {loading?'Activation...':'Activer mon profil'}
          </button>
        </div>
      </div>
    )
  }

  // ── PROFIL ACTIF : gestion des absences ──
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',marginBottom:16}}>
      <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:14,fontWeight:800}}>Mes absences</div>
          <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>Vos congés sont validés automatiquement</div>
        </div>
        <button onClick={()=>setShowForm(s=>!s)} style={{padding:'8px 14px',borderRadius:9,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          {showForm?'✕ Annuler':'+ Poser une absence'}
        </button>
      </div>

      <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}}>
        {/* Infos profil + bouton modifier */}
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)'}}>
          <div style={{width:38,height:38,borderRadius:'50%',background:'var(--accent-bg)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,flexShrink:0}}>
            {((profil.prenom?.[0]||'')+(profil.nom?.[0]||'')).toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700}}>{profil.prenom} {profil.nom}</div>
            <div style={{fontSize:12,color:'var(--text2)'}}>{profil.role||'Gérant'}</div>
          </div>
          <button onClick={()=>{setInfosForm({prenom:profil.prenom,nom:profil.nom,role:profil.role||'Gérant'});setEditInfos(true)}}
            style={{padding:'6px 12px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--surface)',color:'var(--text2)',fontSize:12,fontWeight:600,cursor:'pointer',flexShrink:0}}>
            ✏️ Modifier
          </button>
        </div>

        {/* Form édition infos */}
        {editInfos&&(
          <div style={{background:'var(--bg)',borderRadius:12,border:'1px solid var(--border)',padding:16,display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Prénom</label>
                <input value={infosForm.prenom} onChange={e=>setInfosForm(f=>({...f,prenom:e.target.value}))} style={inp}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Nom</label>
                <input value={infosForm.nom} onChange={e=>setInfosForm(f=>({...f,nom:e.target.value}))} style={inp}/>
              </div>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Poste affiché</label>
              <input value={infosForm.role} onChange={e=>setInfosForm(f=>({...f,role:e.target.value}))} style={inp}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setEditInfos(false)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={saveInfos} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
            </div>
          </div>
        )}

        {/* Toggle visibilité */}
        <label style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)',cursor:'pointer'}}>
          <input type="checkbox" checked={visible} onChange={toggleVisible} style={{width:18,height:18,cursor:'pointer'}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600}}>Visible par mon équipe</div>
            <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{visible?'Vos absences sont visibles par les employés':'Vous êtes masqué de l\'équipe'}</div>
          </div>
        </label>

        {/* Formulaire poser absence */}
        {showForm&&(
          <div style={{background:'var(--bg)',borderRadius:12,border:'1px solid var(--border)',padding:16,display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Type</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {Object.entries(TYPES).map(([k,v])=>(
                  <button key={k} onClick={()=>setForm(f=>({...f,type:k}))} style={{
                    padding:'7px 12px',borderRadius:20,fontSize:12,fontWeight:form.type===k?700:500,cursor:'pointer',
                    border:`1.5px solid ${form.type===k?v.c:'var(--border)'}`,
                    background:form.type===k?v.bg:'var(--surface)',
                    color:form.type===k?v.c:'var(--text2)'}}>
                    {v.emoji} {v.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Du</label>
                <input type="date" value={form.date_debut} onChange={e=>setForm(f=>({...f,date_debut:e.target.value}))} style={inp}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Au</label>
                <input type="date" value={form.date_fin} onChange={e=>setForm(f=>({...f,date_fin:e.target.value}))} style={inp}/>
              </div>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Note (optionnel)</label>
              <input value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Ex: Vacances" style={inp}/>
            </div>
            <button onClick={poserAbsence} disabled={loading} style={{height:44,borderRadius:11,border:'none',background:'#16a34a',color:'white',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading?.6:1}}>
              {loading?'Enregistrement...':'✓ Enregistrer l\'absence'}
            </button>
          </div>
        )}

        {/* Liste des absences */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.5px'}}>
            Mes absences à venir & passées
          </div>
          {absences.length===0?(
            <div style={{textAlign:'center',padding:'24px',color:'var(--text3)',fontSize:13,background:'var(--bg)',borderRadius:10}}>
              Aucune absence enregistrée
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {absences.sort((a,b)=>b.date_debut.localeCompare(a.date_debut)).map(a=>{
                const t=TYPES[a.type]||TYPES.autre
                const jours=nbJ(a.date_debut,a.date_fin)
                const past=new Date(a.date_fin)<new Date(new Date().toISOString().split('T')[0])
                return (
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 12px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)',opacity:past?.6:1}}>
                    <div style={{width:34,height:34,borderRadius:9,background:t.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{t.emoji}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700}}>{t.l}</div>
                      <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{fmtD(a.date_debut)} → {fmtD(a.date_fin)} · {jours}j</div>
                    </div>
                    <button onClick={()=>supprimerAbsence(a.id)} style={{padding:'6px 9px',borderRadius:8,border:'none',background:'var(--red-bg)',color:'var(--red)',fontSize:11,cursor:'pointer',flexShrink:0}}>🗑️</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
