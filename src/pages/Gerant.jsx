import Logo from '../components/Logo'
import { useEffect, useState } from 'react'
import { generatePDF } from '../lib/exportPDF'
import { supabase } from '../lib/supabase'
import CongesGerant from '../components/CongesGerant'
import PlanningMois from '../components/PlanningMois'
import NotifsGerant from '../components/NotifsGerant'
import SignalementsGerant from '../components/SignalementsGerant'

const COLORS = [
  {bg:'#fff1f3',color:'#0051a8'},{bg:'#f0faf3',color:'#1a6b35'},
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
function fmtDateLocal(d){
  const y=d.getFullYear()
  const m=String(d.getMonth()+1).padStart(2,'0')
  const day=String(d.getDate()).padStart(2,'0')
  return y+'-'+m+'-'+day
}
function fmtLabel(d){return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}

export default function Gerant() {
  const [view, setView] = useState('planning')
  const [restaurants, setRestaurants] = useState([])
  const [currentResto, setCurrentResto] = useState(null)
  const [employes, setEmployes] = useState([])
  const [shifts, setShifts] = useState([])
  const [congesSemaine, setCongesSemaine] = useState([])
  const [pointages, setPointages] = useState({})
  const [congesVersion, setCongesVersion] = useState(0)
  const [shiftsMonth, setShiftsMonth] = useState([])
  const [congesMonth, setCongesMonth] = useState([])
  const [pendingEmp, setPendingEmp] = useState(new Set())
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [planningMode, setPlanningMode] = useState('semaine')
  const [moisDate, setMoisDate] = useState(new Date())
  const [filtreEmploye, setFiltreEmploye] = useState('')
  const [copierModal, setCopierModal] = useState(false)
  const [copierForm, setCopierForm] = useState({sourceWeek:'', employe:''})
  const [calPicker, setCalPicker] = useState(null) // 'source' | 'dest' | null
  const [calMonth, setCalMonth] = useState(new Date())
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
  const [notifsNonLues, setNotifsNonLues] = useState({})
  const [notifsDetail, setNotifsDetail] = useState(null) // {empId, notifs, nom}
  const [trialStatut, setTrialStatut] = useState('loading') // loading | trial | active | expired
  const [trialDaysLeft, setTrialDaysLeft] = useState(null)

  async function loadNotifsDetail(empId, empNom){
    const {data} = await supabase.from('notifications')
      .select('*').eq('employe_id',empId)
      .eq('lu',false).eq('masque',false)
      .order('created_at',{ascending:false})
    setNotifsDetail({empId, nom:empNom, notifs:data||[]})
  }

  async function loadMonthData(date){
    if(!currentResto) return
    const y=date.getFullYear(), m=date.getMonth()
    const from=y+'-'+String(m+1).padStart(2,'0')+'-01'
    const to=y+'-'+String(m+1).padStart(2,'0')+'-'+String(new Date(y,m+1,0).getDate()).padStart(2,'0')
    const {data:sData}=await supabase.from('shifts').select('*').eq('restaurant_id',currentResto.id).gte('date',from).lte('date',to)
    setShiftsMonth(sData||[])
    const {data:cData}=await supabase.from('conges').select('*').eq('restaurant_id',currentResto.id).eq('statut','accepte').lte('date_debut',to).gte('date_fin',from)
    setCongesMonth(cData||[])
  }

  async function loadMonthData(date){
    if(!currentResto) return
    const y=date.getFullYear(), m=date.getMonth()
    const from=y+'-'+String(m+1).padStart(2,'0')+'-01'
    const to=y+'-'+String(m+1).padStart(2,'0')+'-'+String(new Date(y,m+1,0).getDate()).padStart(2,'0')
    const {data:sData}=await supabase.from('shifts').select('*').eq('restaurant_id',currentResto.id).gte('date',from).lte('date',to)
    setShiftsMonth(sData||[])
    const {data:cData}=await supabase.from('conges').select('*').eq('restaurant_id',currentResto.id).eq('statut','accepte').lte('date_debut',to).gte('date_fin',from)
    setCongesMonth(cData||[])
  }

  async function loadNotifsNonLues(){
    if(!currentResto) return
    const {data} = await supabase.from('notifications')
      .select('employe_id').eq('restaurant_id',currentResto.id)
      .eq('lu',false).eq('masque',false)
    const map={}
    data?.forEach(n=>{map[n.employe_id]=(map[n.employe_id]||0)+1})
    setNotifsNonLues(map)
  }
  useEffect(()=>{
    const handler = ()=>setIsMobile(window.innerWidth<768)
    window.addEventListener('resize',handler)
    return()=>window.removeEventListener('resize',handler)
  },[])

  // Recharger quand l'app revient au premier plan
  useEffect(()=>{
    if(!currentResto) return
    const refresh=()=>loadAll()
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()})
    window.addEventListener('focus',refresh)
    window.addEventListener('pageshow',refresh)
    return()=>{
      document.removeEventListener('visibilitychange',refresh)
      window.removeEventListener('focus',refresh)
      window.removeEventListener('pageshow',refresh)
    }
  },[currentResto?.id])

  useEffect(()=>{loadRestaurants()},[])
  useEffect(()=>{if(currentResto){loadAll()}},[currentResto])
  useEffect(()=>{if(currentResto){loadShifts()}},[weekStart,currentResto,congesVersion])
  useEffect(()=>{if(currentResto&&planningMode==='mois'){loadMonthData(moisDate)}},[moisDate,currentResto,planningMode,congesVersion])
  useEffect(()=>{
    if(!currentResto) return
    loadNotifsNonLues()
    const ch=supabase.channel('notifs-watch')
      .on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:`restaurant_id=eq.${currentResto.id}`},()=>loadNotifsNonLues())
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[currentResto?.id])
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
    // Vérifier trial depuis la table gerants
    const {data:gerantData} = await supabase.from('gerants').select('statut,trial_end_at').eq('user_id',session?.user?.id).single()
    if(gerantData){
      const now = new Date()
      const {statut, trial_end_at} = gerantData
      if(statut === 'expired' || (trial_end_at && new Date(trial_end_at) < now)) {
        setTrialStatut('expired')
      } else if(statut === 'trial' && trial_end_at) {
        const daysLeft = Math.ceil((new Date(trial_end_at) - now) / (1000*60*60*24))
        setTrialStatut('trial')
        setTrialDaysLeft(Math.max(0, daysLeft))
      } else if(statut === 'trial' && !trial_end_at) {
        setTrialStatut('expired')
      } else {
        setTrialStatut('active')
      }
    } else {
      setTrialStatut('active')
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
    loadNotifsNonLues()
  }

  async function loadShifts(){
    const from = fmtDate(weekStart)
    const to = fmtDate(addDays(weekStart,6))
    const {data} = await supabase.from('shifts').select('*').eq('restaurant_id',currentResto.id).gte('date',from).lte('date',to)
    setShifts(data||[])
    // Charger les congés acceptés de la semaine
    const {data:cData} = await supabase.from('conges')
      .select('*').eq('restaurant_id',currentResto.id)
      .eq('statut','accepte')
      .lte('date_debut',to).gte('date_fin',from)
    setCongesSemaine(cData||[])
  }

  function getConge(empId,dayIdx){
    const d = fmtDate(addDays(weekStart,dayIdx))
    return congesSemaine.find(c=>c.employe_id===empId && c.date_debut<=d && c.date_fin>=d)
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

    // Validation horaires
    const toMins = t => { const [h,m]=t.split(':').map(Number); return h*60+m }
    if(toMins(form.heure_fin) <= toMins(form.heure_debut)){
      showToast('Erreur : la fin doit être après le début'); return
    }
    if(form.coupe){
      if(!form.heure_debut_2||!form.heure_fin_2){ showToast('Remplis les horaires de la 2ème partie'); return }
      if(toMins(form.heure_debut_2) < toMins(form.heure_fin)){
        showToast('Erreur : la 2ème partie doit commencer après la fin de la 1ère'); return
      }
      if(toMins(form.heure_fin_2) <= toMins(form.heure_debut_2)){
        showToast('Erreur : la fin 2ème partie doit être après le début'); return
      }
    }
    if(existing){
      await supabase.from('shifts').update({poste:form.poste,heure_debut:form.heure_debut,heure_fin:form.heure_fin,heure_debut_2:form.coupe?form.heure_debut_2:null,heure_fin_2:form.coupe?form.heure_fin_2:null}).eq('id',existing.id)
    } else {
      await supabase.from('shifts').insert({employe_id:shiftModal.empId,date:d,poste:form.poste,heure_debut:form.heure_debut,heure_fin:form.heure_fin,heure_debut_2:form.coupe?form.heure_debut_2:null,heure_fin_2:form.coupe?form.heure_fin_2:null,restaurant_id:currentResto.id,publie:false})
    }
    // Sauvegarder AVANT setShiftModal(null)
    const _empId = shiftModal.empId
    const _dayIdx = shiftModal.dayIdx
    const _existing = shiftModal.existing
    const _debut = form.heure_debut
    const _fin = form.heure_fin
    setShiftModal(null);loadShifts();showToast('Shift enregistré')
    // Notification
    setPendingEmp(s=>new Set([...s,_empId]))
  }
    const parseL2 = str=>{ const [y,m,d]=str.split('-').map(Number); return new Date(y,m-1,d) }
  async function executerCopie(){
    const srcMonday = getMonday(parseL2(copierForm.sourceWeek||fmtDateLocal(weekStart)))
    const destList = copierForm.destWeeks||[]
    if(!destList.length){showToast('Choisissez au moins une semaine de destination');return}
    const from = fmtDateLocal(srcMonday)
    const to = fmtDateLocal(addDays(srcMonday,6))
    let q = supabase.from('shifts').select('*').eq('restaurant_id',currentResto.id).gte('date',from).lte('date',to)
    if(copierForm.employe) q = q.eq('employe_id',copierForm.employe)
    const {data:srcShifts} = await q
    if(!srcShifts?.length){showToast('Aucun shift sur cette semaine source');return}
    let count=0, skip=0
    for(const destWeekStr of destList){
      const dstMonday = getMonday(parseL2(destWeekStr))
      const dstFrom = fmtDateLocal(dstMonday)
      const dstTo = fmtDateLocal(new Date(dstMonday.getFullYear(),dstMonday.getMonth(),dstMonday.getDate()+6))
      if(dstFrom===from){showToast('Source et destination identiques');continue}
      // Charger tous les shifts existants de la semaine destination
      const {data:existingShifts}=await supabase.from('shifts').select('employe_id,date').eq('restaurant_id',currentResto.id).eq('supprime_en_attente',false).eq('publie',true).gte('date',dstFrom).lte('date',dstTo)
      const existingSet=new Set((existingShifts||[]).map(e=>e.employe_id+'_'+e.date))
      // Calculer le décalage
      const srcDay=srcMonday.getDate(), dstDay=dstMonday.getDate()
      const srcMonth=srcMonday.getMonth(), dstMonth=dstMonday.getMonth()
      const srcYear=srcMonday.getFullYear(), dstYear=dstMonday.getFullYear()
      const srcMs=new Date(srcYear,srcMonth,srcDay).getTime()
      const dstMs=new Date(dstYear,dstMonth,dstDay).getTime()
      const diffDays=Math.round((dstMs-srcMs)/86400000)
      for(const s of srcShifts){
        const [sy,sm,sd]=s.date.split('-').map(Number)
        const newD=new Date(sy,sm-1,sd+diffDays)
        const newDate=fmtDateLocal(newD)
        if(existingSet.has(s.employe_id+'_'+newDate)){skip++;continue}
        await supabase.from('shifts').insert({employe_id:s.employe_id,date:newDate,poste:s.poste,heure_debut:s.heure_debut,heure_fin:s.heure_fin,heure_debut_2:s.heure_debut_2||null,heure_fin_2:s.heure_fin_2||null,restaurant_id:currentResto.id,publie:true,supprime_en_attente:false})
        count++
      }
    }
    setCopierModal(false)
    // Ajouter les employés à pendingEmp pour notification groupée
    const empsDupliques=new Set(srcShifts.map(s=>s.employe_id))
    setPendingEmp(prev=>new Set([...prev,...empsDupliques]))
    if(destList.length===1){ const dm=getMonday(parseL2(destList[0])); setWeekStart(dm) }
    else loadShifts()
    const who=copierForm.employe?employes.find(e=>e.id===copierForm.employe)?.prenom:'tous'
    showToast(count>0?'✅ '+count+' shifts dupliqués sur '+destList.length+' sem. pour '+who:skip>0?'Shifts déjà présents':'Aucun shift source')
  }

  async function deleteShift(){
    const _dEmpId = shiftModal.empId
    const existing = getShift(shiftModal.empId,shiftModal.dayIdx)
    if(existing) await supabase.from('shifts').update({supprime_en_attente:true}).eq('id',existing.id)
    setShiftModal(null);loadShifts();showToast('Shift retiré — publier pour appliquer')
    setPendingEmp(s=>new Set([...s,_dEmpId]))
  }
  async function addEmploye(){
    if(!empForm.prenom||!empForm.nom||!empForm.email){showToast('Remplis tous les champs');return}
    const {data:empData,error} = await supabase.from('employes').insert({prenom:empForm.prenom,nom:empForm.nom,email:empForm.email,role:empForm.role,restaurant_id:currentResto.id}).select().single()
    if(error){showToast('Erreur: '+error.message);return}
    showToast("Envoi de l'invitation...")
    const {data:fnData,error:fnErr} = await supabase.functions.invoke('create-employe',{
      body:{email:empForm.email,password:'',skip_employe:true,employe_id:empData.id}
    })
    if(fnErr||fnData?.error) showToast('Employé ajouté — erreur invitation: '+(fnData?.error||fnErr?.message))
    else{
      await supabase.from('employes').update({a_un_compte:true}).eq('id',empData.id)
      showToast(empForm.prenom+' ajouté — invitation envoyée !')
    }
    setEmpModal(false);setEmpForm({prenom:'',nom:'',email:'',role:'Serveur / Serveuse',password:''})
    loadAll()
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

  async function sendInvitation(emp){
    showToast("Envoi du lien...")
    const dejaUnCompte = !!profilsMap[emp.id]
    if(dejaUnCompte){
      // Employé existant → lien de réinitialisation de mot de passe
      const {error} = await supabase.auth.resetPasswordForEmail(emp.email,{
        redirectTo: window.location.origin+'/login'
      })
      if(error) showToast('Erreur: '+error.message)
      else showToast('Lien de connexion envoyé à '+emp.email+' !')
    } else {
      // Nouvel employé → invitation
      const {data,error} = await supabase.functions.invoke('create-employe',{
        body:{email:emp.email,password:'',skip_employe:true,employe_id:emp.id}
      })
      if(error||data?.error) showToast('Erreur: '+(data?.error||error?.message))
      else{
        await supabase.from('employes').update({a_un_compte:true}).eq('id',emp.id)
        showToast('Invitation envoyée à '+emp.email+' !')
        loadAll(selectedDate)
      }
    }
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
    {bg:'#fff1f3',color:'#C41040',border:'#fda4af'},
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

  const viewTitle = view==='planning'?'Planning':view==='presences'?'Présences du jour':view==='employes'?'Équipe':view==='conges'?'Congés':view==='signalements'?'Signalements':'Paramètres'

  return (
    <div style={{display:'flex',height:'100dvh',fontFamily:'var(--font)',overflow:'hidden',flexDirection:isMobile?'column':'row'}}>

      {/* SIDEBAR DESKTOP */}
      {!isMobile && (
      <div style={{width:220,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'18px 10px',flexShrink:0}}>
        {trialStatut==='trial' && trialDaysLeft !== null && (
          <div style={{background:trialDaysLeft<=3?'#fef2f2':'#fff7ed',border:`1px solid ${trialDaysLeft<=3?'#fecaca':'#fed7aa'}`,borderRadius:10,padding:'10px 12px',marginBottom:12,textAlign:'center'}}>
            <div style={{fontSize:12,fontWeight:700,color:trialDaysLeft<=3?'#dc2626':'#ea580c'}}>
              {trialDaysLeft===0?'Dernier jour !':trialDaysLeft===1?'1 jour restant':`${trialDaysLeft} jours d'essai`}
            </div>
            <a href="/?contact=1" style={{fontSize:11,color:trialDaysLeft<=3?'#dc2626':'#ea580c',textDecoration:'none',fontWeight:600}}>
              Activer mon compte →
            </a>
          </div>
        )}
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 8px',marginBottom:8}}>
            <div><div style={{fontSize:15,fontWeight:800}}><Logo height={28}/></div><div style={{fontSize:11,color:'var(--text3)'}}>Dashboard gérant</div></div>
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
          {id:'conges',icon:'🏖️',label:'Congés'},
          {id:'signalements',icon:'🔔',label:'Signalements'},
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
            <div style={{fontSize:13,fontWeight:800}}><Logo height={28}/></div>
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
            <div style={{display:'flex',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:2,gap:2}}>
              {['semaine','mois'].map(m=>(
                <button key={m} onClick={()=>setPlanningMode(m)} style={{padding:'5px 12px',borderRadius:6,border:'none',background:planningMode===m?'var(--surface)':'transparent',color:planningMode===m?'var(--text)':'var(--text2)',fontSize:12,fontWeight:planningMode===m?700:500,cursor:'pointer'}}>
                  {m==='semaine'?'Semaine':'Mois'}
                </button>
              ))}
            </div>
            {planningMode==='semaine'&&<div style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:3}}>
              <button onClick={()=>setWeekStart(addDays(weekStart,-7))} style={{width:26,height:26,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',fontSize:14,color:'var(--text2)'}}>‹</button>
              <span style={{fontSize:13,fontWeight:600,padding:'0 8px'}}>{weekLabel}</span>
              <button onClick={()=>setWeekStart(addDays(weekStart,7))} style={{width:26,height:26,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',fontSize:14,color:'var(--text2)'}}>›</button>
            </div>}
            {planningMode==='mois'&&<div style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:3}}>
              <button onClick={()=>setMoisDate(new Date(moisDate.getFullYear(),moisDate.getMonth()-1,1))} style={{width:26,height:26,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',fontSize:14,color:'var(--text2)'}}>‹</button>
              <span style={{fontSize:13,fontWeight:600,padding:'0 8px',textTransform:'capitalize'}}>{moisDate.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</span>
              <button onClick={()=>setMoisDate(new Date(moisDate.getFullYear(),moisDate.getMonth()+1,1))} style={{width:26,height:26,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',fontSize:14,color:'var(--text2)'}}>›</button>
            </div>}
            {/* Filtre employé */}
            <select value={filtreEmploye} onChange={e=>setFiltreEmploye(e.target.value)} style={{height:34,padding:'0 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',fontSize:12,color:'var(--text)',cursor:'pointer'}}>
              <option value=''>Tous les employés</option>
              {employes.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
            </select>
            {/* Copier semaine */}
            {planningMode==='semaine'&&<button onClick={()=>{setCopierForm({sourceWeek:fmtDateLocal(weekStart),destWeeks:[],employe:filtreEmploye||'',step:1});setCopierModal(true)}} style={{height:34,padding:'0 12px',background:'var(--bg)',color:'var(--text2)',border:'1px solid var(--border2)',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>⟳ Dupliquer</button>}
            <button onClick={async()=>{
              // Publier tous les shifts en brouillon
              const {data:brouillons}=await supabase.from('shifts').select('id,employe_id').eq('restaurant_id',currentResto.id).eq('publie',false)
              if(!brouillons?.length&&pendingEmp.size===0){showToast('Aucun changement à publier');return}
              if(brouillons?.length) await supabase.from('shifts').update({publie:true}).eq('restaurant_id',currentResto.id).eq('publie',false)
              // Vraiment supprimer les shifts en attente de suppression
              await supabase.from('shifts').delete().eq('restaurant_id',currentResto.id).eq('supprime_en_attente',true)
              // Notifier les employés concernés
              const empANotifier=new Set([...pendingEmp,...(brouillons||[]).map(s=>s.employe_id)])
              for(const empId of empANotifier){
                await supabase.from('notifications').insert({employe_id:empId,restaurant_id:currentResto.id,type:'planning',titre:'📅 Planning mis à jour',message:'Votre responsable a publié votre planning. Consultez vos nouveaux horaires.'})
              }
              setPendingEmp(new Set())
              loadShifts()
              showToast('✅ Planning publié — '+empANotifier.size+' employé'+(empANotifier.size>1?'s':'')+' notifié'+(empANotifier.size>1?'s':''))
            }} style={{height:34,padding:'0 14px',background:pendingEmp.size>0?'var(--accent)':'var(--border)',color:pendingEmp.size>0?'white':'var(--text2)',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',position:'relative'}}>
              Publier{pendingEmp.size>0&&<span style={{position:'absolute',top:-6,right:-6,minWidth:18,height:18,borderRadius:9,background:'#dc2626',color:'white',fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid white',padding:'0 3px'}}>{pendingEmp.size}</span>}
            </button>
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
          {planningMode==='mois'&&<PlanningMois employes={employes} shifts={shiftsMonth} congesSemaine={congesMonth} shiftColors={shiftColors} today={today} moisDate={moisDate} setMoisDate={setMoisDate} onCellClick={(day)=>{setPlanningMode('semaine');setWeekStart(getMonday(day))}} filtreEmploye={filtreEmploye}/>}
          {planningMode==='semaine'&&isMobile&&(
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
          )}
          {planningMode==='semaine'&&!isMobile&&(
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
              {employes.filter(e=>!filtreEmploye||e.id===filtreEmploye).map((emp,ei)=>{
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
                          {(()=>{
                            const conge=getConge(emp.id,di)
                            if(sh) return <div style={{borderRadius:7,padding:'5px 7px',width:'100%',fontSize:10,fontWeight:700,background:sh.supprime_en_attente?'#fef2f2':sc.bg,color:sh.supprime_en_attente?'#dc2626':sc.color,border:`1.5px solid ${sh.supprime_en_attente?'#fecaca':sh.publie===false?'#E11D48':sc.border}`,opacity:sh.supprime_en_attente?.6:sh.publie===false?.8:1,position:'relative',textDecoration:sh.supprime_en_attente?'line-through':'none'}}>{sh.publie===false&&!sh.supprime_en_attente&&<div style={{position:'absolute',top:-4,right:-4,fontSize:8,fontWeight:800,background:'#E11D48',color:'white',borderRadius:4,padding:'1px 4px',border:'1px solid white'}}>Brouillon</div>}{sh.supprime_en_attente&&<div style={{position:'absolute',top:-4,right:-4,fontSize:8,fontWeight:800,background:'#dc2626',color:'white',borderRadius:4,padding:'1px 4px',border:'1px solid white'}}>À retirer</div>}<div>{sh.poste[0].toUpperCase()+sh.poste.slice(1)}</div><div style={{fontWeight:400,opacity:.75,fontSize:9}}>{sh.heure_debut.slice(0,5)}–{sh.heure_fin.slice(0,5)}</div>{sh.heure_debut_2&&sh.heure_fin_2&&<div style={{fontWeight:400,opacity:.65,fontSize:9,borderTop:`1px solid ${sc.border}`,marginTop:2,paddingTop:2}}>{sh.heure_debut_2.slice(0,5)}–{sh.heure_fin_2.slice(0,5)}</div>}</div>
                            if(conge){
                              const hasShiftToo = !!sh
                              return <div style={{borderRadius:7,padding:'5px 7px',width:'100%',fontSize:10,fontWeight:700,background:'#fef2f2',color:'#dc2626',border:`1.5px solid ${hasShiftToo?'#dc2626':'#fecaca'}`,cursor:'default',position:'relative'}} onClick={e=>e.stopPropagation()}>
                                {hasShiftToo&&<div style={{position:'absolute',top:-4,right:-4,width:14,height:14,borderRadius:'50%',background:'#dc2626',color:'white',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px solid white'}}>!</div>}
                                <div>Congé</div>
                                <div style={{fontWeight:400,opacity:.8,fontSize:9}}>{({conge_paye:'Payé',rtt:'RTT',maladie:'Maladie',sans_solde:'Sans solde',autre:'Autre'})[conge.type]||conge.type}</div>
                                {hasShiftToo&&<div style={{fontSize:8,color:'#dc2626',fontWeight:700,marginTop:2}}>⚠️ Shift actif</div>}
                              </div>
                            }
                            return <div style={{width:'100%',height:30,border:'1.5px dashed var(--border2)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:18}}>+</div>
                          })()}
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
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
              {!isMobile&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr 80px 100px 140px 130px',padding:'9px 16px',background:'var(--bg)',borderBottom:'2px solid var(--border)',gap:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text2)'}}>EMPLOYÉ</div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',textAlign:'center'}}>SHIFTS</div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',textAlign:'center'}}>PRÉSENCE</div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',textAlign:'center'}}>CONNEXION APP</div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',textAlign:'center'}}>ACTIONS</div>
                </div>
              )}
              {employes.map((emp,i)=>{
                const c=COLORS[i%COLORS.length]
                const sc=shifts.filter(s=>s.employe_id===emp.id).length
                const hasAccount=profilsMap[emp.id]
                const present=isPresent(emp.id)
                const lastSeen=emp.derniere_connexion?new Date(emp.derniere_connexion):null
                const diffDays=lastSeen?Math.floor((new Date()-lastSeen)/(1000*60*60*24)):null
                const connLabel=!hasAccount?'Sans compte':lastSeen===null?'Jamais':
                  lastSeen.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+lastSeen.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
                const connColor=!hasAccount?'#6b7280':lastSeen===null?'#ea580c':diffDays<=1?'#16a34a':diffDays<=7?'#E11D48':'#6b7280'
                const connBg=!hasAccount?'#f3f4f6':lastSeen===null?'#fff7ed':diffDays<=1?'#f0fdf4':diffDays<=7?'#fff1f3':'#f3f4f6'
                const connBc=!hasAccount?'#e5e7eb':lastSeen===null?'#fed7aa':diffDays<=1?'#bbf7d0':diffDays<=7?'#fecdd3':'#e5e7eb'
  // ── TRIAL CHECKS ──
  if(trialStatut === 'loading') return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'#aaa'}}>Chargement...</div>
  if(trialStatut === 'expired') return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'white',borderRadius:20,padding:'48px 40px',maxWidth:460,width:'100%',textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #e8eaf0'}}>
        <div style={{fontSize:48,marginBottom:16}}>⏰</div>
        <h1 style={{fontSize:24,fontWeight:900,color:'#0C1A35',marginBottom:8}}>Votre essai est terminé</h1>
        <p style={{fontSize:15,color:'#64748b',lineHeight:1.7,marginBottom:32}}>Vos 14 jours d'essai gratuit sont écoulés. Contactez-nous pour continuer à utiliser Varman.</p>
        <a href='/?contact=1' style={{display:'block',width:'100%',padding:'14px',borderRadius:12,background:'#E11D48',color:'white',fontSize:15,fontWeight:700,textDecoration:'none',marginBottom:10,textAlign:'center'}}>Continuer avec Varman →</a>
        <button onClick={()=>{supabase.auth.signOut();window.location.href='/'}} style={{width:'100%',padding:'12px',borderRadius:12,border:'1px solid #e8eaf0',background:'white',color:'#64748b',fontSize:14,fontWeight:600,cursor:'pointer'}}>Se déconnecter</button>
      </div>
    </div>
  )

  if(isMobile) return (
                  <div key={emp.id} style={{padding:'11px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <div style={{width:34,height:34,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800}}>{ini(emp.prenom,emp.nom)}</div>
                      {present&&<div style={{position:'absolute',bottom:0,right:0,width:8,height:8,borderRadius:'50%',background:'#22c55e',border:'1.5px solid var(--surface)'}}/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{emp.prenom} {emp.nom}</div>
                      <div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:connBg,color:connColor,border:`1px solid ${connBc}`,flexShrink:0}}>{connLabel}</span>
                    <button onClick={()=>openEditEmp(emp)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:11,cursor:'pointer',flexShrink:0}}>✏️</button>
                  </div>
                )
                return (
                  <div key={emp.id} style={{display:'grid',gridTemplateColumns:'1fr 80px 100px 140px 130px',padding:'9px 16px',borderBottom:'1px solid var(--border)',gap:8,alignItems:'center',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                      <div style={{position:'relative',flexShrink:0}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{ini(emp.prenom,emp.nom)}</div>
                        {present&&<div style={{position:'absolute',bottom:0,right:0,width:8,height:8,borderRadius:'50%',background:'#22c55e',border:'2px solid var(--surface)'}}/>}
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{emp.prenom} {emp.nom}</div>
                        <div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div>
                    {notifsNonLues[emp.id]>0&&<span onClick={e=>{e.stopPropagation();loadNotifsDetail(emp.id,emp.prenom+' '+emp.nom)}} style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',marginLeft:4,cursor:'pointer'}}>🔔 {notifsNonLues[emp.id]} non lu{notifsNonLues[emp.id]>1?'es':''}</span>}
                      </div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <span style={{fontSize:13,fontWeight:800,color:'var(--accent)'}}>{sc}</span>
                      <span style={{fontSize:10,color:'var(--text3)'}}>/sem</span>
                    </div>
                    <div style={{textAlign:'center'}}>
                      {present
                        ?<span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0'}}>● Présent</span>
                        :<span style={{fontSize:11,color:'var(--text3)'}}>—</span>}
                    </div>
                    <div style={{textAlign:'center'}}>
                      <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:connBg,color:connColor,border:`1px solid ${connBc}`}}>{connLabel}</span>
                    </div>
                    <div style={{display:'flex',gap:5,justifyContent:'center'}}>
                      <button onClick={()=>openEditEmp(emp)} style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer'}}>✏️ Modifier</button>
                      <button onClick={()=>supprimerEmploye(emp.id)} style={{padding:'5px 8px',borderRadius:8,border:'none',background:'var(--red-bg)',color:'var(--red)',fontSize:11,cursor:'pointer'}}>🗑️</button>
                    </div>
                  </div>
                )
              })}
              <div onClick={()=>setEmpModal(true)} style={{padding:'11px 16px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',color:'var(--accent)',transition:'background .1s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--accent-bg)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:32,height:32,borderRadius:'50%',border:'2px dashed var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'var(--accent)',flexShrink:0}}>+</div>
                <span style={{fontSize:13,fontWeight:600}}>Ajouter un employé</span>
              </div>
            </div>
          </div>
        )}
        {/* VUE PARAMETRES */}
        {view==='notifs'&&(
          <div style={{flex:1,overflowY:'auto',padding:20}}>
          </div>
        )}
        {view==='notifs'&&(
          <div style={{flex:1,overflowY:'auto',padding:20}}>
          </div>
        )}
        {view==='signalements'&&(
          <div style={{flex:1,overflowY:'auto',padding:20}}>
            <SignalementsGerant restaurant={currentResto} employes={employes}/>
          </div>
        )}
        {view==='conges'&&(
          <div style={{padding:16}}>
            <CongesGerant restaurant={currentResto} employes={employes} showToast={showToast}/>
          </div>
        )}
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
            {id:'conges',icon:'🏖️',label:'Congés'},
          {id:'signalements',icon:'🔔',label:'Signalements'},
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
            {/* Shift coupé toggle */}
            <div style={{marginBottom:12}}>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'10px 14px',background:form.coupe?'#f0fdf4':'var(--bg)',border:'1px solid var(--border)',borderRadius:10,transition:'all .2s'}}>
                <input type="checkbox" checked={form.coupe} onChange={e=>setForm(f=>({...f,coupe:e.target.checked,heure_debut_2:e.target.checked?'14:00':'',heure_fin_2:e.target.checked?'18:00':''}))} style={{width:16,height:16,accentColor:'#16a34a',cursor:'pointer'}}/>
                <span style={{fontSize:13,fontWeight:600,color:form.coupe?'#16a34a':'var(--text)'}}>Shift coupé (2 plages horaires)</span>
              </label>
            </div>
            {/* 2ème plage horaire */}
            {form.coupe&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16,padding:12,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12}}>
                <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#16a34a',marginBottom:4}}>2ÈME PLAGE HORAIRE</div>
                {['heure_debut_2','heure_fin_2'].map(fld=>(
                  <div key={fld}>
                    <label style={{display:'block',fontSize:11,fontWeight:700,color:'#16a34a',marginBottom:5}}>{fld==='heure_debut_2'?'Début':'Fin'}</label>
                    <input type="time" value={form[fld]} onChange={e=>setForm(f=>({...f,[fld]:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid #bbf7d0',background:'white',fontSize:13,color:'#111',outline:'none'}}/>
                  </div>
                ))}
              </div>
            )}
            {/* Boutons */}
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
            {!profilsMap[editEmpModal.id] ? (
              <div style={{marginBottom:16}}>
                <div style={{padding:'10px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)',marginBottom:8,fontSize:12,color:'var(--text2)'}}>
                  📧 L'employé recevra un email pour définir son mot de passe
                </div>
                <button onClick={()=>sendInvitation(editEmpModal)} style={{width:'100%',padding:'10px',borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  📨 Envoyer l'invitation par email
                </button>
              </div>
            ) : (
              <div style={{marginBottom:16}}>
                <div style={{padding:'10px 12px',background:'var(--green-bg)',borderRadius:10,marginBottom:8,fontSize:12,color:'#1a6b35',fontWeight:600}}>
                  ✓ Cet employé a un compte app
                </div>
                <button onClick={()=>sendInvitation(editEmpModal)} style={{width:'100%',padding:'10px',borderRadius:10,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  🔄 Renvoyer un lien de connexion
                </button>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setEditEmpModal(null)} style={{flex:1,height:42,borderRadius:10,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:700,cursor:'pointer'}}>Annuler</button>
              <button onClick={updateEmploye} style={{flex:1,height:42,borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFS NON LUES */}
      {notifsDetail&&(
        <div onClick={()=>setNotifsDetail(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:24,width:380,maxHeight:'80vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,.15)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <div style={{fontSize:15,fontWeight:800}}>🔔 Notifications non lues</div>
                <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{notifsDetail.nom}</div>
              </div>
              <button onClick={()=>setNotifsDetail(null)} style={{width:30,height:30,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--bg)',cursor:'pointer',fontSize:13}}>✕</button>
            </div>
            {notifsDetail.notifs.length===0?(
              <div style={{textAlign:'center',padding:'20px',color:'var(--text3)',fontSize:13}}>✅ Toutes les notifs ont été lues</div>
            ):notifsDetail.notifs.map((n,i)=>(
              <div key={n.id} style={{padding:'12px 14px',background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:12,marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{n.titre}</div>
                {n.message&&<div style={{fontSize:12,color:'var(--text2)',lineHeight:1.5,marginBottom:4}}>{n.message}</div>}
                <div style={{fontSize:10,color:'var(--text3)'}}>{new Date(n.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* MODAL DUPLIQUER - STEPPER */}
      {copierModal&&(()=>{
        const step=copierForm.step||1
        const srcStart=getMonday(new Date((copierForm.sourceWeek||fmtDate(addDays(weekStart,-7)))+'T00:00:00'))
        const dstStart=getMonday(new Date((copierForm.destWeek||fmtDate(weekStart))+'T00:00:00'))
        const srcLabel=fmtLabel(srcStart)+' – '+fmtLabel(addDays(srcStart,6))
        const dstLabel=fmtLabel(dstStart)+' – '+fmtLabel(addDays(dstStart,6))
        const empNom=copierForm.employe?(employes.find(e=>e.id===copierForm.employe)?.prenom||''):'Toute l\'équipe'
        return (
        <div onClick={()=>setCopierModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:20,padding:28,width:400,boxShadow:'0 8px 40px rgba(0,0,0,.15)',maxHeight:'90vh',overflowY:'auto'}}>

            {/* Indicateur étapes */}
            <div style={{display:'flex',alignItems:'center',marginBottom:24}}>
              {[{n:1,l:'Pour qui'},{n:2,l:'Semaine source'},{n:3,l:'Destination'}].map((s,i)=>(
                <div key={s.n} style={{display:'flex',alignItems:'center',flex:i<2?1:'auto'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:step>s.n?'#16a34a':step===s.n?'var(--accent)':'var(--border)',color:step>=s.n?'white':'var(--text3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{step>s.n?'✓':s.n}</div>
                    <div style={{fontSize:10,fontWeight:600,color:step>=s.n?'var(--accent)':'var(--text3)',whiteSpace:'nowrap'}}>{s.l}</div>
                  </div>
                  {i<2&&<div style={{flex:1,height:2,background:step>s.n+0?'var(--accent)':'var(--border)',margin:'0 8px',marginBottom:16}}/>}
                </div>
              ))}
            </div>

            {step===1&&<>
              <div style={{fontSize:15,fontWeight:800,marginBottom:16}}>Pour qui dupliquer ?</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24,maxHeight:280,overflowY:'auto'}}>
                {[{id:'',label:"Toute l'équipe",sub:'Tous les employés',icon:'👥'},...employes.map((e,i)=>({id:e.id,label:e.prenom+' '+e.nom,sub:e.role,icon:null,c:COLORS[i%COLORS.length]}))].map(item=>(
                  <div key={item.id} onClick={()=>setCopierForm(f=>({...f,employe:item.id}))} style={{padding:'12px 14px',borderRadius:12,border:'2px solid '+(copierForm.employe===item.id?'var(--accent)':'var(--border)'),background:copierForm.employe===item.id?'var(--accent-bg)':'var(--bg)',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
                    {item.icon?<div style={{width:32,height:32,borderRadius:'50%',background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{item.icon}</div>
                    :<div style={{width:32,height:32,borderRadius:'50%',background:item.c?.bg,color:item.c?.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{item.label.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div>}
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:copierForm.employe===item.id?'var(--accent)':'var(--text)'}}>{item.label}</div><div style={{fontSize:11,color:'var(--text3)'}}>{item.sub}</div></div>
                    {copierForm.employe===item.id&&<span style={{color:'var(--accent)',fontSize:16}}>✓</span>}
                  </div>
                ))}
              </div>
              <button onClick={()=>setCopierForm(f=>({...f,step:2}))} style={{width:'100%',height:44,borderRadius:11,border:'none',background:'var(--accent)',color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Suivant →</button>
            </>}

            {(step===2||step===3)&&(()=>{
              const isSource = step===2
              const currentWeekStr = isSource ? (copierForm.sourceWeek||fmtDateLocal(weekStart)) : fmtDateLocal(weekStart)
              const parseL = s=>{ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d) }
              const selMonday = getMonday(parseL(currentWeekStr))
              const selLabel = fmtLabel(selMonday)+' – '+fmtLabel(addDays(selMonday,6))

              // Calendrier mensuel picker
              const CalPicker = ()=>{
                const cy=calMonth.getFullYear(), cm=calMonth.getMonth()
                const mStart=new Date(cy,cm,1), mEnd=new Date(cy,cm+1,0)
                const firstDow=mStart.getDay()===0?6:mStart.getDay()-1
                const cells=[]
                for(let i=0;i<firstDow;i++)cells.push(null)
                for(let i=1;i<=mEnd.getDate();i++)cells.push(new Date(cy,cm,i))
                while(cells.length%7!==0)cells.push(null)
                // Grouper par semaine
                const weeks=[]
                for(let i=0;i<cells.length;i+=7){
                  const wDays=cells.slice(i,i+7).filter(Boolean)
                  if(wDays.length>0) weeks.push(getMonday(wDays[0]))
                }
                return (
                  <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginBottom:12}}>
                    <div style={{display:'flex',alignItems:'center',marginBottom:10}}>
                      <button onClick={()=>setCalMonth(new Date(cy,cm-1,1))} style={{width:28,height:28,borderRadius:7,border:'1px solid var(--border)',background:'var(--bg)',cursor:'pointer',fontSize:14}}>‹</button>
                      <div style={{flex:1,textAlign:'center',fontSize:13,fontWeight:700,textTransform:'capitalize'}}>{calMonth.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</div>
                      <button onClick={()=>setCalMonth(new Date(cy,cm+1,1))} style={{width:28,height:28,borderRadius:7,border:'1px solid var(--border)',background:'var(--bg)',cursor:'pointer',fontSize:14}}>›</button>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      {weeks.map((wMon,wi)=>{
                        const wLabel=fmtLabel(wMon)+' – '+fmtLabel(addDays(wMon,6))
                        const isSelected=fmtDateLocal(wMon)===fmtDateLocal(selMonday)
                        const isSelDest = !isSource && (copierForm.destWeeks||[]).includes(fmtDateLocal(wMon))
                        return <button key={wi} onClick={()=>{
                          if(isSource){setCopierForm(f=>({...f,sourceWeek:fmtDateLocal(wMon)}));setCalPicker(null)}
                          else {
                            setCopierForm(f=>{
                              const dws=f.destWeeks||[]
                              const k=fmtDateLocal(wMon)
                              return {...f,destWeeks:dws.includes(k)?dws.filter(x=>x!==k):[...dws,k]}
                            })
                          }
                        }} style={{padding:'8px 12px',borderRadius:8,border:'none',background:(isSelected&&isSource)||isSelDest?'var(--accent)':'var(--bg)',color:(isSelected&&isSource)||isSelDest?'white':'var(--text)',fontSize:12,fontWeight:(isSelected&&isSource)||isSelDest?700:500,cursor:'pointer',textAlign:'left',transition:'background .1s',display:'flex',alignItems:'center',gap:8}}
                        onMouseEnter={e=>{if(!(isSelected&&isSource)&&!isSelDest)e.currentTarget.style.background='var(--border)'}}
                        onMouseLeave={e=>{if(!(isSelected&&isSource)&&!isSelDest)e.currentTarget.style.background='var(--bg)'}}>
                          {!isSource&&<div style={{width:16,height:16,borderRadius:4,border:'2px solid '+(isSelDest?'white':'var(--border2)'),background:isSelDest?'white':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{isSelDest&&<span style={{color:'var(--accent)',fontSize:10,fontWeight:900}}>✓</span>}</div>}
                          {wLabel}
                        </button>
                      })}
                    </div>
                  </div>
                )
              }

              return <>
                <div style={{fontSize:15,fontWeight:800,marginBottom:6}}>{isSource?'Semaine à copier':'Semaine de destination'}</div>
                <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>{isSource?`Pour : `:'Copie de '}<strong>{isSource?empNom:srcLabel}</strong></div>

                {/* Sélecteur semaine — cliquable pour ouvrir calendrier */}
                <div onClick={()=>{setCalPicker(isSource?'source':'dest');setCalMonth(selMonday)}}
                  style={{display:'flex',alignItems:'center',gap:8,background:isSource?'var(--bg)':'var(--accent-bg)',border:`1.5px solid ${isSource?'var(--border2)':'var(--accent)'}`,borderRadius:12,padding:'14px 16px',marginBottom:8,cursor:'pointer',transition:'all .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  <span style={{fontSize:20}}>📅</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:isSource?'var(--text)':'var(--accent)'}}>
                      {isSource?selLabel:(copierForm.destWeeks?.length>0?copierForm.destWeeks.length+' semaine'+(copierForm.destWeeks.length>1?'s':'')+" sélectionnée"+(copierForm.destWeeks.length>1?'s':''):'Aucune semaine choisie')}
                    </div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>{isSource?'Cliquez pour choisir':'Cochez les semaines à remplir'}</div>
                  </div>
                  <span style={{fontSize:12,color:'var(--text3)'}}>▼</span>
                </div>

                {/* Calendrier picker */}
                {calPicker===(isSource?'source':'dest')&&<CalPicker/>}

                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button onClick={()=>{setCopierForm(f=>({...f,step:isSource?1:2}));setCalPicker(null)}} style={{flex:1,height:44,borderRadius:11,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:13,fontWeight:600,cursor:'pointer'}}>← Retour</button>
                  {isSource
                    ?<button onClick={()=>{setCopierForm(f=>({...f,step:3}));setCalPicker(null)}} style={{flex:2,height:44,borderRadius:11,border:'none',background:'var(--accent)',color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Suivant →</button>
                    :<button onClick={executerCopie} style={{flex:2,height:44,borderRadius:11,border:'none',background:'#16a34a',color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>✓ Dupliquer</button>
                  }
                </div>
              </>
            })()}

          </div>
        </div>
        )
      })()}
      {toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:'var(--text)',color:'white',padding:'9px 20px',borderRadius:20,fontSize:13,fontWeight:600,zIndex:300,whiteSpace:'nowrap'}}>{toast}</div>}
    </div>
  )
}
