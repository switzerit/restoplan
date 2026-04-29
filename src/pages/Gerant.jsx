import { useEffect, useState } from 'react'
import { generatePDF } from '../lib/exportPDF'
import { supabase } from '../lib/supabase'

const COLORS = [
  {bg:'#e8f2fd',color:'#0051a8'},{bg:'#f0faf3',color:'#1a6b35'},
  {bg:'#fff8ee',color:'#8a4a00'},{bg:'#f0f0fc',color:'#3a3880'},
  {bg:'#fff2f1',color:'#b02020'},{bg:'#fdf0f8',color:'#8a2060'},
]
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const POSTES = ['cuisine','salle','bar']

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}
function getMonday(d){const dt=new Date(d);const day=dt.getDay();const diff=dt.getDate()-day+(day===0?-6:1);return new Date(dt.setDate(diff))}
function addDays(d,n){const dt=new Date(d);dt.setDate(dt.getDate()+n);return dt}
function fmtDate(d){return d.toISOString().split('T')[0]}
function fmtLabel(d){return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}

export default function Gerant() {
  const [view, setView] = useState('planning')
  const [restaurants, setRestaurants] = useState([])
  const [currentResto, setCurrentResto] = useState(null)
  const [employes, setEmployes] = useState([])
  const [shifts, setShifts] = useState([])
  const [pointages, setPointages] = useState([])
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [shiftModal, setShiftModal] = useState(null)
  const [empModal, setEmpModal] = useState(false)
  const [correctModal, setCorrectModal] = useState(null)
  const [restoModal, setRestoModal] = useState(false)
  const [form, setForm] = useState({poste:'cuisine',heure_debut:'09:00',heure_fin:'17:00'})
  const [empForm, setEmpForm] = useState({prenom:'',nom:'',email:'',role:'Serveur / Serveuse',password:''})
  const [restoForm, setRestoForm] = useState({nom:'',adresse:''})
  const [correctForm, setCorrectForm] = useState({heure_arrivee:'',heure_depart:''})
  const [toast, setToast] = useState('')
  const [showRestoSwitch, setShowRestoSwitch] = useState(false)
  const [exportModal, setExportModal] = useState(false)
  const [exportForm, setExportForm] = useState({debut:'',fin:''})
  const today = fmtDate(new Date())

  useEffect(()=>{loadRestaurants()},[])
  useEffect(()=>{if(currentResto){loadAll()}},[currentResto])
  useEffect(()=>{if(currentResto){loadShifts()}},[weekStart,currentResto])

  async function loadRestaurants(){
    const {data} = await supabase.from('restaurants').select('*').eq('actif',true).order('nom')
    setRestaurants(data||[])
    if(data?.length>0) setCurrentResto(data[0])
  }

  async function loadAll(){
    const {data:e} = await supabase.from('employes').select('*').eq('actif',true).eq('restaurant_id',currentResto.id).order('prenom')
    setEmployes(e||[])
    const {data:p} = await supabase.from('pointages').select('*').eq('date',today).eq('restaurant_id',currentResto.id)
    setPointages(p||[])
    loadShifts()
  }

  async function loadShifts(){
    const from = fmtDate(weekStart)
    const to = fmtDate(addDays(weekStart,6))
    const {data} = await supabase.from('shifts').select('*').eq('restaurant_id',currentResto.id).gte('date',from).lte('date',to)
    setShifts(data||[])
  }

  function getShift(empId,dayIdx){
    const d = fmtDate(addDays(weekStart,dayIdx))
    return shifts.find(s=>s.employe_id===empId && s.date===d)
  }

  function getPointage(empId){return pointages.find(p=>p.employe_id===empId)}
  function isPresent(empId){const p=getPointage(empId);return p&&p.heure_arrivee&&!p.heure_depart}

  async function saveShift(){
    const d = fmtDate(addDays(weekStart,shiftModal.dayIdx))
    const existing = getShift(shiftModal.empId,shiftModal.dayIdx)
    if(existing){
      await supabase.from('shifts').update({poste:form.poste,heure_debut:form.heure_debut,heure_fin:form.heure_fin}).eq('id',existing.id)
    } else {
      await supabase.from('shifts').insert({employe_id:shiftModal.empId,date:d,poste:form.poste,heure_debut:form.heure_debut,heure_fin:form.heure_fin,restaurant_id:currentResto.id})
    }
    setShiftModal(null);loadShifts();showToast('Shift enregistré')
  }

  async function deleteShift(){
    const existing = getShift(shiftModal.empId,shiftModal.dayIdx)
    if(existing) await supabase.from('shifts').delete().eq('id',existing.id)
    setShiftModal(null);loadShifts();showToast('Shift supprimé')
  }

  async function addEmploye(){
    if(!empForm.prenom||!empForm.nom||!empForm.email){showToast('Remplis tous les champs');return}
    const {error} = await supabase.from("employes").insert({prenom:empForm.prenom,nom:empForm.nom,email:empForm.email,role:empForm.role,restaurant_id:currentResto.id})
    if(error){showToast("Erreur: "+error.message);return}
    setEmpModal(false);setEmpForm({prenom:'',nom:'',email:'',role:'Serveur / Serveuse',password:''})
    loadAll();showToast(empForm.prenom+' ajouté !')
  }

  async function addRestaurant(){
    if(!restoForm.nom){showToast('Entre un nom');return}
    const {data} = await supabase.from('restaurants').insert(restoForm).select()
    setRestoModal(false);setRestoForm({nom:'',adresse:''})
    await loadRestaurants()
    if(data?.[0]) setCurrentResto(data[0])
    showToast('Restaurant ajouté !')
  }

  async function supprimerEmploye(empId){
    await supabase.from('shifts').delete().eq('employe_id',empId)
    await supabase.from('pointages').delete().eq('employe_id',empId)
    await supabase.from('employes').delete().eq('id',empId)
    loadAll()
    showToast('Employé supprimé')
  }

  async function doExport(){
    showToast('Génération du PDF...')
    const {data:allShifts} = await supabase.from('shifts').select('*').eq('restaurant_id',currentResto.id).gte('date',exportForm.debut).lte('date',exportForm.fin)
    const {data:allPointages} = await supabase.from('pointages').select('*').eq('restaurant_id',currentResto.id).gte('date',exportForm.debut).lte('date',exportForm.fin)
    generatePDF({
      restaurant:currentResto,
      employes,
      shifts:allShifts||[],
      pointages:allPointages||[],
      dateDebut:exportForm.debut,
      dateFin:exportForm.fin
    })
    setExportModal(false)
    showToast('PDF téléchargé !')
  }

  async function saveCorrection(){
    const p = getPointage(correctModal.empId)
    if(!p){
      await supabase.from('pointages').insert({employe_id:correctModal.empId,date:today,heure_arrivee:correctForm.heure_arrivee||null,heure_depart:correctForm.heure_depart||null,restaurant_id:currentResto.id})
    } else {
      await supabase.from('pointages').update({heure_arrivee:correctForm.heure_arrivee||null,heure_depart:correctForm.heure_depart||null}).eq('id',p.id)
    }
    setCorrectModal(null);loadAll();showToast('Pointage corrigé')
  }

  async function supprimerPointage(){
    const p = getPointage(correctModal.empId)
    if(p) await supabase.from('pointages').delete().eq('id',p.id)
    setCorrectModal(null);loadAll();showToast('Pointage supprimé')
  }

  async function deconnexion(){
    await supabase.auth.signOut()
    window.location.href='/login'
  }

  function openShift(empId,dayIdx){
    const existing = getShift(empId,dayIdx)
    setForm(existing?{poste:existing.poste,heure_debut:existing.heure_debut.slice(0,5),heure_fin:existing.heure_fin.slice(0,5)}:{poste:'cuisine',heure_debut:'09:00',heure_fin:'17:00'})
    setShiftModal({empId,dayIdx,existing:!!existing})
  }

  function openCorrection(emp){
    const p = getPointage(emp.id)
    setCorrectForm({heure_arrivee:p?.heure_arrivee?.slice(0,5)||'',heure_depart:p?.heure_depart?.slice(0,5)||''})
    setCorrectModal({empId:emp.id,nom:emp.prenom+' '+emp.nom})
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),2600)}

  const presentCount = employes.filter(e=>isPresent(e.id)).length
  const weekDays = Array.from({length:7},(_,i)=>addDays(weekStart,i))
  const weekLabel = `${fmtLabel(weekDays[0])} – ${fmtLabel(weekDays[6])}`
  const shiftColors = {cuisine:{bg:'#f0faf3',color:'#1a6b35',border:'#b8e8c8'},salle:{bg:'#e8f2fd',color:'#004aad',border:'#b3d4f7'},bar:{bg:'#fff8ee',color:'#8a4a00',border:'#ffd99a'}}

  if(!currentResto) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'var(--text2)'}}>Chargement...</div>

  const viewTitle = view==='planning'?'Planning':view==='presences'?'Présences du jour':view==='employes'?'Équipe':'Paramètres'

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'var(--font)',overflow:'hidden'}}>

      {/* SIDEBAR */}
      <div style={{width:220,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'18px 10px',flexShrink:0}}>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 8px',marginBottom:8}}>
            <div style={{width:32,height:32,background:'var(--accent)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🍽️</div>
            <div><div style={{fontSize:15,fontWeight:800}}>RestoPlan</div><div style={{fontSize:11,color:'var(--text3)'}}>Dashboard gérant</div></div>
          </div>
          <button onClick={()=>setShowRestoSwitch(!showRestoSwitch)} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'10px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',cursor:'pointer',textAlign:'left'}}>
            <div style={{width:28,height:28,borderRadius:7,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🏪</div>
            <div style={{flex:1,overflow:'hidden'}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{currentResto.nom}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>Changer de restaurant</div>
            </div>
            <span style={{color:'var(--text3)',fontSize:12}}>{showRestoSwitch?'▲':'▼'}</span>
          </button>
          {showRestoSwitch && (
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,marginTop:4,overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,.08)'}}>
              {restaurants.map(r=>(
                <button key={r.id} onClick={()=>{setCurrentResto(r);setShowRestoSwitch(false)}} style={{width:'100%',padding:'10px 12px',border:'none',background:r.id===currentResto.id?'var(--accent-bg)':'transparent',cursor:'pointer',textAlign:'left',fontSize:13,fontWeight:600,color:r.id===currentResto.id?'var(--accent)':'var(--text)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                  {r.id===currentResto.id&&<span style={{color:'var(--accent)'}}>✓</span>}<span>{r.nom}</span>
                </button>
              ))}
              <button onClick={()=>{setShowRestoSwitch(false);setRestoModal(true)}} style={{width:'100%',padding:'10px 12px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left',fontSize:13,fontWeight:600,color:'var(--accent)'}}>+ Ajouter un restaurant</button>
            </div>
          )}
        </div>

        {[
          {id:'planning',icon:'📅',label:'Planning'},
          {id:'presences',icon:'👥',label:'Présences',badge:presentCount},
          {id:'employes',icon:'👤',label:'Équipe'},
          {id:'parametres',icon:'⚙️',label:'Paramètres'},
        ].map(item=>(
          <button key={item.id} onClick={()=>setView(item.id)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,border:'none',width:'100%',textAlign:'left',background:view===item.id?'var(--accent-bg)':'transparent',color:view===item.id?'var(--accent)':'var(--text2)',marginBottom:2}}>
            {item.icon} {item.label}
            {item.badge>0&&<span style={{marginLeft:'auto',background:'var(--green)',color:'white',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:20}}>{item.badge}</span>}
          </button>
        ))}

        <div style={{marginTop:'auto',paddingTop:12,borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:9,padding:'8px 10px'}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'var(--accent-bg)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>GM</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>Gérant</div><div style={{fontSize:10,color:'var(--text3)'}}>Admin • {restaurants.length} resto{restaurants.length>1?'s':''}</div></div>
            <button onClick={deconnexion} style={{width:28,height:28,borderRadius:8,border:'none',background:'var(--red-bg)',color:'var(--red)',cursor:'pointer',fontSize:16}}>↩</button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>

        {/* TOPBAR */}
        <div style={{height:56,background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 20px',gap:10}}>
          <span style={{fontSize:16,fontWeight:800,flex:1}}>
            {viewTitle}
            <span style={{fontSize:12,fontWeight:400,color:'var(--text3)',marginLeft:8}}>{currentResto.nom}</span>
          </span>
          {view==='planning'&&<>
            <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:3}}>
              <button onClick={()=>setWeekStart(addDays(weekStart,-7))} style={{width:26,height:26,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',fontSize:14,color:'var(--text2)'}}>‹</button>
              <span style={{fontSize:13,fontWeight:600,padding:'0 8px'}}>{weekLabel}</span>
              <button onClick={()=>setWeekStart(addDays(weekStart,7))} style={{width:26,height:26,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',fontSize:14,color:'var(--text2)'}}>›</button>
            </div>
            <button onClick={()=>showToast('Planning publié — équipe notifiée')} style={{height:34,padding:'0 14px',background:'var(--accent)',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Publier</button>
          </>}
          {view==='presences'&&<button onClick={()=>setExportModal(true)} style={{height:34,padding:'0 14px',background:'var(--green)',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>📄 Exporter PDF</button>}
          {view==='employes'&&<button onClick={()=>setEmpModal(true)} style={{height:34,padding:'0 14px',background:'var(--accent)',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Ajouter</button>}
        </div>

        {/* VUE PLANNING */}
        {view==='planning'&&(
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <div style={{background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'150px repeat(7,1fr)',borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
                <div style={{padding:'9px 12px',fontSize:11,fontWeight:700,color:'var(--text2)'}}>Employé</div>
                {weekDays.map((d,i)=>{
                  const isToday=fmtDate(d)===today
                  return <div key={i} style={{padding:'9px 8px',fontSize:11,fontWeight:700,color:isToday?'var(--accent)':'var(--text2)',textAlign:'center'}}>{DAYS[i]}<br/><span style={{fontSize:10,opacity:.7}}>{fmtLabel(d)}</span></div>
                })}
              </div>
              {employes.length===0&&<div style={{padding:40,textAlign:'center',color:'var(--text3)',fontSize:14}}>Aucun employé — <button onClick={()=>setEmpModal(true)} style={{color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600,fontSize:14}}>en ajouter un</button></div>}
              {employes.map((emp,ei)=>{
                const c=COLORS[ei%COLORS.length]
                return (
                  <div key={emp.id} style={{display:'grid',gridTemplateColumns:'150px repeat(7,1fr)',borderBottom:'1px solid var(--border)'}}>
                    <div style={{padding:'10px 12px',display:'flex',alignItems:'center',gap:8,borderRight:'1px solid var(--border)',background:'var(--surface)'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{ini(emp.prenom,emp.nom)}</div>
                      <div><div style={{fontSize:12,fontWeight:700}}>{emp.prenom}</div><div style={{fontSize:10,color:'var(--text3)'}}>{emp.role}</div></div>
                    </div>
                    {weekDays.map((d,di)=>{
                      const sh=getShift(emp.id,di)
                      const isToday=fmtDate(d)===today
                      const sc=sh?shiftColors[sh.poste]:null
                      return (
                        <div key={di} onClick={()=>openShift(emp.id,di)} style={{padding:4,borderRight:'1px solid var(--border)',display:'flex',alignItems:'center',minHeight:56,cursor:'pointer',background:isToday?'rgba(0,113,227,.02)':'transparent'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                        onMouseLeave={e=>e.currentTarget.style.background=isToday?'rgba(0,113,227,.02)':'transparent'}>
                          {sh?<div style={{borderRadius:7,padding:'5px 7px',width:'100%',fontSize:10,fontWeight:700,background:sc.bg,color:sc.color,border:`1.5px solid ${sc.border}`}}><div>{sh.poste[0].toUpperCase()+sh.poste.slice(1)}</div><div style={{fontWeight:400,opacity:.75,fontSize:9}}>{sh.heure_debut.slice(0,5)}–{sh.heure_fin.slice(0,5)}</div></div>
                          :<div style={{width:'100%',height:30,border:'1.5px dashed var(--border2)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:18}}>+</div>}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VUE PRESENCES */}
        {view==='presences'&&(
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
              {[{n:presentCount,l:'Présents',c:'var(--green)'},{n:employes.length-presentCount,l:'Absents',c:'var(--text)'},{n:pointages.filter(p=>p.heure_depart).length,l:'Partis',c:'var(--text2)'},{n:0,l:'Retards',c:'var(--orange)'}].map((s,i)=>(
                <div key={i} style={{background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',padding:'14px 16px'}}>
                  <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.n}</div>
                  <div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {employes.map((emp,i)=>{
                const c=COLORS[i%COLORS.length]
                const p=getPointage(emp.id)
                const present=p&&p.heure_arrivee&&!p.heure_depart
                const parti=p&&p.heure_depart
                return (
                  <div key={emp.id} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10}}>
                    <div style={{width:9,height:9,borderRadius:'50%',background:present?'var(--green)':parti?'var(--orange)':'var(--border2)',flexShrink:0,boxShadow:present?'0 0 0 3px rgba(52,199,89,.15)':'none'}}></div>
                    <div style={{width:34,height:34,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800}}>{ini(emp.prenom,emp.nom)}</div>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{emp.prenom} {emp.nom}</div><div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div></div>
                    {p?.heure_arrivee&&<span style={{fontSize:12,color:'var(--text2)',fontWeight:500}}>Arrivée {p.heure_arrivee.slice(0,5)}</span>}
                    {p?.heure_depart&&<span style={{fontSize:12,color:'var(--text2)',fontWeight:500}}>Départ {p.heure_depart.slice(0,5)}</span>}
                    <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20,background:present?'var(--green-bg)':parti?'var(--orange-bg)':'var(--bg)',color:present?'#1a6b35':parti?'#8a4a00':'var(--text3)'}}>{present?'Présent':parti?'Parti':'Absent'}</span>
                    <button onClick={()=>openCorrection(emp)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer'}}>✏️ Corriger</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VUE EQUIPE */}
        {view==='employes'&&(
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
              {employes.map((emp,i)=>{
                const c=COLORS[i%COLORS.length]
                const sc=shifts.filter(s=>s.employe_id===emp.id).length
                return (
                  <div key={emp.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:18,cursor:'pointer',transition:'all .18s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.07)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
                    <div style={{width:48,height:48,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,marginBottom:12}}>{ini(emp.prenom,emp.nom)}</div>
                    <div style={{fontSize:14,fontWeight:800}}>{emp.prenom} {emp.nom}</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:3}}>{emp.role}</div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                      <span style={{fontSize:12,color:'var(--text2)'}}>{sc} shift{sc>1?'s':''}/sem</span>
                      <button onClick={(e)=>{e.stopPropagation();supprimerEmploye(emp.id)}} style={{width:24,height:24,borderRadius:6,border:'none',background:'var(--red-bg)',color:'var(--red)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                      <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20,background:isPresent(emp.id)?'var(--green-bg)':'var(--bg)',color:isPresent(emp.id)?'#1a6b35':'var(--text3)'}}>{isPresent(emp.id)?'Présent':'—'}</span>
                    </div>
                  </div>
                )
              })}
              <div onClick={()=>setEmpModal(true)} style={{background:'transparent',border:'2px dashed var(--border2)',borderRadius:14,padding:18,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,minHeight:150,transition:'all .18s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--accent-bg)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.background='transparent'}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:'var(--text3)'}}>+</div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text2)'}}>Ajouter un employé</div>
              </div>
            </div>
          </div>
        )}

        {/* VUE PARAMETRES */}
        {view==='parametres'&&(
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <div style={{maxWidth:500}}>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',marginBottom:16}}>
                <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
                  <div style={{fontSize:14,fontWeight:800}}>Code PIN de la borne</div>
                  <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>Modifiez le PIN d'accès à la tablette de badgeage</div>
                </div>
                <div style={{padding:'20px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px',background:'var(--bg)',borderRadius:12,marginBottom:14}}>
                    <div style={{fontSize:24}}>🏪</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700}}>{currentResto.nom}</div>
                      <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>PIN actuel : {currentResto.pin_borne}</div>
                    </div>
                  </div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Nouveau PIN (4 chiffres)</label>
                  <div style={{display:'flex',gap:8}}>
                    <input type='number' placeholder='1234' id='new-pin-input' style={{flex:1,padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:18,color:'var(--text)',outline:'none',textAlign:'center'}}/>
                    <button onClick={async()=>{
                      const val=document.getElementById('new-pin-input').value.slice(0,4)
                      if(val.length!==4||isNaN(val)){showToast('PIN = 4 chiffres');return}
                      await supabase.from('restaurants').update({pin_borne:val}).eq('id',currentResto.id)
                      setCurrentResto({...currentResto,pin_borne:val})
                      document.getElementById('new-pin-input').value=''
                      showToast('PIN modifié !')
                    }} style={{padding:'10px 18px',borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Modifier</button>
                  </div>
                  <div style={{marginTop:12,padding:'10px 14px',background:'var(--orange-bg)',borderRadius:10,fontSize:12,color:'#8a4a00'}}>
                    ⚠️ La tablette demandera le nouveau PIN au prochain déverrouillage
                  </div>
                </div>
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
                <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
                  <div style={{fontSize:14,fontWeight:800}}>Informations du restaurant</div>
                </div>
                <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:12}}>
                  <div>
                    <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Nom</label>
                    <input defaultValue={currentResto.nom} id='resto-nom' style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Adresse</label>
                    <input defaultValue={currentResto.adresse||''} id='resto-adresse' style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
                  </div>
                  <button onClick={async()=>{
                    const nom=document.getElementById('resto-nom').value
                    const adresse=document.getElementById('resto-adresse').value
                    await supabase.from('restaurants').update({nom,adresse}).eq('id',currentResto.id)
                    setCurrentResto({...currentResto,nom,adresse})
                    showToast('Informations mises à jour')
                  }} style={{height:40,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      {/* FIN MAIN */}

      {/* MODALS */}
      {correctModal&&(
        <div onClick={()=>setCorrectModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:340,boxShadow:'0 8px 40px rgba(0,0,0,.14)'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Corriger le pointage</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>{correctModal.nom} — {new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Heure d'arrivée</label>
                <input type="time" value={correctForm.heure_arrivee} onChange={e=>setCorrectForm(f=>({...f,heure_arrivee:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Heure de départ</label>
                <input type="time" value={correctForm.heure_depart} onChange={e=>setCorrectForm(f=>({...f,heure_depart:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            </div>
            <div style={{padding:'10px 12px',background:'var(--accent-bg)',borderRadius:10,marginBottom:16,fontSize:12,color:'var(--accent)'}}>💡 Laisse vide si pas encore arrivé ou parti</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setCorrectModal(null)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={saveCorrection} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
            </div>
            <button onClick={supprimerPointage} style={{width:'100%',padding:9,borderRadius:10,border:'none',background:'var(--red-bg)',color:'var(--red)',fontSize:13,fontWeight:700,cursor:'pointer',marginTop:8}}>Supprimer ce pointage</button>
          </div>
        </div>
      )}

      {shiftModal&&(
        <div onClick={()=>setShiftModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:340,boxShadow:'0 8px 40px rgba(0,0,0,.14)'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>{shiftModal.existing?'Modifier':'Nouveau'} shift</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>{employes.find(e=>e.id===shiftModal.empId)?.prenom} — {DAYS[shiftModal.dayIdx]} {fmtLabel(addDays(weekStart,shiftModal.dayIdx))}</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Poste</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                {POSTES.map(p=>{const sc=shiftColors[p];const sel=form.poste===p;return <button key={p} onClick={()=>setForm(f=>({...f,poste:p}))} style={{padding:'9px 4px',borderRadius:8,border:`2px solid ${sel?sc.border:'var(--border)'}`,background:sel?sc.bg:'var(--bg)',cursor:'pointer',fontSize:11,fontWeight:700,color:sel?sc.color:'var(--text2)'}}>{p[0].toUpperCase()+p.slice(1)}</button>})}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {['heure_debut','heure_fin'].map(f=>(
                <div key={f}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>{f==='heure_debut'?'Début':'Fin'}</label>
                  <input type="time" value={form[f]} onChange={e=>setForm(ff=>({...ff,[f]:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShiftModal(null)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={saveShift} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
            </div>
            {shiftModal.existing&&<button onClick={deleteShift} style={{width:'100%',padding:9,borderRadius:10,border:'none',background:'var(--red-bg)',color:'var(--red)',fontSize:13,fontWeight:700,cursor:'pointer',marginTop:8}}>Supprimer ce shift</button>}
          </div>
        </div>
      )}

      {empModal&&(
        <div onClick={()=>setEmpModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:340,boxShadow:'0 8px 40px rgba(0,0,0,.14)'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Nouvel employé</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Pour {currentResto.nom}</div>
            {[{f:'prenom',l:'Prénom',t:'text',ph:'Sophie'},{f:'nom',l:'Nom',t:'text',ph:'Martin'},{f:'email',l:'Email',t:'email',ph:'sophie@bistrot.fr'}].map(({f,l,t,ph})=>(
              <div key={f} style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>{l}</label>
                <input type={t} placeholder={ph} value={empForm[f]} onChange={e=>setEmpForm(ff=>({...ff,[f]:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            ))}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Poste</label>
              <select value={empForm.role} onChange={e=>setEmpForm(f=>({...f,role:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}>
                {['Chef de cuisine','Second cuisine','Commis cuisine','Serveur / Serveuse','Chef de rang','Barman / Barmaid','Plongeur'].map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setEmpModal(false)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={addEmploye} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {restoModal&&(
        <div onClick={()=>setRestoModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:340,boxShadow:'0 8px 40px rgba(0,0,0,.14)'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Nouveau restaurant</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Il sera ajouté à votre compte</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Nom</label>
              <input type="text" placeholder="ex. Le Bistrot du Vieux Port" value={restoForm.nom} onChange={e=>setRestoForm(f=>({...f,nom:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Adresse</label>
              <input type="text" placeholder="ex. 12 rue du Port, Marseille" value={restoForm.adresse} onChange={e=>setRestoForm(f=>({...f,adresse:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setRestoModal(false)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={addRestaurant} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Créer</button>
            </div>
          </div>
        </div>
      )}

      
      {exportModal&&(
        <div onClick={()=>setExportModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:380,boxShadow:'0 8px 40px rgba(0,0,0,.14)'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Exporter le rapport PDF</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>{currentResto.nom}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Date de début</label>
                <input type='date' value={exportForm.debut} onChange={e=>setExportForm(f=>({...f,debut:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Date de fin</label>
                <input type='date' value={exportForm.fin} onChange={e=>setExportForm(f=>({...f,fin:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              {[
                {l:'Ce mois',d:new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0],f:new Date(new Date().getFullYear(),new Date().getMonth()+1,0).toISOString().split('T')[0]},
                {l:'Mois dernier',d:new Date(new Date().getFullYear(),new Date().getMonth()-1,1).toISOString().split('T')[0],f:new Date(new Date().getFullYear(),new Date().getMonth(),0).toISOString().split('T')[0]},
                {l:'Cette semaine',d:new Date(new Date().setDate(new Date().getDate()-new Date().getDay()+1)).toISOString().split('T')[0],f:new Date(new Date().setDate(new Date().getDate()-new Date().getDay()+7)).toISOString().split('T')[0]},
              ].map(p=>(
                <button key={p.l} onClick={()=>setExportForm({debut:p.d,fin:p.f})} style={{flex:1,padding:'6px 4px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',fontSize:11,fontWeight:600,cursor:'pointer',color:'var(--text2)'}}>{p.l}</button>
              ))}
            </div>
            <div style={{padding:'10px 14px',background:'var(--accent-bg)',borderRadius:10,marginBottom:16,fontSize:12,color:'var(--accent)'}}>
              📄 Le PDF inclura un tableau récapitulatif + le détail des pointages par employé
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setExportModal(false)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={doExport} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Générer le PDF</button>
            </div>
          </div>
        </div>
      )}
{toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:'var(--text)',color:'white',padding:'9px 20px',borderRadius:20,fontSize:13,fontWeight:600,zIndex:300,whiteSpace:'nowrap'}}>{toast}</div>}
    </div>
  )
}
