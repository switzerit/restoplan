import Logo from '../components/Logo'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
const COLORS=[{bg:'#fff1f3',color:'#0051a8'},{bg:'#f0faf3',color:'#1a6b35'},{bg:'#fff8ee',color:'#8a4a00'},{bg:'#f0f0fc',color:'#3a3880'},{bg:'#fff2f1',color:'#b02020'},{bg:'#fdf0f8',color:'#8a2060'}]
function ini(p,n){return((p?.[0]||"")+(n?.[0]||"")).toUpperCase()}

const SECTEURS=[
  {id:'restaurant',l:'🍽️ Restaurant'},
  {id:'hotel',l:'🏨 Hôtel'},
  {id:'garage',l:'🔧 Garage'},
  {id:'commerce',l:'🏪 Commerce'},
  {id:'clinique',l:'🏥 Clinique'},
  {id:'spa',l:'💆 Spa & Salon'},
  {id:'btp',l:'🏗️ BTP'},
  {id:'logistique',l:'📦 Logistique'},
  {id:'education',l:'🎓 Éducation'},
  {id:'securite',l:'🛡️ Sécurité'},
  {id:'autre',l:'🏢 Autre'},
]

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [gerants, setGerants] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [employes, setEmployes] = useState([])
  const [selectedGerant, setSelectedGerant] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({nom_resto:"",adresse:"",secteur:"restaurant",prenom:"",nom:"",email:"",telephone:"",entreprise:"",compte_type:'trial',trial_days:14,features:{badgeage:true,conges:true,signalements:true,export_paie:true}})
  const [featuresModal, setFeaturesModal] = useState(null)
  const [featuresForm, setFeaturesForm] = useState({badgeage:true,conges:true,signalements:true,export_paie:true})
  const [editGerantModal, setEditGerantModal] = useState(null)
  const [trialModal, setTrialModal] = useState(null)
  const [trialForm, setTrialForm] = useState({statut:'trial', days:14, customDate:'', customDays:''})
  const [editGerantForm, setEditGerantForm] = useState({prenom:"",nom:"",email:"",telephone:"",entreprise:""})
  const [addRestoModal, setAddRestoModal] = useState(null)
  const [addRestoForm, setAddRestoForm] = useState({nom:"",adresse:"",secteur:"restaurant"})
  const [resetPwdModal, setResetPwdModal] = useState(null)
  const [resetPwd, setResetPwd] = useState("")
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null)
  const [toast, setToast] = useState("")
  const navigate = useNavigate()

  useEffect(()=>{checkAdmin().then(ok=>{if(ok) loadData()})},[])

  async function checkAdmin(){
    const {data:{session}} = await supabase.auth.getSession()
    if(!session){navigate("/login");return false}
    const {data:profil} = await supabase.from("profils").select("role").eq("user_id",session.user.id).single()
    if(profil?.role !== "super_admin"){navigate("/gerant");return false}
    setLoading(false)
    return true
  }

  async function saveFeatures(){
    if(!featuresModal) return
    await supabase.from('gerants').update({features:featuresForm}).eq('id',featuresModal.id)
    showToast('Fonctionnalités mises à jour ✅')
    setFeaturesModal(null)
    loadData()
  }

  async function saveTrial(){
    if(!trialModal) return
    const days = parseInt(trialForm.customDays)||trialForm.days
    const baseDate = trialModal?.statut==='trial'&&trialModal?.trial_end_at&&trialForm.statut==='trial'
      ? new Date(trialModal.trial_end_at)
      : new Date()
    const trial_end_at = trialForm.statut === 'active' ? null :
      new Date(baseDate.getTime() + days * 24*60*60*1000).toISOString()
    await supabase.from('gerants').update({
      statut: trialForm.statut,
      trial_end_at: trialForm.statut === 'active' ? null : trial_end_at
    }).eq('id', trialModal.id)
    const msg = trialForm.statut==='active'?'Compte activé ✅':trialForm.statut==='expired'?'Compte bloqué ❌':`Trial prolongé de ${trialForm.days} jours ✅`
    showToast(msg)
    // Notifier le gérant par email
    const emailType = trialForm.statut==='active'?'activated':trialForm.statut==='expired'?'expired':'trial_extended'
    const restos = restaurants.filter(r=>r.gerant_id===trialModal.user_id)
    await supabase.functions.invoke('invite-gerant',{body:{
      email: trialModal.email,
      prenom: trialModal.prenom,
      nom: trialModal.nom,
      entreprise: trialModal.entreprise,
      restaurant_nom: restos[0]?.nom||'',
      trial_days: trialForm.days,
      statut: trialForm.statut,
      type: emailType,
      trial_end_at: trialForm.statut==='trial' ? new Date(Date.now()+trialForm.days*24*60*60*1000).toISOString() : null
    }})
    setTrialModal(null)
    loadData()
  }

  async function loadData(){
    const {data:g} = await supabase.from("gerants").select("*").order("created_at",{ascending:false})
    setGerants(g||[])
    const {data:r} = await supabase.from("restaurants").select("*").order("nom")
    setRestaurants(r||[])
    const {data:e} = await supabase.from("employes").select("*").order("prenom")
    setEmployes(e||[])
  }

  async function createClient(){
    const {nom_resto,adresse,secteur,prenom,nom,email,telephone,entreprise} = createForm
    if(!nom_resto||!email||!prenom||!nom){showToast("Remplis tous les champs obligatoires");return}
        showToast("Creation en cours...")
    const {data:resto,error:restoErr} = await supabase.from("restaurants").insert({
      nom:nom_resto, adresse, secteur:secteur||'restaurant', actif:true, pin_borne:"1234"
    }).select().single()
    if(restoErr){showToast("Erreur: "+restoErr.message);return}
    const {data,error} = await supabase.functions.invoke("create-employe",{body:{email,password:"VarmanTmp2026!",prenom,nom,role:"Gerant",restaurant_id:resto.id,skip_employe:true,employe_id:null}})
    if(error||data?.error){
      let msg = data?.error || "Erreur inconnue"
      if(!data && error){
        try{const j=await error.context?.json?.();if(j?.error)msg=j.error}catch(e){}
      }
      await supabase.from("restaurants").delete().eq("id",resto.id)
      showToast("Erreur: "+msg)
      return
    }
    const newUserId = data?.user_id
    if(newUserId){
      await supabase.from("profils").update({role:"gerant",employe_id:null}).eq("user_id",newUserId)
      await supabase.from("restaurants").update({gerant_id:newUserId}).eq("id",resto.id)
      const trial_end_at = createForm.compte_type==='trial' ? new Date(Date.now()+createForm.trial_days*24*60*60*1000).toISOString() : null
      await supabase.from("gerants").insert({user_id:newUserId,prenom,nom,email,telephone,entreprise:entreprise||nom_resto,statut:createForm.compte_type,trial_end_at,features:createForm.features})
      await supabase.functions.invoke('invite-gerant',{body:{email,prenom,nom,entreprise:entreprise||nom_resto,restaurant_nom:createForm.nom_resto,trial_days:createForm.trial_days,statut:createForm.compte_type}})
    }
    setCreateModal(false)
    setCreateForm({nom_resto:"",adresse:"",secteur:"restaurant",prenom:"",nom:"",email:"",telephone:"",entreprise:"",compte_type:"trial",trial_days:14})
    await loadData()
    showToast("Client cree avec succes !")
  }

  async function updateGerant(){
    const {error} = await supabase.from("gerants").update({prenom:editGerantForm.prenom,nom:editGerantForm.nom,email:editGerantForm.email,telephone:editGerantForm.telephone,entreprise:editGerantForm.entreprise}).eq("id",editGerantModal.id)
    if(error){showToast("Erreur: "+error.message);return}
    setEditGerantModal(null);loadData();showToast("Gerant mis a jour !")
  }

  async function resetPassword(){
    if(!resetPwd||resetPwd.length<6){showToast("Mot de passe min. 6 caracteres");return}
    const {error} = await supabase.functions.invoke("reset-password",{body:{email:resetPwdModal.email,new_password:resetPwd}})
    if(error){showToast("Erreur: "+error.message);return}
    setResetPwdModal(null);setResetPwd("");showToast("Mot de passe reinitialise !")
  }

  async function deleteGerant(g){
    setDeleteConfirmModal(null);showToast("Suppression en cours...")
    const restos = restaurants.filter(r=>r.gerant_id===g.user_id)
    for(const r of restos){
      await supabase.from("shifts").delete().eq("restaurant_id",r.id)
      await supabase.from("pointages").delete().eq("restaurant_id",r.id)
      await supabase.from("employes").delete().eq("restaurant_id",r.id)
      await supabase.from("restaurants").delete().eq("id",r.id)
    }
    await supabase.from("profils").delete().eq("user_id",g.user_id)
    await supabase.from("gerants").delete().eq("id",g.id)
    await supabase.functions.invoke("delete-user",{body:{email:g.email}})
    setSelectedGerant(null);await loadData();showToast("Client supprime")
  }

  async function toggleGerant(g){
    await supabase.from("gerants").update({actif:!g.actif}).eq("id",g.id)
    const restos = restaurants.filter(r=>r.gerant_id===g.user_id)
    for(const r of restos) await supabase.from("restaurants").update({actif:!g.actif}).eq("id",r.id)
    loadData();showToast(g.actif?"Compte desactive":"Compte active")
  }

  async function addRestaurant(){
    if(!addRestoForm.nom){showToast("Nom obligatoire");return}
    await supabase.from("restaurants").insert({
      nom:addRestoForm.nom, adresse:addRestoForm.adresse,
      secteur:addRestoForm.secteur||'restaurant',
      actif:true, pin_borne:"1234", gerant_id:addRestoModal.user_id
    })
    setAddRestoModal(null);setAddRestoForm({nom:"",adresse:"",secteur:"restaurant"});loadData();showToast("Restaurant ajoute !")
  }

  async function toggleResto(r){await supabase.from("restaurants").update({actif:!r.actif}).eq("id",r.id);loadData()}

  async function deleteResto(restoId){
    if(!window.confirm("Supprimer ce restaurant ?")) return
    await supabase.from("shifts").delete().eq("restaurant_id",restoId)
    await supabase.from("pointages").delete().eq("restaurant_id",restoId)
    await supabase.from("employes").delete().eq("restaurant_id",restoId)
    await supabase.from("restaurants").delete().eq("id",restoId)
    loadData();showToast("Restaurant supprime")
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),3000)}
  async function deconnexion(){await supabase.auth.signOut();navigate("/login")}

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"var(--font)",background:"var(--bg)"}}><div style={{textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>⚡</div><div style={{color:"var(--text2)"}}>Chargement...</div></div></div>

  const inputStyle = {width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid var(--border2)",background:"var(--bg)",fontSize:13,color:"var(--text)",outline:"none"}
  const btnSecondary = {padding:"7px 14px",borderRadius:9,border:"1px solid var(--border2)",background:"var(--bg)",color:"var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer"}

  const SecteurSelect = ({value, onChange}) => (
    <select value={value} onChange={e=>onChange(e.target.value)} style={inputStyle}>
      {SECTEURS.map(s=><option key={s.id} value={s.id}>{s.l}</option>)}
    </select>
  )

  const modals = <>
    {resetPwdModal&&<div onClick={()=>setResetPwdModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:20,padding:28,width:380,boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Reinitialiser le mot de passe</div>
        <div style={{fontSize:13,color:"var(--text2)",marginBottom:20}}>{resetPwdModal.prenom} {resetPwdModal.nom} — {resetPwdModal.email}</div>
        <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:6}}>Nouveau mot de passe</label>
        <input type="password" placeholder="Min. 6 caracteres" value={resetPwd} onChange={e=>setResetPwd(e.target.value)} style={{...inputStyle,marginBottom:16}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setResetPwdModal(null)} style={{flex:1,height:42,borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Annuler</button>
          <button onClick={resetPassword} style={{flex:1,height:42,borderRadius:10,border:"none",background:"var(--accent)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>Reinitialiser</button>
        </div>
      </div>
    </div>}
    {deleteConfirmModal&&<div onClick={()=>setDeleteConfirmModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:20,padding:28,width:400,boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:4,color:"var(--red)"}}>Supprimer ce client ?</div>
        <div style={{fontSize:13,color:"var(--text2)",marginBottom:12}}>{deleteConfirmModal.prenom} {deleteConfirmModal.nom}</div>
        <div style={{padding:"12px 14px",background:"var(--red-bg)",borderRadius:10,marginBottom:20,fontSize:12,color:"var(--red)"}}>Action irreversible. Tous les restaurants, employes, shifts et pointages seront supprimes.</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setDeleteConfirmModal(null)} style={{flex:1,height:42,borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Annuler</button>
          <button onClick={()=>deleteGerant(deleteConfirmModal)} style={{flex:1,height:42,borderRadius:10,border:"none",background:"var(--red)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>Supprimer definitivement</button>
        </div>
      </div>
    </div>}
    {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"var(--text)",color:"white",padding:"10px 22px",borderRadius:22,fontSize:13,fontWeight:600,zIndex:300,whiteSpace:"nowrap"}}>{toast}</div>}
  </>

  // VUE DETAIL GERANT
  if(selectedGerant){
    const g = gerants.find(x=>x.id===selectedGerant.id)||selectedGerant
    const restos = restaurants.filter(r=>r.gerant_id===g.user_id)
    const empCount = employes.filter(e=>restos.some(r=>r.id===e.restaurant_id)).length
    return <div style={{minHeight:"100vh",background:"var(--bg)",fontFamily:"var(--font)"}}>
      <div style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"14px 28px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <button onClick={()=>setSelectedGerant(null)} style={btnSecondary}>← Retour</button>
        <div style={{width:36,height:36,background:"linear-gradient(135deg,#E11D48,#5856d6)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"white"}}>{ini(g.prenom,g.nom)}</div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800}}>{g.prenom} {g.nom}</div><div style={{fontSize:11,color:"var(--text3)"}}>{g.entreprise||"—"} • {g.email}</div></div>
        <button onClick={()=>{setEditGerantForm({prenom:g.prenom,nom:g.nom,email:g.email,telephone:g.telephone||"",entreprise:g.entreprise||""});setEditGerantModal(g)}} style={btnSecondary}>✏️ Modifier</button>
        <button onClick={()=>{setResetPwdModal(g);setResetPwd("")}} style={btnSecondary}>🔑 MDP</button>
        <button onClick={()=>toggleGerant(g)} style={{padding:"7px 14px",borderRadius:9,border:"none",background:g.actif?"var(--red-bg)":"var(--green-bg)",color:g.actif?"var(--red)":"#1a6b35",fontSize:13,fontWeight:600,cursor:"pointer"}}>{g.actif?"Desactiver":"Activer"}</button>
        <button onClick={()=>setDeleteConfirmModal(g)} style={{padding:"7px 14px",borderRadius:9,border:"none",background:"var(--red-bg)",color:"var(--red)",fontSize:13,fontWeight:600,cursor:"pointer"}}>🗑️ Supprimer</button>
        <button onClick={deconnexion} style={{...btnSecondary,background:"transparent"}}>Deconnexion</button>
      </div>
      <div style={{maxWidth:900,margin:"0 auto",padding:28}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
          {[{icon:"🏪",label:"Restaurants",value:restos.length},{icon:"👥",label:"Employes",value:empCount},{icon:"📊",label:"Statut",value:g.statut==='active'?'Actif':g.statut==='expired'?'Expiré':'Trial',color:g.statut==='active'?'var(--green)':g.statut==='expired'?'var(--red)':'#ea580c'}].map((s,i)=>(
            <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 20px"}}>
              <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
              <div style={{fontSize:24,fontWeight:800,color:s.color||"var(--text)"}}>{s.value}</div>
              <div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:"var(--text2)"}}>INFORMATIONS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{l:"Prenom",v:g.prenom},{l:"Nom",v:g.nom},{l:"Email",v:g.email},{l:"Telephone",v:g.telephone||"—"},{l:"Entreprise",v:g.entreprise||"—"},{l:"Client depuis",v:new Date(g.created_at).toLocaleDateString("fr-FR")}].map(({l,v})=>(
              <div key={l} style={{padding:"10px 14px",background:"var(--bg)",borderRadius:10}}>
                <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,marginBottom:3}}>{l.toUpperCase()}</div>
                <div style={{fontSize:13,fontWeight:600}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* TRIAL */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700}}>⏱️ Abonnement / Trial</div>
            <button onClick={()=>{setTrialForm({statut:g.statut||'trial',days:14});setTrialModal(g)}} style={{padding:"6px 14px",borderRadius:9,border:"none",background:"var(--accent)",color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>Gérer</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{padding:"10px 14px",background:"var(--bg)",borderRadius:10}}>
              <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,marginBottom:3}}>STATUT</div>
              <div style={{fontSize:13,fontWeight:700,color:g.statut==='active'?'#16a34a':g.statut==='expired'?'#dc2626':'#ea580c'}}>
                {g.statut==='active'?'✅ Actif':g.statut==='expired'?'❌ Expiré':'⏳ Trial'}
              </div>
            </div>
            <div style={{padding:"10px 14px",background:"var(--bg)",borderRadius:10}}>
              <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,marginBottom:3}}>FIN DU TRIAL</div>
              <div style={{fontSize:13,fontWeight:600}}>
                {g.trial_end_at ? new Date(g.trial_end_at).toLocaleDateString('fr-FR') : g.statut==='active' ? '—' : 'Non défini'}
              </div>
            </div>
          </div>
        </div>
        {/* FEATURES */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700}}>🧩 Fonctionnalités</div>
            <button onClick={()=>{setFeaturesForm(g.features||{badgeage:true,conges:true,signalements:true,export_paie:true});setFeaturesModal(g)}} style={{padding:"6px 14px",borderRadius:9,border:"none",background:"var(--accent)",color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>Configurer</button>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[['badgeage','📱 Badgeage QR'],['conges','🏖️ Congés'],['signalements','🔔 Signalements'],['export_paie','📄 Export paie']].map(([k,l])=>{
              const on=(g.features||{})[k]!==false
              return <span key={k} style={{fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,background:on?"var(--green-bg)":"var(--red-bg)",color:on?"#1a6b35":"var(--red)",border:`1px solid ${on?"#bbf7d0":"#fecaca"}`}}>{l} {on?'✓':'✗'}</span>
            })}
          </div>
        </div>
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:700}}>Restaurants ({restos.length})</div>
            <button onClick={()=>setAddRestoModal(g)} style={{padding:"6px 14px",borderRadius:9,border:"none",background:"var(--accent)",color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
          </div>
          {restos.length===0&&<div style={{padding:24,textAlign:"center",color:"var(--text3)",fontSize:13}}>Aucun restaurant</div>}
          {restos.map(r=>{
            const nbEmp=employes.filter(e=>e.restaurant_id===r.id).length
            const secteurLabel = SECTEURS.find(s=>s.id===r.secteur)?.l||'🍽️ Restaurant'
            return(
              <div key={r.id} style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:"var(--accent-bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{secteurLabel.split(' ')[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700}}>{r.nom}</div>
                  <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{r.adresse||"—"} • {nbEmp} employe{nbEmp>1?"s":""} • PIN: {r.pin_borne} • {secteurLabel}</div>
                </div>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:r.actif?"var(--green-bg)":"var(--red-bg)",color:r.actif?"#1a6b35":"var(--red)"}}>{r.actif?"Actif":"Inactif"}</span>
                <button onClick={()=>toggleResto(r)} style={{padding:"5px 10px",borderRadius:8,border:"1px solid var(--border2)",background:"var(--bg)",color:"var(--text2)",fontSize:11,fontWeight:600,cursor:"pointer"}}>{r.actif?"Pause":"Activer"}</button>
                <button onClick={()=>navigator.clipboard.writeText(window.location.origin+"/borne?token="+r.borne_token).then(()=>showToast("URL copiee !"))} style={{padding:"5px 10px",borderRadius:8,border:"1px solid var(--border2)",background:"var(--bg)",color:"var(--text2)",fontSize:11,fontWeight:600,cursor:"pointer"}}>URL borne</button>
                <button onClick={()=>deleteResto(r.id)} style={{padding:"5px 8px",borderRadius:8,border:"none",background:"var(--red-bg)",color:"var(--red)",fontSize:11,cursor:"pointer"}}>🗑️</button>
              </div>
            )
          })}
        </div>
        {empCount>0&&<div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)"}}><div style={{fontSize:13,fontWeight:700}}>Employes ({empCount})</div></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8,padding:12}}>
            {employes.filter(e=>restos.some(r=>r.id===e.restaurant_id)).map((emp,i)=>{const c=COLORS[i%COLORS.length];const resto=restos.find(r=>r.id===emp.restaurant_id);return(
              <div key={emp.id} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:c.bg,color:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{ini(emp.prenom,emp.nom)}</div>
                <div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emp.prenom} {emp.nom}</div><div style={{fontSize:10,color:"var(--text3)"}}>{resto?.nom}</div></div>
              </div>
            )})}
          </div>
        </div>}
      </div>
      {trialModal&&<div onClick={()=>setTrialModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:20,padding:28,width:380,boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
          <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>⏱️ Gérer le trial</div>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:12}}>{trialModal.prenom} {trialModal.nom}</div>
          {trialModal.statut==='expired'&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#dc2626",fontWeight:600}}>
            ⚠️ Ce compte est expiré depuis le {trialModal.trial_end_at?new Date(trialModal.trial_end_at).toLocaleDateString('fr-FR'):'—'}. Choisissez une action ci-dessous.
          </div>}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:8}}>STATUT</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[{v:'trial',l:'⏳ Trial en cours',d:'Accès limité dans le temps'},{v:'active',l:'✅ Compte actif',d:'Accès complet sans limite'},{v:'expired',l:'❌ Expiré',d:'Accès bloqué'}].map(({v,l,d})=>(
                <div key={v} onClick={()=>setTrialForm(f=>({...f,statut:v}))}
                  style={{padding:"10px 14px",borderRadius:10,border:`2px solid ${trialForm.statut===v?"var(--accent)":"var(--border)"}`,background:trialForm.statut===v?"var(--accent-bg)":"var(--bg)",cursor:"pointer"}}>
                  <div style={{fontSize:13,fontWeight:700,color:trialForm.statut===v?"var(--accent)":"var(--text)"}}>{l}</div>
                  <div style={{fontSize:11,color:"var(--text2)"}}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          {trialForm.statut==='trial'&&<div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:8}}>
              {trialModal?.statut==='trial'&&trialModal?.trial_end_at?'PROLONGER DE':'DURÉE DU TRIAL'}
            </div>
            {trialModal?.statut==='trial'&&trialModal?.trial_end_at&&(
              <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:"var(--text2)"}}>
                Expiration actuelle : <strong style={{color:"var(--text)"}}>{new Date(trialModal.trial_end_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</strong>
              </div>
            )}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              {[7,14,30,60].map(d=>(
                <button key={d} onClick={()=>setTrialForm(f=>({...f,days:d,customDays:''}))}
                  style={{padding:"8px 16px",borderRadius:9,border:`2px solid ${trialForm.days===d&&!trialForm.customDays?"var(--accent)":"var(--border)"}`,background:trialForm.days===d&&!trialForm.customDays?"var(--accent-bg)":"var(--bg)",color:trialForm.days===d&&!trialForm.customDays?"var(--accent)":"var(--text)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  +{d}j
                </button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <input type="number" min="1" max="365"
                placeholder="Nombre de jours personnalisé"
                value={trialForm.customDays||''}
                onChange={e=>setTrialForm(f=>({...f,customDays:e.target.value,days:parseInt(e.target.value)||f.days}))}
                style={{flex:1,padding:"8px 12px",borderRadius:9,border:`2px solid ${trialForm.customDays?"var(--accent)":"var(--border)"}`,background:"var(--bg)",color:"var(--text)",fontSize:13,outline:"none"}}/>
              <span style={{fontSize:12,color:"var(--text2)"}}>jours</span>
            </div>
            <div style={{fontSize:12,color:"var(--text2)",background:"var(--bg)",borderRadius:8,padding:"8px 12px"}}>
              {trialModal?.statut==='trial'&&trialModal?.trial_end_at
                ? <>Nouvelle expiration : <strong style={{color:"var(--accent)"}}>{new Date(new Date(trialModal.trial_end_at).getTime()+(trialForm.customDays||trialForm.days)*24*60*60*1000).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</strong></>
                : <>Expiration : <strong style={{color:"var(--accent)"}}>{new Date(Date.now()+(trialForm.customDays||trialForm.days)*24*60*60*1000).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</strong></>
              }
            </div>
          </div>}
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setTrialModal(null)} style={{flex:1,height:44,borderRadius:12,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text2)",fontSize:14,fontWeight:600,cursor:"pointer"}}>Annuler</button>
            <button onClick={saveTrial} style={{flex:2,height:44,borderRadius:12,border:"none",background:trialForm.statut==="expired"?"#dc2626":trialForm.statut==="active"?"#16a34a":"var(--accent)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>
              {trialForm.statut==='active'?'Activer':trialForm.statut==='expired'?'Bloquer':trialModal?.statut==='trial'&&trialModal?.trial_end_at?'Prolonger':'Demarrer'}
            </button>
          </div>
        </div>
      </div>}
      {featuresModal&&<div onClick={()=>setFeaturesModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:20,padding:28,width:380,boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
          <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>🧩 Fonctionnalités</div>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:20}}>{featuresModal.prenom} {featuresModal.nom}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
            {[['badgeage','📱 Badgeage QR','Borne, scan QR, présences en direct'],['conges','🏖️ Congés','Demandes et validation des congés'],['signalements','🔔 Signalements','Erreurs de pointage employés'],['export_paie','📄 Export paie','Rapports PDF pour la comptabilité']].map(([k,label,desc])=>(
              <div key={k} onClick={()=>setFeaturesForm(f=>({...f,[k]:!f[k]}))}
                style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",borderRadius:12,border:`2px solid ${featuresForm[k]!==false?"var(--accent)":"var(--border)"}`,background:featuresForm[k]!==false?"var(--accent-bg)":"var(--bg)",cursor:"pointer"}}>
                <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${featuresForm[k]!==false?"var(--accent)":"var(--border)"}`,background:featuresForm[k]!==false?"var(--accent)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {featuresForm[k]!==false&&<span style={{color:"white",fontSize:14,fontWeight:900}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:featuresForm[k]!==false?"var(--accent)":"var(--text)"}}>{label}</div>
                  <div style={{fontSize:11,color:"var(--text2)"}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setFeaturesModal(null)} style={{flex:1,height:44,borderRadius:12,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text2)",fontSize:14,fontWeight:600,cursor:"pointer"}}>Annuler</button>
            <button onClick={saveFeatures} style={{flex:2,height:44,borderRadius:12,border:"none",background:"var(--accent)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>Sauvegarder</button>
          </div>
        </div>
      </div>}
      {editGerantModal&&<div onClick={()=>setEditGerantModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:20,padding:28,width:400,boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
          <div style={{fontSize:17,fontWeight:800,marginBottom:20}}>Modifier le gerant</div>
          {[{f:"prenom",l:"Prenom"},{f:"nom",l:"Nom"},{f:"email",l:"Email"},{f:"telephone",l:"Telephone"},{f:"entreprise",l:"Entreprise"}].map(({f,l})=>(
            <div key={f} style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:5}}>{l}</label><input value={editGerantForm[f]} onChange={e=>setEditGerantForm(ff=>({...ff,[f]:e.target.value}))} style={inputStyle}/></div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <button onClick={()=>setEditGerantModal(null)} style={{flex:1,height:42,borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Annuler</button>
            <button onClick={updateGerant} style={{flex:1,height:42,borderRadius:10,border:"none",background:"var(--accent)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
          </div>
        </div>
      </div>}
      {addRestoModal&&<div onClick={()=>setAddRestoModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:20,padding:28,width:380,boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
          <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>Ajouter un etablissement</div>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:20}}>Pour {g.prenom} {g.nom}</div>
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:5}}>Secteur *</label>
            <SecteurSelect value={addRestoForm.secteur} onChange={v=>setAddRestoForm(f=>({...f,secteur:v}))}/>
          </div>
          {[{f:"nom",l:"Nom de l'etablissement *",ph:"Le Bistrot"},{f:"adresse",l:"Adresse",ph:"12 rue du Port"}].map(({f,l,ph})=>(
            <div key={f} style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:5}}>{l}</label><input placeholder={ph} value={addRestoForm[f]} onChange={e=>setAddRestoForm(ff=>({...ff,[f]:e.target.value}))} style={inputStyle}/></div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <button onClick={()=>setAddRestoModal(null)} style={{flex:1,height:42,borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Annuler</button>
            <button onClick={addRestaurant} style={{flex:1,height:42,borderRadius:10,border:"none",background:"var(--accent)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>Ajouter</button>
          </div>
        </div>
      </div>}
      {modals}
    </div>
  }

  // VUE LISTE GERANTS
  return <div style={{minHeight:"100vh",background:"var(--bg)",fontFamily:"var(--font)"}}>
    <div style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"14px 28px",display:"flex",alignItems:"center",gap:12}}>
      <svg width="28" height="20" viewBox="0 0 32 22" fill="none"><rect x="0" y="4" width="6" height="18" rx="3" fill="#E11D48"/><rect x="8.5" y="0" width="6" height="22" rx="3" fill="#E11D48"/><rect x="17" y="6" width="6" height="14" rx="3" fill="#E11D48" fillOpacity="0.4"/><rect x="25.5" y="3" width="6" height="10" rx="3" fill="#E11D48" fillOpacity="0.18"/></svg>
      <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:"var(--text)"}}>Varman Admin</div><div style={{fontSize:11,color:"var(--text3)"}}>{gerants.length} client{gerants.length>1?"s":""} • {restaurants.length} etablissement{restaurants.length>1?"s":""}</div></div>
      <button onClick={()=>setCreateModal(true)} style={{padding:"8px 18px",borderRadius:10,border:"none",background:"var(--accent)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Nouveau client</button>
      <button onClick={deconnexion} style={{padding:"8px 14px",borderRadius:10,border:"1px solid var(--border2)",background:"transparent",color:"var(--text2)",fontSize:13,cursor:"pointer",fontWeight:600}}>Deconnexion</button>
    </div>
    <div style={{maxWidth:900,margin:"0 auto",padding:28}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[{icon:"👤",label:"Clients",value:gerants.length},{icon:"🏪",label:"Etablissements actifs",value:restaurants.filter(r=>r.actif&&r.gerant_id).length},{icon:"👥",label:"Employes",value:employes.length},{icon:"✅",label:"Clients actifs",value:gerants.filter(g=>g.statut==='active').length},{icon:"⏳",label:"En trial",value:gerants.filter(g=>!g.statut||g.statut==='trial').length},{icon:"❌",label:"Expirés",value:gerants.filter(g=>g.statut==='expired'||(g.trial_end_at&&new Date(g.trial_end_at)<new Date())).length}].map((s,i)=>(
          <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 18px"}}>
            <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:22,fontWeight:800}}>{s.value}</div>
            <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {gerants.length===0&&<div style={{padding:60,textAlign:"center",background:"var(--surface)",border:"2px dashed var(--border2)",borderRadius:16}}>
          <div style={{fontSize:36,marginBottom:12}}>👤</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Aucun client encore</div>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:20}}>Creez votre premier client pour commencer</div>
          <button onClick={()=>setCreateModal(true)} style={{padding:"10px 24px",borderRadius:10,border:"none",background:"var(--accent)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Nouveau client</button>
        </div>}
        {gerants.map((g,i)=>{
          const restos=restaurants.filter(r=>r.gerant_id===g.user_id)
          const empCount=employes.filter(e=>restos.some(r=>r.id===e.restaurant_id)).length
          const c=COLORS[i%COLORS.length]
          return <div key={g.id} onClick={()=>setSelectedGerant(g)} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"18px 22px",cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,113,227,.08)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="none"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:c.bg,color:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>{ini(g.prenom,g.nom)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:15,fontWeight:800}}>{g.prenom} {g.nom}</div>
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,
                    background:g.statut==='active'?"var(--green-bg)":g.statut==='expired'?"var(--red-bg)":"#fff7ed",
                    color:g.statut==='active'?"#1a6b35":g.statut==='expired'?"var(--red)":"#ea580c"
                  }}>{g.statut==='active'?'✅ Actif':g.statut==='expired'?'❌ Expiré':'⏳ Trial'}</span>
                </div>
                <div style={{fontSize:12,color:"var(--text2)",marginTop:3}}>{g.entreprise||"—"} • {g.email}</div>
                {g.telephone&&<div style={{fontSize:11,color:"var(--text3)",marginTop:1}}>📞 {g.telephone}</div>}
              </div>
              <div style={{display:"flex",gap:20,marginRight:12}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"var(--accent)"}}>{restos.length}</div><div style={{fontSize:10,color:"var(--text3)"}}>etabl.</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800}}>{empCount}</div><div style={{fontSize:10,color:"var(--text3)"}}>emp.</div></div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",maxWidth:200}}>
                {restos.map(r=>{
                  const sl = SECTEURS.find(s=>s.id===r.secteur)?.l||'🍽️'
                  return <span key={r.id} style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,background:"var(--bg)",border:"1px solid var(--border)",color:"var(--text2)"}}>{sl.split(' ')[0]} {r.nom}</span>
                })}
              </div>
              <div style={{color:"var(--text3)",fontSize:18}}>›</div>
            </div>
          </div>
        })}
      </div>
    </div>
    {createModal&&<div onClick={()=>setCreateModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:20,padding:28,width:440,boxShadow:"0 20px 60px rgba(0,0,0,.2)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>Nouveau client</div>
        <div style={{fontSize:13,color:"var(--text2)",marginBottom:22}}>Cree l'etablissement + compte gerant en une fois</div>
        <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",letterSpacing:".06em",marginBottom:10}}>ETABLISSEMENT</div>
        <div style={{marginBottom:10}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>Secteur d'activite *</label>
          <SecteurSelect value={createForm.secteur} onChange={v=>setCreateForm(f=>({...f,secteur:v}))}/>
        </div>
        {[{f:"nom_resto",l:"Nom *",ph:"Le Bistrot du Port"},{f:"adresse",l:"Adresse",ph:"12 rue du Port, Marseille"}].map(({f,l,ph})=>(
          <div key={f} style={{marginBottom:10}}><label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>{l}</label><input placeholder={ph} value={createForm[f]} onChange={e=>setCreateForm(ff=>({...ff,[f]:e.target.value}))} style={inputStyle}/></div>
        ))}
        <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",letterSpacing:".06em",marginBottom:10,marginTop:18}}>GERANT</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          {[{f:"prenom",l:"Prenom *",ph:"Sophie"},{f:"nom",l:"Nom *",ph:"Martin"}].map(({f,l,ph})=>(
            <div key={f}><label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>{l}</label><input placeholder={ph} value={createForm[f]} onChange={e=>setCreateForm(ff=>({...ff,[f]:e.target.value}))} style={inputStyle}/></div>
          ))}
        </div>
        {[{f:"email",l:"Email *",ph:"sophie@bistrot.fr"},{f:"telephone",l:"Telephone",ph:"+41 79 123 45 67"},{f:"entreprise",l:"Entreprise",ph:"SAS Bistrot du Port"}].map(({f,l,ph})=>(
          <div key={f} style={{marginBottom:10}}><label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>{l}</label><input type={f==="password"?"password":"text"} placeholder={ph} value={createForm[f]} onChange={e=>setCreateForm(ff=>({...ff,[f]:e.target.value}))} style={inputStyle}/></div>
        ))}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",letterSpacing:".06em",marginBottom:10}}>TYPE DE COMPTE</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[{v:'trial',l:'⏳ Trial',d:'Accès limité dans le temps'},{v:'active',l:'✅ Actif',d:'Accès complet sans limite'}].map(({v,l,d})=>(
              <div key={v} onClick={()=>setCreateForm(f=>({...f,compte_type:v}))}
                style={{padding:"10px 14px",borderRadius:10,border:`2px solid ${createForm.compte_type===v?"var(--accent)":"var(--border)"}`,background:createForm.compte_type===v?"var(--accent-bg)":"var(--bg)",cursor:"pointer"}}>
                <div style={{fontSize:13,fontWeight:700,color:createForm.compte_type===v?"var(--accent)":"var(--text)"}}>{l}</div>
                <div style={{fontSize:11,color:"var(--text2)"}}>{d}</div>
              </div>
            ))}
          </div>
          {createForm.compte_type==='trial'&&<div style={{marginTop:10}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:6}}>Durée du trial</div>
            <div style={{display:"flex",gap:8}}>
              {[7,14,30,60].map(d=>(
                <button key={d} onClick={()=>setCreateForm(f=>({...f,trial_days:d}))}
                  style={{padding:"6px 14px",borderRadius:9,border:`2px solid ${createForm.trial_days===d?"var(--accent)":"var(--border)"}`,background:createForm.trial_days===d?"var(--accent-bg)":"var(--bg)",color:createForm.trial_days===d?"var(--accent)":"var(--text)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  {d}j
                </button>
              ))}
            </div>
            <div style={{fontSize:11,color:"var(--text2)",marginTop:6}}>Expiration : {new Date(Date.now()+createForm.trial_days*24*60*60*1000).toLocaleDateString('fr-FR')}</div>
          </div>}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",letterSpacing:".06em",marginBottom:10}}>FONCTIONNALITÉS INCLUSES</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[['badgeage','📱 Badgeage QR'],['conges','🏖️ Congés'],['signalements','🔔 Signalements'],['export_paie','📄 Export paie']].map(([k,l])=>(
              <div key={k} onClick={()=>setCreateForm(f=>({...f,features:{...f.features,[k]:!f.features[k]}}))}
                style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,border:`2px solid ${createForm.features[k]?"var(--accent)":"var(--border)"}`,background:createForm.features[k]?"var(--accent-bg)":"var(--bg)",cursor:"pointer"}}>
                <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${createForm.features[k]?"var(--accent)":"var(--border)"}`,background:createForm.features[k]?"var(--accent)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {createForm.features[k]&&<span style={{color:"white",fontSize:11,fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:12,fontWeight:600,color:createForm.features[k]?"var(--accent)":"var(--text)"}}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"10px 14px",background:"var(--accent-bg)",borderRadius:10,marginBottom:16,fontSize:12,color:"var(--accent)"}}>Le PIN de la borne sera 1234 par defaut · Secteur determine les postes disponibles</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setCreateModal(false)} style={{flex:1,height:44,borderRadius:12,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text2)",fontSize:14,fontWeight:600,cursor:"pointer"}}>Annuler</button>
          <button onClick={createClient} style={{flex:1,height:44,borderRadius:12,border:"none",background:"var(--accent)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>Creer le client</button>
        </div>
      </div>
    </div>}
    {modals}
  </div>
}