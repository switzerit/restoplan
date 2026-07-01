import { useState } from 'react'

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}

const TYPE_CONTRAT_LABELS={CDI:'CDI',CDD:'CDD','Intérim':'Intérim',Extra:'Extra',Stage:'Stage',Apprentissage:'Apprentissage',Saisonnier:'Saisonnier',Freelance:'Freelance'}

function fmtDateFr(s){
  if(!s) return null
  try{
    const d=new Date(s+'T00:00:00')
    if(isNaN(d)) return s
    return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})
  }catch(e){return s}
}

export default function FicheEmploye({emp, groupe, present, isMobile, onBack, onEdit, features}){
  const [tab,setTab]=useState('apercu')

  if(!emp) return null

  const tabs=[
    {id:'apercu',l:'Vue d\'ensemble'},
    {id:'coord',l:'Coordonnées'},
    {id:'contrat',l:'Contrat'},
    {id:'identite',l:'Identité'},
  ]
  if(features?.conges) tabs.push({id:'conges',l:'Congés'})

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
        <button onClick={onEdit} style={{background:'var(--accent)',color:'#fff',border:'none',padding:isMobile?'8px 12px':'9px 16px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0}}>Modifier</button>
      </div>

      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:isMobile?'0 8px':'0 22px',display:'flex',gap:2,overflowX:'auto',scrollbarWidth:'none'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'12px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:tab===t.id?700:600,whiteSpace:'nowrap',color:tab===t.id?'var(--accent)':'var(--text2)',borderBottom:tab===t.id?'2px solid var(--accent)':'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>{t.l}</button>
        ))}
      </div>

      <div style={{padding:isMobile?14:22,display:'flex',flexDirection:'column',gap:14}}>

        {tab==='apercu'&&(
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14}}>
            <Card icon="📄" bg="#fbeaf0" title="Contrat">
              <Row label="Type" value={emp.type_contrat?(TYPE_CONTRAT_LABELS[emp.type_contrat]||emp.type_contrat):null}/>
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
            <Row label="Type de contrat" value={emp.type_contrat?(TYPE_CONTRAT_LABELS[emp.type_contrat]||emp.type_contrat):null}/>
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
            {(emp.conges_reportes||0)>0&&<Row label="Reportés" value={`${emp.conges_reportes} jours`}/>}
          </Card>
        )}

      </div>
    </div>
  )
}
