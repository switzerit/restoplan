import { useEffect, useState } from 'react'
import { generatePDF } from '../lib/exportPDF'
import { supabase } from '../lib/supabase'

const COLORS = [
  {bg:'#e8f2fd',color:'#0051a8'},{bg:'#f0faf3',color:'#1a6b35'},
  {bg:'#fff8ee',color:'#8a4a00'},{bg:'#f0f0fc',color:'#3a3880'},
  {bg:'#fff2f1',color:'#b02020'},{bg:'#fdf0f8',color:'#8a2060'},
]
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const POSTES_PAR_SECTEUR = {
  restaurant: ['cuisine','salle','bar','plonge','livraison'],
  hotel: ['reception','menage','restauration','maintenance','securite','spa','conciergerie'],
  garage: ['mecanique','carrosserie','electricite','accueil','magasin','expertise'],
  commerce: ['caisse','rayon','logistique','accueil','securite','inventaire'],
  clinique: ['medecin','infirmier','aide-soignant','accueil','pharmacie','radiologie'],
  spa: ['masseur','estheticien','accueil','commercial','nettoyage'],
  btp: ['maçon','electricien','plombier','charpentier','peintre','chef-chantier'],
  logistique: ['cariste','preparateur','chauffeur','expedition','reception','qualite'],
  education: ['enseignant','surveillant','administration','entretien','cantine'],
  securite: ['agent','chef-equipe','rondier','videosurvaillance','accueil'],
  autre: ['responsable','employe','technicien','administratif','commercial','terrain'],
}
const SECTEURS = [
  {id:'restaurant',label:'🍽️ Restaurant'},
  {id:'hotel',label:'🏨 Hôtel'},
  {id:'garage',label:'🔧 Garage'},
  {id:'commerce',label:'🏪 Commerce'},
  {id:'clinique',label:'🏥 Clinique'},
  {id:'spa',label:'💆 Spa & Salon'},
  {id:'btp',label:'🏗️ BTP'},
  {id:'logistique',label:'📦 Logistique'},
  {id:'education',label:'🎓 Éducation'},
  {id:'securite',label:'🛡️ Sécurité'},
  {id:'autre',label:'🏢 Autre'},
]

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}
function getSecteurLabel(secteur){
  const map={restaurant:'restaurant',hotel:'hôtel',garage:'garage',commerce:'commerce',clinique:'clinique',spa:'spa',btp:'chantier',logistique:'site',education:'établissement',securite:'site',autre:'établissement'}
  return map[secteur]||'établissement'
}
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
  const [pointages, setPointages] = useState({})
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [shiftModal, setShiftModal] = useState(null)
  const [empModal, setEmpModal] = useState(false)
  const [correctModal, setCorrectModal] = useState(null)
  const [restoModal, setRestoModal] = useState(false)
  const [form, setForm] = useState({poste:'cuisine',heure_debut:'09:00',heure_fin:'17:00',coupe:false,heure_debut_2:'',heure_fin_2:''})
  const [empForm, setEmpForm] = useState({prenom:'',nom:'',email:'',role:'Serveur / Serveuse',password:''})
  const [restoForm, setRestoForm] = useState({nom:'',adresse:''})
  const [correctForm, setCorrectForm] = useState({heure_arrivee:'',heure_depart:'',date:''})
  const [toast, setToast] = useState('')
  const [showRestoSwitch, setShowRestoSwitch] = useState(false)
  const [exportModal, setExportModal] = useState(false)
  const [exportForm, setExportForm] = useState({debut:'',fin:''})
  const [addPointageModal, setAddPointageModal] = useState(null)
  const [addPointageForm, setAddPointageForm] = useState({date:'',heure_arrivee:'',heure_depart:''})
  const [editEmpModal, setEditEmpModal] = useState(null)
  const [editEmpForm, setEditEmpForm] = useState({prenom:'',nom:'',email:'',role:'',password:''})
  const [profilsMap, setProfilsMap] = useState({})
  const today = fmtDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(()=>{
    const handler = ()=>setIsMobile(window.innerWidth<768)
    window.addEventListener('resize',handler)
    return()=>window.removeEventListener('resize',handler)
  },[])

  useEffect(()=>{loadRestaurants()},[])
  useEffect(()=>{if(currentResto){loadAll()}},[currentResto])
  useEffect(()=>{if(currentResto){loadShifts()}},[weekStart,currentResto])
  useEffect(()=>{if(currentResto){loadAll(selectedDate)}},[selectedDate])

  async function loadRestaurants(){
    const {data:{session}} = await supabase.auth.getSession()
    const {data} = await supabase.from('restaurants').select('*').eq('actif',true).eq('gerant_id',session?.user?.id).order('nom')
    setRestaurants(data||[])
    if(data?.length>0){
      const savedId = localStorage.getItem('restoplan_current_resto')
      const saved = savedId ? data.find(r=>r.id===savedId) : null
      setCurrentResto(saved || data[0])
    }
  }

  async function loadAll(date){
    const dateToLoad = date || selectedDate || today
    const {data:e} = await supabase.from('employes').select('*').eq('actif',true).eq('restaurant_id',currentResto.id).order('prenom')
    setEmployes(e||[])
    const {data:p} = await supabase.from('pointages').select('*').eq('date',dateToLoad).eq('restaurant_id',currentResto.id).order('heure_arrivee')
    const pMap={}
    p?.forEach(pt=>{if(!pMap[pt.employe_id])pMap[pt.employe_id]=[];pMap[pt.employe_id].push(pt)})
    setPointages(pMap)
    // Charger les profils pour savoir qui a un compte app
    if(e&&e.length>0){
      const map={}
      e.forEach(emp=>{ if(emp.a_un_compte) map[emp.id]=true })
      setProfilsMap(map)
    }
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

  function getPointages(empId){return pointages[empId]||[]}
  function getPointage(empId){const pts=pointages[empId]||[];return pts.find(p=>p.heure_arrivee&&!p.heure_depart)||pts[pts.length-1]}
  function isPresent(empId){const pts=pointages[empId]||[];return pts.some(p=>p.heure_arrivee&&!p.heure_depart)}

  async function saveShift(){
    const d = fmtDate(addDays(weekStart,shiftModal.dayIdx))
    const existing = getShift(shiftModal.empId,shiftModal.dayIdx)
    if(existing){
      await supabase.from('shifts').update({poste:form.poste,heure_debut:form.heure_debut,heure_fin:form.heure_fin,heure_debut_2:form.coupe?form.heure_debut_2:null,heure_fin_2:form.coupe?form.heure_fin_2:null}).eq('id',existing.id)
    } else {
      await supabase.from('shifts').insert({employe_id:shiftModal.empId,date:d,poste:form.poste,heure_debut:form.heure_debut,heure_fin:form.heure_fin,heure_debut_2:form.coupe?form.heure_debut_2:null,heure_fin_2:form.coupe?form.heure_fin_2:null,restaurant_id:currentResto.id})
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
    localStorage.setItem('restoplan_current_resto',data[0].id)
    showToast('Restaurant ajouté !')
  }

  function openEditEmp(emp){
    setEditEmpForm({prenom:emp.prenom,nom:emp.nom,email:emp.email,role:emp.role,password:''})
    setEditEmpModal(emp)
  }

  async function updateEmploye(){
    const {error} = await supabase.from('employes').update({
      prenom:editEmpForm.prenom,
      nom:editEmpForm.nom,
      email:editEmpForm.email,
      role:editEmpForm.role
    }).eq('id',editEmpModal.id)
    if(error){showToast('Erreur: '+error.message);return}
    // Si mot de passe fourni
    if(editEmpForm.password && editEmpForm.password.length>=6){
      const aDejaUnCompte = !!profilsMap[editEmpModal.id]
      if(aDejaUnCompte){
        // Compte existant — reset password via Edge Function
        const {data,error:fnErr} = await supabase.functions.invoke('reset-password',{
          body:{email:editEmpForm.email, new_password:editEmpForm.password}
        })
        if(fnErr||data?.error) showToast('Erreur: '+(data?.error||fnErr?.message))
        else showToast('Mot de passe modifié pour '+editEmpForm.prenom+' !')
      } else {
        // Pas de compte — en créer un
        const {data,error:fnErr} = await supabase.functions.invoke('create-employe',{
          body:{email:editEmpForm.email, password:editEmpForm.password, skip_employe:true, employe_id:editEmpModal.id}
        })
        if(fnErr||data?.error) showToast('Erreur: '+(data?.error||fnErr?.message))
        else {
          await supabase.from('employes').update({a_un_compte:true}).eq('id',editEmpModal.id)
          showToast(editEmpForm.prenom+' — compte créé !')
        }
      }
    }
    setEditEmpModal(null)
    await loadAll(selectedDate)
    showToast(editEmpForm.prenom+' mis à jour !')
  }

  async function creerCompteEmploye(emp){
    const pwd = window.prompt('Mot de passe temporaire pour '+emp.prenom+' (min 6 caractères):')
    if(!pwd) return
    if(pwd.length<6){showToast('Min. 6 caractères');return}
    showToast('Création du compte...')
    const {data,error} = await supabase.functions.invoke('create-employe-existing',{
      body:{employe_id:emp.id,email:emp.email,password:pwd}
    })
    if(error||data?.error){
      // Fallback: créer juste dans auth et profils
      showToast('Utilisez le dashboard Supabase pour cet employé existant')
      return
    }
    showToast('Compte créé pour '+emp.prenom+' !')
  }

  async function supprimerEmploye(empId){
    if(!window.confirm('Supprimer cet employe ?')) return
    const emp = employes.find(e=>e.id===empId)
    await supabase.from('shifts').delete().eq('employe_id',empId)
    await supabase.from('pointages').delete().eq('employe_id',empId)
    await supabase.from('profils').delete().eq('employe_id',empId)
    await supabase.from('employes').delete().eq('id',empId)
    if(emp?.email) await supabase.functions.invoke('delete-user',{body:{email:emp.email}})
    loadAll(selectedDate)
    showToast('Employe supprime')
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
    const dateToUse = correctForm.date || today
    const {data:existing} = await supabase.from('pointages').select('*').eq('employe_id',correctModal.empId).eq('date',dateToUse).single()
    if(existing) await supabase.from('pointages').delete().eq('id',existing.id)
    setCorrectModal(null);loadAll();showToast('Pointage supprimé')
  }

  async function addPointage(){
    if(!addPointageForm.date||!addPointageForm.heure_arrivee){showToast('Date et heure arrivee obligatoires');return}
    const {data:existing} = await supabase.from('pointages').select('*').eq('employe_id',addPointageModal.empId).eq('date',addPointageForm.date).maybeSingle()
    if(existing){
      await supabase.from('pointages').update({heure_arrivee:addPointageForm.heure_arrivee||null,heure_depart:addPointageForm.heure_depart||null}).eq('id',existing.id)
    } else {
      await supabase.from('pointages').insert({employe_id:addPointageModal.empId,date:addPointageForm.date,heure_arrivee:addPointageForm.heure_arrivee||null,heure_depart:addPointageForm.heure_depart||null,restaurant_id:currentResto.id})
    }
    setAddPointageModal(null)
    setAddPointageForm({date:'',heure_arrivee:'',heure_depart:''})
    loadAll(selectedDate)
    showToast('Pointage ajoute !')
  }

  async function deconnexion(){
    await supabase.auth.signOut()
    window.location.href='/login'
  }

  function openShift(empId,dayIdx){
    const existing = getShift(empId,dayIdx)
    setForm(existing?{poste:existing.poste,heure_debut:existing.heure_debut.slice(0,5),heure_fin:existing.heure_fin.slice(0,5),coupe:!!(existing.heure_debut_2&&existing.heure_fin_2),heure_debut_2:existing.heure_debut_2?.slice(0,5)||'',heure_fin_2:existing.heure_fin_2?.slice(0,5)||''}:{poste:'cuisine',heure_debut:'09:00',heure_fin:'17:00',coupe:false,heure_debut_2:'',heure_fin_2:''})
    setShiftModal({empId,dayIdx,existing:!!existing})
  }

  function openCorrection(emp){
    const p = getPointage(emp.id)
    setCorrectForm({
      heure_arrivee:p?.heure_arrivee?.slice(0,5)||'',
      heure_depart:p?.heure_depart?.slice(0,5)||'',
      date:selectedDate
    })
    setCorrectModal({empId:emp.id,nom:emp.prenom+' '+emp.nom})
  }

  function calcMinutes(debut,fin){
    if(!debut||!fin) return 0
    const [dh,dm]=debut.slice(0,5).split(':').map(Number)
    const [fh,fm]=fin.slice(0,5).split(':').map(Number)
    let t=(fh*60+fm)-(dh*60+dm)
    return t<0?t+1440:t
  }
  function minsToHHMM(m){if(m<=0)return '0h00';return Math.floor(m/60)+'h'+(m%60>0?(m%60).toString().padStart(2,'0'):'00')}
  function getShiftForDate(empId,date){return shifts.find(s=>s.employe_id===empId&&s.date===date)}
  function calcShiftMins(sh){if(!sh)return 0;let t=calcMinutes(sh.heure_debut,sh.heure_fin);if(sh.heure_debut_2&&sh.heure_fin_2)t+=calcMinutes(sh.heure_debut_2,sh.heure_fin_2);return t}
  function calcPointageMins(pts){return pts.reduce((acc,p)=>p.heure_arrivee&&p.heure_depart?acc+calcMinutes(p.heure_arrivee,p.heure_depart):acc,0)}
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),2600)}

  const presentCount = employes.filter(e=>{const pts=pointages[e.id]||[];return pts.some(p=>p.heure_arrivee&&!p.heure_depart)}).length
  const weekDays = Array.from({length:7},(_,i)=>addDays(weekStart,i))
  const weekLabel = `${fmtLabel(weekDays[0])} – ${fmtLabel(weekDays[6])}`
  const SHIFT_COLORS_LIST = [
    {bg:'#f0faf3',color:'#1a6b35',border:'#b8e8c8'},
    {bg:'#e8f2fd',color:'#004aad',border:'#b3d4f7'},
    {bg:'#fff8ee',color:'#8a4a00',border:'#ffd99a'},
    {bg:'#f0f0fc',color:'#3a3880',border:'#c8c8f0'},
    {bg:'#fff2f1',color:'#b02020',border:'#f0b8b8'},
    {bg:'#fdf0f8',color:'#8a2060',border:'#e8b8d8'},
    {bg:'#f0fff4',color:'#1a6b35',border:'#a8e8b8'},
    {bg:'#fffbf0',color:'#8a5a00',border:'#f0d898'},
  ]
  function getShiftColor(poste){
    const postes = POSTES_PAR_SECTEUR[currentResto?.secteur||'restaurant']||POSTES_PAR_SECTEUR.autre
    const idx = postes.indexOf(poste)
    return SHIFT_COLORS_LIST[Math.max(0,idx)%SHIFT_COLORS_LIST.length]
  }
  const shiftColors = new Proxy({},{get:(_,poste)=>getShiftColor(poste)})

  if(!currentResto) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'var(--text2)'}}>Chargement...</div>

  const viewTitle = view==='planning'?'Planning':view==='presences'?'Présences du jour':view==='employes'?'Équipe':'Paramètres'

  return (
    <div style={{display:'flex',height:'100dvh',fontFamily:'var(--font)',overflow:'hidden',flexDirection:isMobile?'column':'row'}}>

      {/* SIDEBAR DESKTOP */}
      {!isMobile && (
      <div style={{width:220,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'18px 10px',flexShrink:0}}>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 8px',marginBottom:8}}>
            <div style={{width:32,height:32,background:'var(--accent)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{{'restaurant':'🍽️','hotel':'🏨','garage':'🔧','commerce':'🏪','clinique':'🏥','spa':'💆','btp':'🏗️','logistique':'📦','education':'🎓','securite':'🛡️'}[currentResto?.secteur]||'🏢'}</div>
            <div><div style={{fontSize:15,fontWeight:800}}>Kronvo</div><div style={{fontSize:11,color:'var(--text3)'}}>Dashboard gérant</div></div>
          </div>
          <button onClick={()=>setShowRestoSwitch(!showRestoSwitch)} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'10px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',cursor:'pointer',textAlign:'left'}}>
            <div style={{width:28,height:28,borderRadius:7,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🏪</div>
            <div style={{flex:1,overflow:'hidden'}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{currentResto.nom}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>Changer d'établissement</div>
            </div>
            <span style={{color:'var(--text3)',fontSize:12}}>{showRestoSwitch?'▲':'▼'}</span>
          </button>
          {showRestoSwitch && (
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,marginTop:4,overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,.08)'}}>
              {restaurants.map(r=>(
                <button key={r.id} onClick={()=>{setCurrentResto(r);setShowRestoSwitch(false);localStorage.setItem('restoplan_current_resto',r.id)}} style={{width:'100%',padding:'10px 12px',border:'none',background:r.id===currentResto.id?'var(--accent-bg)':'transparent',cursor:'pointer',textAlign:'left',fontSize:13,fontWeight:600,color:r.id===currentResto.id?'var(--accent)':'var(--text)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                  {r.id===currentResto.id&&<span style={{color:'var(--accent)'}}>✓</span>}<span>{r.nom}</span>
                </button>
              ))}
              <button onClick={()=>{setShowRestoSwitch(false);setRestoModal(true)}} style={{width:'100%',padding:'10px 12px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left',fontSize:13,fontWeight:600,color:'var(--accent)'}}>+ Ajouter un {getSecteurLabel(currentResto?.secteur)}</button>
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
      )}

      {/* TOPBAR MOBILE */}
      {isMobile && (
        <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'10px 16px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:28,height:28,background:'var(--accent)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{{'restaurant':'🍽️','hotel':'🏨','garage':'🔧','commerce':'🏪','clinique':'🏥','spa':'💆','btp':'🏗️','logistique':'📦','education':'🎓','securite':'🛡️'}[currentResto?.secteur]||'🏢'}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:800}}>Kronvo</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>{currentResto.nom}</div>
          </div>
          <button onClick={()=>setShowRestoSwitch(!showRestoSwitch)} style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',fontSize:11,fontWeight:600,cursor:'pointer',color:'var(--text2)'}}>🏪 Changer</button>
          <button onClick={deconnexion} style={{width:30,height:30,borderRadius:8,border:'none',background:'var(--red-bg)',color:'var(--red)',cursor:'pointer',fontSize:14}}>↩</button>
          {showRestoSwitch && (
            <div style={{position:'absolute',top:56,left:0,right:0,background:'var(--surface)',border:'1px solid var(--border)',zIndex:50,boxShadow:'0 4px 16px rgba(0,0,0,.1)'}}>
              {restaurants.map(r=>(
                <button key={r.id} onClick={()=>{setCurrentResto(r);setShowRestoSwitch(false);localStorage.setItem('restoplan_current_resto',r.id)}} style={{width:'100%',padding:'12px 16px',border:'none',background:r.id===currentResto.id?'var(--accent-bg)':'transparent',cursor:'pointer',textAlign:'left',fontSize:14,fontWeight:600,color:r.id===currentResto.id?'var(--accent)':'var(--text)',borderBottom:'1px solid var(--border)'}}>
                  {r.id===currentResto.id?'✓ ':''}{r.nom}
                </button>
              ))}
              <button onClick={()=>{setShowRestoSwitch(false);setRestoModal(true)}} style={{width:'100%',padding:'12px 16px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left',fontSize:14,fontWeight:600,color:'var(--accent)'}}>+ Ajouter un {getSecteurLabel(currentResto?.secteur)}</button>
            </div>
          )}
        </div>
      )}

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)',minHeight:0,minWidth:0}}>

        {/* TOPBAR */}
        {!isMobile && <div style={{height:56,background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 20px',gap:10}}>
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
        </div>}
        {/* TOPBAR MOBILE ACTION */}
        {isMobile && view==='employes' && <div style={{padding:'8px 12px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:14,fontWeight:700}}>{view==='planning'?'Planning':view==='presences'?'Présences':view==='employes'?'Équipe':'Paramètres'}</span><button onClick={()=>setEmpModal(true)} style={{height:34,padding:'0 14px',background:'var(--accent)',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Ajouter</button></div>}
        {isMobile && view==='presences' && <div style={{padding:'8px 12px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:14,fontWeight:700}}>Présences</span><button onClick={()=>setExportModal(true)} style={{height:34,padding:'0 14px',background:'var(--green)',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>📄 PDF</button></div>}

        {/* VUE PLANNING */}
        {view==='planning'&&(
          <div style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:isMobile?10:20,WebkitOverflowScrolling:'touch'}}>
          {isMobile ? (
            /* VUE MOBILE PLANNING - jour par jour */
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,background:'var(--surface)',borderRadius:12,padding:'10px 14px',border:'1px solid var(--border)'}}>
                <button onClick={()=>setWeekStart(addDays(weekStart,-1))} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',cursor:'pointer',fontSize:16,color:'var(--text2)'}}>‹</button>
                <div style={{flex:1,textAlign:'center'}}>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{DAYS[0]} {fmtLabel(weekStart)}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>Appuyez sur + pour ajouter un shift</div>
                </div>
                <button onClick={()=>setWeekStart(addDays(weekStart,1))} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',cursor:'pointer',fontSize:16,color:'var(--text2)'}}>›</button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {employes.map((emp,ei)=>{
                  const c=COLORS[ei%COLORS.length]
                  const sh=getShift(emp.id,0)
                  const sc=sh?shiftColors[sh.poste]:null
                  return (
                    <div key={emp.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}} onClick={()=>openShift(emp.id,0)}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,flexShrink:0}}>{ini(emp.prenom,emp.nom)}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700}}>{emp.prenom} {emp.nom}</div>
                        <div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div>
                      </div>
                      {sh ? (
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:12,fontWeight:700,color:sc.color,background:sc.bg,padding:'4px 10px',borderRadius:20,border:`1px solid ${sc.border}`}}>{sh.heure_debut.slice(0,5)} – {sh.heure_fin.slice(0,5)}</div>
                          <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>{sh.poste}</div>
                        </div>
                      ) : (
                        <div style={{width:32,height:32,border:'1.5px dashed var(--border2)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:20}}>+</div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{marginTop:12,display:'flex',gap:6}}>
                {Array.from({length:7},(_,i)=>addDays(getMonday(weekStart),i)).map((d,i)=>{
                  const isSelected=fmtDate(d)===fmtDate(weekStart)
                  const isToday=fmtDate(d)===today
                  return <button key={i} onClick={()=>setWeekStart(d)} style={{flex:1,padding:'6px 2px',borderRadius:8,border:'none',background:isSelected?'var(--accent)':isToday?'var(--accent-bg)':'var(--surface)',color:isSelected?'white':isToday?'var(--accent)':'var(--text2)',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                    <span>{DAYS[i]}</span>
                    <span style={{fontSize:9,opacity:.7}}>{d.getDate()}</span>
                  </button>
                })}
              </div>
            </div>
          ) : (
            /* VUE DESKTOP PLANNING - grille semaine */
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
          )}
          </div>
        )}

        {/* VUE PRESENCES */}
        {view==='presences'&&(
          <div style={{flex:1,overflowY:'auto',padding:isMobile?12:20,WebkitOverflowScrolling:'touch'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,background:'var(--surface)',borderRadius:12,padding:'12px 16px',border:'1px solid var(--border)'}}>
              <span style={{fontSize:13,fontWeight:600,color:'var(--text2)'}}>Pointages du</span>
              <input type='date' value={selectedDate} onChange={e=>{setSelectedDate(e.target.value)}} style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',cursor:'pointer'}}/>
              <button onClick={()=>setSelectedDate(today)} style={{padding:'6px 12px',borderRadius:8,border:'1px solid var(--border2)',background:selectedDate===today?'var(--accent)':'var(--bg)',color:selectedDate===today?'white':'var(--text2)',fontSize:12,fontWeight:600,cursor:'pointer'}}>Aujourd'hui</button>
              <button onClick={()=>{const d=new Date(selectedDate);d.setDate(d.getDate()-1);setSelectedDate(fmtDate(d))}} style={{padding:'6px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:14,cursor:'pointer'}}>‹</button>
              <button onClick={()=>{const d=new Date(selectedDate);d.setDate(d.getDate()+1);setSelectedDate(fmtDate(d))}} style={{padding:'6px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:14,cursor:'pointer'}}>›</button>
              <span style={{fontSize:12,color:'var(--text3)',marginLeft:'auto'}}>{new Date(selectedDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:10,marginBottom:18}}>
              {[{n:presentCount,l:'Présents',c:'var(--green)'},{n:employes.length-presentCount,l:'Absents',c:'var(--text)'},{n:employes.filter(e=>{const pts=getPointages(e.id);return pts.length>0&&!pts.some(p=>!p.heure_depart)}).length,l:'Partis',c:'var(--text2)'},{n:0,l:'Retards',c:'var(--orange)'}].map((s,i)=>(
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
                const present=isPresent(emp.id)
                const pts=(pointages[emp.id]||[])
                const parti=pts.length>0&&pts.every(p=>p.heure_depart)
                return (
                  <div key={emp.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px'}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:present?'var(--green)':parti?'var(--orange)':'var(--border2)',flexShrink:0,boxShadow:present?'0 0 0 3px rgba(52,199,89,.15)':'none'}}></div>
                      <div style={{width:32,height:32,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{ini(emp.prenom,emp.nom)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.prenom} {emp.nom}</div>
                        <div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div>
                      </div>
                      {(()=>{
                        const pts=getPointages(emp.id)
                        const sh=getShiftForDate(emp.id,selectedDate)
                        const shM=calcShiftMins(sh)
                        const ptM=calcPointageMins(pts)
                        const ec=ptM-shM
                        if(!shM&&!ptM) return null
                        return <div style={{textAlign:'right',flexShrink:0,marginRight:4}}>
                          {shM>0&&<div style={{fontSize:10,color:'var(--text3)'}}>Prévu {minsToHHMM(shM)}</div>}
                          {ptM>0&&<div style={{fontSize:11,fontWeight:700}}>{minsToHHMM(ptM)}</div>}
                          {shM>0&&ptM>0&&<div style={{fontSize:10,fontWeight:700,color:ec>=0?'#1a6b35':'var(--red)'}}>{ec>=0?'+':''}{minsToHHMM(Math.abs(ec))}</div>}
                        </div>
                      })()}
                      
                      <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,flexShrink:0,background:present?'var(--green-bg)':parti?'var(--orange-bg)':'var(--bg)',color:present?'#1a6b35':parti?'#8a4a00':'var(--text3)'}}>{present?'Présent':parti?'Parti':'Absent'}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px 10px',borderTop:'1px solid var(--border)'}}>
                      {(()=>{
                        const pts=getPointages(emp.id)
                        if(!pts.length) return <span style={{fontSize:11,color:'var(--text3)',flex:1}}>Pas de pointage</span>
                        return <div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>
                          {pts.map((pt,idx)=><span key={idx} style={{fontSize:11,color:'var(--text2)',fontWeight:500}}>🕐 {pt.heure_arrivee?.slice(0,5)}{pt.heure_depart?' → '+pt.heure_depart.slice(0,5):' → en cours'}</span>)}
                        </div>
                      })()}
                      <button onClick={()=>openCorrection(emp)} style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer',flexShrink:0}}>✏️ Corriger</button>
                      <button onClick={()=>{setAddPointageModal({empId:emp.id,nom:emp.prenom+' '+emp.nom});setAddPointageForm({date:selectedDate,heure_arrivee:'',heure_depart:''})}} style={{padding:'5px 10px',borderRadius:8,border:'none',background:'var(--accent-bg)',color:'var(--accent)',fontSize:11,fontWeight:600,cursor:'pointer',flexShrink:0}}>+ Ajouter</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VUE EQUIPE */}
        {view==='employes'&&(
          <div style={{flex:1,overflowY:'auto',padding:isMobile?12:20,WebkitOverflowScrolling:'touch'}}>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
              {employes.map((emp,i)=>{
                const c=COLORS[i%COLORS.length]
                const sc=shifts.filter(s=>s.employe_id===emp.id).length
                const hasAccount=profilsMap[emp.id]
                return (
                  <div key={emp.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:16,transition:'all .18s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.07)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
                      <div style={{width:40,height:40,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,flexShrink:0}}>{ini(emp.prenom,emp.nom)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.prenom} {emp.nom}</div>
                        <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{emp.role}</div>
                        <div style={{marginTop:4}}>
                          {hasAccount
                            ? <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'var(--green-bg)',color:'#1a6b35'}}>✓ Compte app</span>
                            : <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'var(--bg)',color:'var(--text3)'}}>Sans compte</span>
                          }
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'1px solid var(--border)',marginBottom:8}}>
                      <span style={{fontSize:11,color:'var(--text2)'}}>{sc} shift{sc>1?'s':''}/sem</span>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:isPresent(emp.id)?'var(--green-bg)':'var(--bg)',color:isPresent(emp.id)?'#1a6b35':'var(--text3)'}}>{(()=>{const pts=pointages[emp.id]||[];return pts.some(p=>p.heure_arrivee&&!p.heure_depart)?'Présent':'—'})()}</span>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>openEditEmp(emp)} style={{flex:1,padding:'6px 0',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer'}}>✏️ Modifier</button>
                      <button onClick={()=>supprimerEmploye(emp.id)} style={{padding:'6px 10px',borderRadius:8,border:'none',background:'var(--red-bg)',color:'var(--red)',fontSize:11,fontWeight:600,cursor:'pointer'}}>🗑️</button>
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
          <div style={{flex:1,overflowY:'auto',padding:isMobile?12:20,WebkitOverflowScrolling:'touch'}}>
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
                  <div style={{padding:'10px 14px',background:'var(--accent-bg)',borderRadius:10,fontSize:12,color:'var(--accent)',display:'flex',alignItems:'center',gap:8}}>
                    <span>{SECTEURS.find(s=>s.id===(currentResto.secteur||'restaurant'))?.label||'🍽️ Restaurant'}</span>
                    <span style={{color:'var(--text3)'}}>· Secteur défini par votre administrateur</span>
                  </div>
                  <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px'}}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>🖥️ Borne tablette</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginBottom:8}}>Scannez ce QR avec la tablette pour ouvrir la borne directement.</div>
                    <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin+'/borne?token='+currentResto.borne_token)}`} alt="QR Borne" style={{width:160,height:160,borderRadius:12,border:'1px solid var(--border)',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}/>
                    </div>
                    <div style={{fontSize:12,color:'var(--text2)',marginBottom:10}}>Ouvrez ce lien sur la tablette à l'entrée de votre établissement</div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <div style={{flex:1,padding:'8px 12px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border2)',fontSize:11,color:'var(--text2)',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{window.location.origin}/borne?resto={currentResto.id}</div>
                      <button onClick={()=>navigator.clipboard.writeText(window.location.origin+'/borne?token='+currentResto.borne_token).then(()=>showToast('URL copiée !'))} style={{padding:'8px 14px',borderRadius:8,border:'none',background:'var(--accent)',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>Copier</button>
                    </div>
                  </div>
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

      {/* BOTTOM NAV MOBILE */}
      {isMobile && (
        <div style={{background:'var(--surface)',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-around',paddingTop:4,paddingBottom:'max(8px, env(safe-area-inset-bottom))',flexShrink:0}}>
          {[
            {id:'planning',icon:'📅',label:'Planning'},
            {id:'presences',icon:'👥',label:'Présences',badge:presentCount},
            {id:'employes',icon:'👤',label:'Équipe'},
            {id:'parametres',icon:'⚙️',label:'Réglages'},
          ].map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'2px 12px',border:'none',background:'transparent',cursor:'pointer',position:'relative'}}>
              <span style={{fontSize:16}}>{item.icon}</span>
              <span style={{fontSize:9,fontWeight:600,color:view===item.id?'var(--accent)':'var(--text3)'}}>{item.label}</span>
              {item.badge>0&&<div style={{position:'absolute',top:0,right:8,width:16,height:16,background:'var(--green)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'white'}}>{item.badge}</div>}
            </button>
          ))}
        </div>
      )}
      </div>
      {/* FIN MAIN */}

      {/* MODALS */}
      {correctModal&&(
        <div onClick={()=>setCorrectModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:340,boxShadow:'0 8px 40px rgba(0,0,0,.14)'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Corriger le pointage</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:12}}>{correctModal.nom}</div>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Date du pointage</label>
              <input type='date' value={correctForm.date} onChange={async e=>{
                const newDate = e.target.value
                setCorrectForm(f=>({...f,date:newDate,heure_arrivee:'',heure_depart:''}))
                const {data:p} = await supabase.from('pointages').select('*').eq('employe_id',correctModal.empId).eq('date',newDate).single()
                if(p) setCorrectForm(f=>({...f,date:newDate,heure_arrivee:p.heure_arrivee?.slice(0,5)||'',heure_depart:p.heure_depart?.slice(0,5)||''}))
              }} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
            </div>
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
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:340,boxShadow:'0 8px 40px rgba(0,0,0,.14)'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>{shiftModal.existing?'Modifier':'Nouveau'} shift</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>{employes.find(e=>e.id===shiftModal.empId)?.prenom} — {DAYS[shiftModal.dayIdx]} {fmtLabel(addDays(weekStart,shiftModal.dayIdx))}</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Poste</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {(POSTES_PAR_SECTEUR[currentResto?.secteur||'restaurant']||POSTES_PAR_SECTEUR.autre).map(p=>{
                  const sel=form.poste===p
                  const colors={bg:sel?'var(--accent-bg)':'var(--bg)',color:sel?'var(--accent)':'var(--text2)',border:sel?'var(--accent)':'var(--border)'}
                  return <button key={p} onClick={()=>setForm(f=>({...f,poste:p}))} style={{padding:'7px 12px',borderRadius:8,border:`2px solid ${colors.border}`,background:colors.bg,cursor:'pointer',fontSize:11,fontWeight:700,color:colors.color}}>{p[0].toUpperCase()+p.slice(1)}</button>
                })}
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
              {/* Shift coupé */}
              <div style={{gridColumn:'1/-1'}}>
                <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'10px 14px',background:form.coupe?'#f0fdf4':'var(--bg)',border:'1px solid var(--border)',borderRadius:10,transition:'all .2s'}}>
                  <input type="checkbox" checked={form.coupe} onChange={e=>setForm(f=>({...f,coupe:e.target.checked,heure_debut_2:e.target.checked?'14:00':'',heure_fin_2:e.target.checked?'18:00':''}))} style={{width:16,height:16,accentColor:'#16a34a',cursor:'pointer'}}/>
                  <span style={{fontSize:13,fontWeight:600,color:form.coupe?'#16a34a':'var(--text)'}}>Shift coupé (2 plages horaires)</span>
                </label>
              </div>
              {form.coupe&&['heure_debut_2','heure_fin_2'].map(fld=>(
                <div key={fld}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>{fld==='heure_debut_2'?'Début 2ème partie':'Fin 2ème partie'}</label>
                  <input type="time" value={form[fld]} onChange={e=>setForm(f=>({...f,[fld]:e.target.value}))} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:14,color:'var(--text)',outline:'none'}}/>
                </div>
              ))}
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
            {[{f:'prenom',l:'Prénom',t:'text',ph:'Sophie'},{f:'nom',l:'Nom',t:'text',ph:'Martin'},{f:'email',l:'Email',t:'email',ph:'sophie@bistrot.fr'},{f:'password',l:'Mot de passe (optionnel)',t:'password',ph:'Laisser vide = sans compte app'}].map(({f,l,t,ph})=>(
              <div key={f} style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>{l}</label>
                <input type={t} placeholder={ph} value={empForm[f]} onChange={e=>setEmpForm(ff=>({...ff,[f]:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            ))}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Poste</label>
              <select value={empForm.role} onChange={e=>setEmpForm(f=>({...f,role:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}>
                {(POSTES_PAR_SECTEUR[currentResto?.secteur||'restaurant']||POSTES_PAR_SECTEUR.autre).map(r=><option key={r}>{r[0].toUpperCase()+r.slice(1)}</option>)}
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
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Nouvel établissement</div>
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
{addPointageModal&&(
        <div onClick={()=>setAddPointageModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:340,boxShadow:'0 8px 40px rgba(0,0,0,.14)'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Ajouter un pointage</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>{addPointageModal.nom}</div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:6}}>Date</label>
              <input type='date' value={addPointageForm.date} onChange={e=>setAddPointageForm(f=>({...f,date:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Heure arrivee</label>
                <input type='time' value={addPointageForm.heure_arrivee} onChange={e=>setAddPointageForm(f=>({...f,heure_arrivee:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Heure depart</label>
                <input type='time' value={addPointageForm.heure_depart} onChange={e=>setAddPointageForm(f=>({...f,heure_depart:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            </div>
            <div style={{padding:'10px 12px',background:'var(--accent-bg)',borderRadius:10,marginBottom:16,fontSize:12,color:'var(--accent)'}}>
              Si un pointage existe deja pour cette date, il sera mis a jour
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setAddPointageModal(null)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={addPointage} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT EMPLOYE */}
      {editEmpModal&&(
        <div onClick={()=>setEditEmpModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:26,width:340,boxShadow:'0 8px 40px rgba(0,0,0,.14)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Modifier l'employé</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>{editEmpModal.prenom} {editEmpModal.nom}</div>
            {[{f:'prenom',l:'Prénom',t:'text'},{f:'nom',l:'Nom',t:'text'},{f:'email',l:'Email',t:'email'}].map(({f,l,t})=>(
              <div key={f} style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>{l}</label>
                <input type={t} value={editEmpForm[f]} onChange={e=>setEditEmpForm(ff=>({...ff,[f]:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Poste</label>
              <select value={editEmpForm.role} onChange={e=>setEditEmpForm(f=>({...f,role:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}>
                {(POSTES_PAR_SECTEUR[currentResto?.secteur||'restaurant']||POSTES_PAR_SECTEUR.autre).map(r=><option key={r}>{r[0].toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
            {!profilsMap[editEmpModal.id] && (
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Créer un compte app (optionnel)</label>
                <input type='password' placeholder='Mot de passe temporaire (min 6 car.)' value={editEmpForm.password} onChange={e=>setEditEmpForm(f=>({...f,password:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>L'employé pourra se connecter sur son espace perso</div>
              </div>
            )}
            {profilsMap[editEmpModal.id] && (
              <div style={{marginBottom:16}}>
                <div style={{padding:'10px 12px',background:'var(--green-bg)',borderRadius:10,marginBottom:8,fontSize:12,color:'#1a6b35',fontWeight:600}}>
                  ✓ Cet employé a déjà un compte app
                </div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:5}}>Changer le mot de passe (optionnel)</label>
                <input type='password' placeholder='Nouveau mot de passe (min 6 car.)' value={editEmpForm.password} onChange={e=>setEditEmpForm(f=>({...f,password:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setEditEmpModal(null)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={updateEmploye} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:'var(--text)',color:'white',padding:'9px 20px',borderRadius:20,fontSize:13,fontWeight:600,zIndex:300,whiteSpace:'nowrap'}}>{toast}</div>}
    </div>
  )
}
