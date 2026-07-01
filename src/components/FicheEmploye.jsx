import { useState, useEffect } from 'react'

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}

const TYPES_CONTRAT=['CDI','CDD','Intérim','Extra','Stage','Apprentissage','Saisonnier','Freelance']

function fmtDateFr(s){
  if(!s) return null
  try{
    const d=new Date(s+'T00:00:00')
    if(isNaN(d)) return s
    return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})
  }catch(e){return s}
}

const RH_KEYS=['prenom','nom','email','role','groupe_id','telephone','adresse','code_postal','ville','pays','contact_urgence_nom','contact_urgence_tel','type_contrat','date_embauche','date_fin_contrat','taux_horaire','heures_semaine','fonction','date_naissance','lieu_naissance','nationalite','num_securite_sociale','iban']

export default function FicheEmploye({emp, groupe, groupes, present, isMobile, onBack, onSave, features, startEdit}){
  const [tab,setTab]=useState('apercu')
  const [edition,setEdition]=useState(!!startEdit)
  const [form,setForm]=useState({})
  const [saving,setSaving]=useState(false)

  useEffect(()=>{
    const f={}
    RH_KEYS.forEach(k=>{ f[k]=emp?.[k]??'' })
    setForm(f)
    setEdition(!!startEdit)
    setTab('apercu')
  },[emp?.id])

  useEffect(()=>{ setEdition(!!startEdit) },[startEdit])

  if(!emp) return null

  const tabs=[
    {id:'apercu',l:"Vue d'ensemble"},
    {id:'coord',l:'Coordonnées'},
    {id:'contrat',l:'Contrat'},
    {id:'identite',l:'Identité'},
  ]
  if(features?.conges) tabs.push({id:'conges',l:'Congés'})

  async function handleSave(){
    setSaving(true)
    const ok=await onSave(emp.id, form)
    setSaving(false)
    if(ok) setEdition(false)
  }

  function startEdition(){
    const f={}
    RH_KEYS.forEach(k=>{ f[k]=emp?.[k]??'' })
    setForm(f)
    setEdition(true)
  }

  const Row=({label,value})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)',gap:12}}>
      <span style={{fontSize:13,color:'var(--text2)',flexShrink:0}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:value?'var(--text)':'var(--text3)',textAlign:'right',wordBreak:'break-word'}}>{value||'Non renseigné'}</span>
    </div>
  )

  const Card=({icon,bg,title,children})=>(
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:isMobile?'16px 18px':'18px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
        <div style={{width:30,height:30,borderRadius:8,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{icon}</div>
        <span style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{title}</span>
      </div>
      {children}
    </div>
  )

  const inputStyle={width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box'}
  const Field=({label,k,type='text'})=>(
    <div style={{marginBottom:12}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>{label}</label>
      <input type={type} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={inputStyle}/>
    </div>
  )

  const EditCard=({icon,bg,title,children})=>(
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:isMobile?'16px 18px':'18px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:14}}>
        <div style={{width:30,height:30,borderRadius:8,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{icon}</div>
        <span style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{title}</span>
      </div>
      {children}
    </div>
  )

  return (
    <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',display:'flex',flexDirection:'column'}}>

      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:isMobile?'14px 14px':'18px 22px',display:'flex',alignItems:'center',gap:13,position:'sticky',top:0,zIndex:5}}>
        <button onClick={onBack} style={{width:34,height:34,borderRadius:9,border:'1px solid var(--border)',background:'var(--bg)',cursor:'pointer',fontSize:17,color:'var(--text2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>←</button>
        <div style={{position:'relative',flexShrink:0}}>
          <div style={{width:46,height:46,borderRadius:'50%',background:'var(--accent-bg)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800}}>{ini(emp.prenom,emp.nom)}</div>
          {present&&<div style={{position:'absolute',bottom:0,right:0,width:12,height:12,borderRadius:'50%',background:'#22c55e',border:'2.5px solid var(--surface)'}}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:isMobile?16:17,fontWeight:800,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{emp.prenom} {emp.nom}</div>
          <div style={{fontSize:13,color:'var(--text2)',display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
            <span>{emp.fonction||emp.role||'—'}</span>
            {groupe&&<><span style={{width:3,height:3,borderRadius:'50%',background:'var(--border2)'}}/><span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',background:groupe.couleur}}/>{groupe.nom}</span></>}
          </div>
        </div>
        {edition?(
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            <button onClick={()=>setEdition(false)} style={{background:'var(--bg)',color:'var(--text2)',border:'1px solid var(--border)',padding:isMobile?'8px 12px':'9px 16px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
            <button onClick={handleSave} disabled={saving} style={{background:'var(--accent)',color:'#fff',border:'none',padding:isMobile?'8px 12px':'9px 16px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',opacity:saving?0.6:1}}>{saving?'...':'Enregistrer'}</button>
          </div>
        ):(
          <button onClick={startEdition} style={{background:'var(--accent)',color:'#fff',border:'none',padding:isMobile?'8px 12px':'9px 16px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0}}>Modifier</button>
        )}
      </div>

      {!edition&&(
        <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:isMobile?'0 8px':'0 22px',display:'flex',gap:2,overflowX:'auto',scrollbarWidth:'none'}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'12px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:tab===t.id?700:600,whiteSpace:'nowrap',color:tab===t.id?'var(--accent)':'var(--text2)',borderBottom:tab===t.id?'2px solid var(--accent)':'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>{t.l}</button>
          ))}
        </div>
      )}

      <div style={{padding:isMobile?14:22,display:'flex',flexDirection:'column',gap:14}}>

        {!edition&&(<>
          {tab==='apercu'&&(
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14}}>
              <Card icon="📄" bg="#fbeaf0" title="Contrat">
                <Row label="Type" value={emp.type_contrat}/>
                <Row label="Fonction" value={emp.fonction}/>
                <Row label="Embauche" value={fmtDateFr(emp.date_embauche)}/>
                <Row label="Taux horaire" value={emp.taux_horaire?`${emp.taux_horaire} CHF`:null}/>
              </Card>
              <Card icon="📞" bg="#eeedfe" title="Coordonnées">
                <Row label="Téléphone" value={emp.telephone}/>
                <Row label="Ville" value={emp.ville}/>
                <Row label="Urgence" value={emp.contact_urgence_nom}/>
              </Card>
              <Card icon="🪪" bg="#e1f5ee" title="Identité">
                <Row label="Naissance" value={fmtDateFr(emp.date_naissance)}/>
                <Row label="Nationalité" value={emp.nationalite}/>
              </Card>
              {features?.conges&&(
                <Card icon="🌴" bg="#faece7" title="Congés">
                  <Row label="Solde" value={`${(emp.conges_total||0)-(emp.conges_pris||0)} / ${emp.conges_total||0} jours`}/>
                  <Row label="Pris" value={`${emp.conges_pris||0} jours`}/>
                </Card>
              )}
            </div>
          )}
          {tab==='coord'&&(
            <Card icon="📞" bg="#eeedfe" title="Coordonnées">
              <Row label="Téléphone" value={emp.telephone}/>
              <Row label="Adresse" value={emp.adresse}/>
              <Row label="Code postal" value={emp.code_postal}/>
              <Row label="Ville" value={emp.ville}/>
              <Row label="Pays" value={emp.pays}/>
              <Row label="Contact d'urgence" value={emp.contact_urgence_nom}/>
              <Row label="Tél. d'urgence" value={emp.contact_urgence_tel}/>
            </Card>
          )}
          {tab==='contrat'&&(
            <Card icon="📄" bg="#fbeaf0" title="Contrat">
              <Row label="Type de contrat" value={emp.type_contrat}/>
              <Row label="Fonction" value={emp.fonction}/>
              <Row label="Date d'embauche" value={fmtDateFr(emp.date_embauche)}/>
              <Row label="Date de fin" value={fmtDateFr(emp.date_fin_contrat)}/>
              <Row label="Taux horaire" value={emp.taux_horaire?`${emp.taux_horaire} CHF`:null}/>
              <Row label="Heures / semaine" value={emp.heures_semaine?`${emp.heures_semaine}h`:null}/>
            </Card>
          )}
          {tab==='identite'&&(
            <Card icon="🪪" bg="#e1f5ee" title="Identité">
              <Row label="Date de naissance" value={fmtDateFr(emp.date_naissance)}/>
              <Row label="Lieu de naissance" value={emp.lieu_naissance}/>
              <Row label="Nationalité" value={emp.nationalite}/>
              <Row label="N° sécurité sociale / AVS" value={emp.num_securite_sociale}/>
              <Row label="IBAN" value={emp.iban}/>
            </Card>
          )}
          {tab==='conges'&&features?.conges&&(
            <Card icon="🌴" bg="#faece7" title="Congés">
              <Row label="Solde total" value={`${emp.conges_total||0} jours`}/>
              <Row label="Pris" value={`${emp.conges_pris||0} jours`}/>
              <Row label="Restant" value={`${(emp.conges_total||0)-(emp.conges_pris||0)} jours`}/>
            </Card>
          )}
        </>)}

        {edition&&(<>
          <EditCard icon="👤" bg="#fbeaf0" title="Général">
            <Field label="Prénom" k="prenom"/>
            <Field label="Nom" k="nom"/>
            <Field label="Email" k="email" type="email"/>
            <Field label="Fonction / poste" k="fonction"/>
            {groupes&&groupes.length>0&&(
              <div style={{marginBottom:0}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Groupe</label>
                <select value={form.groupe_id||''} onChange={e=>setForm(f=>({...f,groupe_id:e.target.value||null}))} style={inputStyle}>
                  <option value="">Sans groupe</option>
                  {groupes.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}
                </select>
              </div>
            )}
          </EditCard>

          <EditCard icon="📞" bg="#eeedfe" title="Coordonnées">
            <Field label="Téléphone" k="telephone" type="tel"/>
            <Field label="Adresse" k="adresse"/>
            <Field label="Code postal" k="code_postal"/>
            <Field label="Ville" k="ville"/>
            <Field label="Pays" k="pays"/>
            <Field label="Contact d'urgence (nom)" k="contact_urgence_nom"/>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Contact d'urgence (tél.)</label>
              <input type="tel" value={form.contact_urgence_tel||''} onChange={e=>setForm(f=>({...f,contact_urgence_tel:e.target.value}))} style={inputStyle}/>
            </div>
          </EditCard>

          <EditCard icon="📄" bg="#faece7" title="Contrat">
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Type de contrat</label>
              <select value={form.type_contrat||''} onChange={e=>setForm(f=>({...f,type_contrat:e.target.value}))} style={inputStyle}>
                <option value="">Choisir</option>
                {TYPES_CONTRAT.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <Field label="Date d'embauche" k="date_embauche" type="date"/>
            <Field label="Date de fin (si CDD)" k="date_fin_contrat" type="date"/>
            <Field label="Taux horaire" k="taux_horaire" type="number"/>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Heures par semaine</label>
              <input type="number" value={form.heures_semaine||''} onChange={e=>setForm(f=>({...f,heures_semaine:e.target.value}))} style={inputStyle}/>
            </div>
          </EditCard>

          <EditCard icon="🪪" bg="#e1f5ee" title="Identité">
            <Field label="Date de naissance" k="date_naissance" type="date"/>
            <Field label="Lieu de naissance" k="lieu_naissance"/>
            <Field label="Nationalité" k="nationalite"/>
            <Field label="N° sécurité sociale / AVS" k="num_securite_sociale"/>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>IBAN</label>
              <input type="text" value={form.iban||''} onChange={e=>setForm(f=>({...f,iban:e.target.value}))} style={inputStyle}/>
            </div>
          </EditCard>
        </>)}

      </div>
    </div>
  )
}
