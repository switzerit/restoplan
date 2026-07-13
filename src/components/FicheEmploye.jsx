import { useState, useEffect } from 'react'
import PhoneField from './PhoneField'

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

const SECTIONS=[
  {id:'general',l:'Général',icon:'👤'},
  {id:'coord',l:'Coordonnées',icon:'📞'},
  {id:'contrat',l:'Contrat',icon:'📄'},
  {id:'identite',l:'Identité',icon:'🪪'},
]

export default function FicheEmploye({emp, groupe, groupes, present, isMobile, onBack, onSave, features, startEdit}){
  const [tab,setTab]=useState('apercu')
  const [edition,setEdition]=useState(!!startEdit)
  const [editSection,setEditSection]=useState('general')
  const [form,setForm]=useState({})
  const [saving,setSaving]=useState(false)

  useEffect(()=>{
    const f={}
    RH_KEYS.forEach(k=>{ f[k]=emp?.[k]??'' })
    setForm(f)
    setEdition(!!startEdit)
    setEditSection('general')
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
    setEditSection('general')
    setEdition(true)
  }

  function calcAnciennete(dateStr){
    if(!dateStr) return null
    const d=new Date(dateStr+'T00:00:00'); if(isNaN(d)) return null
    const now=new Date()
    let mois=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth())
    if(now.getDate()<d.getDate()) mois--
    if(mois<0) return null
    const ans=Math.floor(mois/12); const m=mois%12
    if(ans===0&&m===0) return "moins d'un mois"
    if(ans===0) return m+' mois'
    if(m===0) return ans+(ans>1?' ans':' an')
    return ans+(ans>1?' ans ':' an ')+m+' mois'
  }
  function calcCompletion(e){
    const champs=['telephone','adresse','code_postal','ville','pays','contact_urgence_nom','contact_urgence_tel','type_contrat','date_embauche','heures_semaine','fonction','date_naissance','lieu_naissance','nationalite','num_securite_sociale','iban']
    const remplis=champs.filter(k=>e[k]!==null&&e[k]!==undefined&&e[k]!=='').length
    return Math.round(remplis/champs.length*100)
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
  const Field=(label,k,type,full)=>(
    <div key={k} style={{gridColumn:full?'1 / -1':'auto'}}>
      <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:6}}>{label}</label>
      <input type={type||'text'} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={inputStyle}/>
    </div>
  )

  const gridStyle={display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}
  const sectionTitre={general:'Informations générales',coord:'Coordonnées',contrat:'Contrat',identite:'Identité'}[editSection]

  return (
    <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',display:'flex',flexDirection:'column'}}>

      {/* En-tête */}
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
        <button onClick={startEdition} style={{background:'var(--accent)',color:'#fff',border:'none',padding:isMobile?'8px 12px':'9px 16px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0}}>Modifier</button>
      </div>

      {/* Onglets (lecture) */}
      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:isMobile?'0 8px':'0 22px',display:'flex',gap:2,overflowX:'auto',scrollbarWidth:'none'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'12px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:tab===t.id?700:600,whiteSpace:'nowrap',color:tab===t.id?'var(--accent)':'var(--text2)',borderBottom:tab===t.id?'2px solid var(--accent)':'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>{t.l}</button>
        ))}
      </div>

      {/* Contenu lecture */}
      <div style={{padding:isMobile?14:22,display:'flex',flexDirection:'column',gap:14}}>
        {tab==='apercu'&&(
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:14,padding:isMobile?'14px 16px':'16px 20px',display:'flex',gap:isMobile?18:28,flexWrap:'wrap',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Contrat</div>
                <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{emp.type_contrat||'—'}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Depuis</div>
                <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{fmtDateFr(emp.date_embauche)||'—'}</div>
              </div>
              {calcAnciennete(emp.date_embauche)&&(
                <div>
                  <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Ancienneté</div>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{calcAnciennete(emp.date_embauche)}</div>
                </div>
              )}
              <div style={{marginLeft:isMobile?0:'auto',textAlign:isMobile?'left':'right'}}>
                <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:5}}>Dossier complété</div>
                <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:isMobile?'flex-start':'flex-end'}}>
                  <div style={{width:90,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}><div style={{width:calcCompletion(emp)+'%',height:'100%',background:'var(--accent)'}}/></div>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--text2)'}}>{calcCompletion(emp)}%</span>
                </div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14}}>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}><div style={{width:32,height:32,borderRadius:9,background:'#fbeaf0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📄</div><span style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Contrat</span></div>
                <Row label="Type" value={emp.type_contrat}/>
                <Row label="Fonction" value={emp.fonction}/>
                <Row label="Heures / semaine" value={emp.heures_semaine?`${emp.heures_semaine}h`:null}/>
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}><div style={{width:32,height:32,borderRadius:9,background:'#eeedfe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📞</div><span style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Coordonnées</span></div>
                <Row label="Téléphone" value={emp.telephone}/>
                <Row label="Ville" value={emp.ville}/>
                <Row label="Urgence" value={emp.contact_urgence_nom}/>
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}><div style={{width:32,height:32,borderRadius:9,background:'#e1f5ee',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🪪</div><span style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Identité</span></div>
                <Row label="Naissance" value={fmtDateFr(emp.date_naissance)}/>
                <Row label="Nationalité" value={emp.nationalite}/>
              </div>
              {features?.conges&&(
                <div style={{background:'linear-gradient(135deg,#fbeaf0,#fcf3f5)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 18px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:16}}><div style={{width:32,height:32,borderRadius:9,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🌴</div><span style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Congés</span></div>
                  <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:10}}><span style={{fontSize:26,fontWeight:800,color:'var(--text)'}}>{(emp.conges_total||0)-(emp.conges_pris||0)}</span><span style={{fontSize:14,color:'var(--text2)'}}>/ {emp.conges_total||0} jours restants</span></div>
                  <div style={{width:'100%',height:8,background:'rgba(0,0,0,0.06)',borderRadius:4,overflow:'hidden',marginBottom:6}}><div style={{width:((emp.conges_total||0)?Math.round(((emp.conges_total-(emp.conges_pris||0))/emp.conges_total)*100):0)+'%',height:'100%',background:'var(--accent)',borderRadius:4}}/></div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{emp.conges_pris||0} jours pris cette année</div>
                </div>
              )}
            </div>
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
      </div>

      {/* Modal édition */}
      {edition&&(
        <div onClick={()=>setEdition(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:isMobile?12:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:18,width:isMobile?'100%':620,maxWidth:'100%',maxHeight:'90vh',boxShadow:'0 12px 48px rgba(0,0,0,.18)',overflow:'hidden',display:'flex',flexDirection:isMobile?'column':'row'}}>

            {/* Sidebar desktop / onglets mobile */}
            {!isMobile?(
              <div style={{width:180,background:'var(--bg)',borderRight:'1px solid var(--border)',padding:'22px 0',flexShrink:0,display:'flex',flexDirection:'column'}}>
                <div style={{padding:'0 20px 18px',borderBottom:'1px solid var(--border)',marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'var(--accent-bg)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,marginBottom:11}}>{ini(form.prenom,form.nom)}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--text)',lineHeight:1.3}}>{form.prenom} {form.nom}</div>
                  {groupe&&<div style={{fontSize:12,color:'var(--text2)',marginTop:3,display:'flex',alignItems:'center',gap:5}}><span style={{width:7,height:7,borderRadius:'50%',background:groupe.couleur}}/>{groupe.nom}</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:2,padding:'0 12px'}}>
                  {SECTIONS.map(s=>(
                    <button key={s.id} onClick={()=>setEditSection(s.id)} style={{padding:'9px 12px',fontSize:13,fontWeight:editSection===s.id?700:600,color:editSection===s.id?'var(--accent)':'var(--text2)',background:editSection===s.id?'var(--surface)':'transparent',border:'none',borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',gap:9,textAlign:'left'}}><span style={{fontSize:15}}>{s.icon}</span>{s.l}</button>
                  ))}
                </div>
              </div>
            ):(
              <div style={{display:'flex',gap:2,padding:'12px 12px 0',overflowX:'auto',scrollbarWidth:'none',borderBottom:'1px solid var(--border)'}}>
                {SECTIONS.map(s=>(
                  <button key={s.id} onClick={()=>setEditSection(s.id)} style={{padding:'8px 12px',fontSize:12,fontWeight:editSection===s.id?700:600,whiteSpace:'nowrap',color:editSection===s.id?'var(--accent)':'var(--text2)',background:'transparent',border:'none',borderBottom:editSection===s.id?'2px solid var(--accent)':'2px solid transparent',cursor:'pointer',marginBottom:-1}}>{s.l}</button>
                ))}
              </div>
            )}

            {/* Contenu droite */}
            <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
              <div style={{padding:isMobile?'16px 18px 0':'20px 24px 0',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{sectionTitre}</div>
                <button onClick={()=>setEdition(false)} style={{width:30,height:30,borderRadius:8,border:'none',background:'var(--bg)',cursor:'pointer',fontSize:16,color:'var(--text2)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>

              <div style={{padding:isMobile?'16px 18px':'18px 24px',overflowY:'auto',flex:1,scrollbarWidth:'none'}}>
                {editSection==='general'&&(
                  <div style={gridStyle}>
                    {Field('Prénom','prenom')}
                    {Field('Nom','nom')}
                    {Field('Email','email','email',true)}
                    {Field('Fonction / poste','fonction')}
                    {groupes&&groupes.length>0&&(
                      <div>
                        <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:6}}>Groupe</label>
                        <select value={form.groupe_id||''} onChange={e=>setForm(f=>({...f,groupe_id:e.target.value||null}))} style={inputStyle}>
                          <option value="">Sans groupe</option>
                          {groupes.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}
                {editSection==='coord'&&(
                  <div style={{display:'flex',flexDirection:'column',gap:20}}>
                    <div>
                      <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:7}}>Téléphone</label>
                      <PhoneField value={form.telephone||''} onChange={v=>setForm(f=>({...f,telephone:v}))}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px 18px'}}>
                      <div>
                        <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:7}}>Code postal</label>
                        <input value={form.code_postal||''} onChange={e=>setForm(f=>({...f,code_postal:e.target.value}))} style={inputStyle}/>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:7}}>Ville</label>
                        <input value={form.ville||''} onChange={e=>setForm(f=>({...f,ville:e.target.value}))} style={inputStyle}/>
                      </div>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:7}}>Adresse</label>
                      <input value={form.adresse||''} onChange={e=>setForm(f=>({...f,adresse:e.target.value}))} style={inputStyle}/>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:7}}>Pays</label>
                      <input value={form.pays||''} onChange={e=>setForm(f=>({...f,pays:e.target.value}))} style={inputStyle}/>
                    </div>
                    <div style={{borderTop:'1px solid var(--border)',paddingTop:18}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--text3)',marginBottom:14}}>Contact d'urgence</div>
                      <div style={{display:'flex',flexDirection:'column',gap:16}}>
                        <div>
                          <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:7}}>Nom</label>
                          <input value={form.contact_urgence_nom||''} onChange={e=>setForm(f=>({...f,contact_urgence_nom:e.target.value}))} style={inputStyle}/>
                        </div>
                        <div>
                          <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:7}}>Téléphone</label>
                          <PhoneField value={form.contact_urgence_tel||''} onChange={v=>setForm(f=>({...f,contact_urgence_tel:v}))}/>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {editSection==='contrat'&&(
                  <div style={gridStyle}>
                    <div>
                      <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:6}}>Type de contrat</label>
                      <select value={form.type_contrat||''} onChange={e=>setForm(f=>({...f,type_contrat:e.target.value}))} style={inputStyle}>
                        <option value="">Choisir</option>
                        {TYPES_CONTRAT.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    {Field('Fonction','fonction')}
                    {Field('Date d\'embauche','date_embauche','date')}
                    {Field('Date de fin (CDD)','date_fin_contrat','date')}
                    {Field('Heures / semaine','heures_semaine','number')}
                  </div>
                )}
                {editSection==='identite'&&(
                  <div style={gridStyle}>
                    {Field('Date de naissance','date_naissance','date')}
                    {Field('Lieu de naissance','lieu_naissance')}
                    {Field('Nationalité','nationalite')}
                    {Field('N° AVS','num_securite_sociale')}
                    {Field('IBAN','iban',null,true)}
                  </div>
                )}
              </div>

              <div style={{padding:isMobile?'14px 18px':'15px 24px',background:'var(--bg)',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
                {!isMobile&&<span style={{fontSize:12,color:'var(--text3)'}}>Modifie une section à la fois</span>}
                <div style={{display:'flex',gap:10,marginLeft:'auto'}}>
                  <button onClick={()=>setEdition(false)} style={{padding:'9px 16px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',fontSize:13,fontWeight:700,cursor:'pointer',color:'var(--text2)'}}>Annuler</button>
                  <button onClick={handleSave} disabled={saving} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',opacity:saving?0.6:1}}>{saving?'...':'Enregistrer'}</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
