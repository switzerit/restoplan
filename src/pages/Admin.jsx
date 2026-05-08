import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('gerants') // gerants | restaurants | employes
  const [gerants, setGerants] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [employes, setEmployes] = useState([])
  const [selectedGerant, setSelectedGerant] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({nom_resto:'',adresse:'',prenom:'',nom:'',email:'',password:''})
  const [addRestoModal, setAddRestoModal] = useState(false)
  const [addRestoForm, setAddRestoForm] = useState({nom:'',adresse:'',gerant_email:''})
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  useEffect(()=>{
    checkAdmin().then(ok=>{if(ok) loadData()})
  },[])

  async function checkAdmin(){
    const {data:{session}} = await supabase.auth.getSession()
    if(!session){navigate('/login');return false}
    const {data:profil} = await supabase.from('profils').select('role').eq('user_id',session.user.id).single()
    if(profil?.role !== 'super_admin'){navigate('/gerant');return false}
    setLoading(false)
    return true
  }

  async function loadData(){
    // Charger restaurants
    const {data:r} = await supabase.from('restaurants').select('*').order('created_at',{ascending:false})
    setRestaurants(r||[])
    // Charger employes
    const {data:e} = await supabase.from('employes').select('*').order('prenom')
    setEmployes(e||[])
    // Charger les profils gérants
    const {data:profils} = await supabase.from('profils').select('*').eq('role','gerant')
    setGerants(profils||[])
  }

  async function createClient(){
    if(!createForm.nom_resto||!createForm.email||!createForm.password||!createForm.prenom||!createForm.nom){
      showToast('Remplis tous les champs');return
    }
    if(createForm.password.length < 6){showToast('Mot de passe min. 6 caractères');return}
    showToast('Création en cours...')

    // 1. Créer le restaurant
    const {data:resto,error:restoErr} = await supabase.from('restaurants').insert({
      nom:createForm.nom_resto, adresse:createForm.adresse, actif:true, pin_borne:'1234'
    }).select().single()
    if(restoErr){showToast('Erreur: '+restoErr.message);return}

    // 2. Créer le compte via Edge Function
    const {data,error} = await supabase.functions.invoke('create-employe',{
      body:{
        email:createForm.email, password:createForm.password,
        prenom:createForm.prenom, nom:createForm.nom,
        role:'Gerant', restaurant_id:resto.id,
        skip_employe:true, employe_id:null
      }
    })
    if(error||data?.error){showToast('Erreur compte: '+(data?.error||error?.message));return}

    // 3. Mettre le rôle gérant
    const {data:authUsers} = await supabase.from('profils').select('*').eq('role','employe').order('created_at',{ascending:false})
    // Trouver le dernier profil créé et le mettre en gérant
    if(authUsers?.length>0){
      const last = authUsers[0]
      await supabase.from('profils').update({role:'gerant',employe_id:null}).eq('id',last.id)
    }

    setCreateModal(false)
    setCreateForm({nom_resto:'',adresse:'',prenom:'',nom:'',email:'',password:''})
    await loadData()
    showToast('✅ Client créé avec succès !')
  }

  async function toggleResto(resto){
    await supabase.from('restaurants').update({actif:!resto.actif}).eq('id',resto.id)
    loadData()
    showToast(resto.actif?'Restaurant désactivé':'Restaurant activé')
  }

  async function deleteResto(restoId){
    if(!window.confirm('Supprimer ce restaurant et tous ses données ?')) return
    await supabase.from('shifts').delete().eq('restaurant_id',restoId)
    await supabase.from('pointages').delete().eq('restaurant_id',restoId)
    await supabase.from('employes').delete().eq('restaurant_id',restoId)
    await supabase.from('restaurants').delete().eq('id',restoId)
    loadData()
    showToast('Restaurant supprimé')
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),3000)}

  async function deconnexion(){
    await supabase.auth.signOut()
    navigate('/login')
  }

  const activeRestos = restaurants.filter(r=>r.actif).length

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>⚡</div>
        <div style={{color:'var(--text2)'}}>Chargement admin...</div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'var(--font)'}}>

      {/* TOPBAR */}
      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'14px 28px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:36,height:36,background:'linear-gradient(135deg,#0071e3,#5856d6)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⚡</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:800,color:'var(--text)'}}>RestoPlan Admin</div>
          <div style={{fontSize:11,color:'var(--text3)'}}>Panneau de gestion</div>
        </div>
        <button onClick={()=>setCreateModal(true)} style={{padding:'8px 18px',borderRadius:10,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Nouveau client</button>
        <button onClick={deconnexion} style={{padding:'8px 14px',borderRadius:10,border:'1px solid var(--border2)',background:'transparent',color:'var(--text2)',fontSize:13,cursor:'pointer',fontWeight:600}}>Déconnexion</button>
      </div>

      <div style={{display:'flex',height:'calc(100vh - 57px)'}}>

        {/* SIDEBAR */}
        <div style={{width:220,background:'var(--surface)',borderRight:'1px solid var(--border)',padding:'16px 10px',display:'flex',flexDirection:'column',gap:4}}>
          {[
            {id:'gerants',icon:'👤',label:'Gérants',badge:gerants.length},
            {id:'restaurants',icon:'🏪',label:'Restaurants',badge:restaurants.length},
            {id:'employes',icon:'👥',label:'Tous les employés',badge:employes.length},
          ].map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,border:'none',width:'100%',textAlign:'left',background:view===item.id?'var(--accent-bg)':'transparent',color:view===item.id?'var(--accent)':'var(--text2)'}}>
              {item.icon} {item.label}
              <span style={{marginLeft:'auto',background:view===item.id?'var(--accent)':'var(--border2)',color:view===item.id?'white':'var(--text2)',fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20}}>{item.badge}</span>
            </button>
          ))}

          <div style={{marginTop:'auto',padding:'12px 10px',borderTop:'1px solid var(--border)'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>Statistiques</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                <span style={{color:'var(--text2)'}}>Restaurants actifs</span>
                <span style={{fontWeight:700,color:'var(--green)'}}>{activeRestos}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                <span style={{color:'var(--text2)'}}>Total employés</span>
                <span style={{fontWeight:700}}>{employes.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{flex:1,overflowY:'auto',padding:24}}>

          {/* VUE GÉRANTS */}
          {view==='gerants' && (
            <div>
              <div style={{fontSize:18,fontWeight:800,marginBottom:4,color:'var(--text)'}}>Gérants</div>
              <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Liste de tous les gérants et leurs restaurants</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {gerants.length===0&&<div style={{padding:40,textAlign:'center',color:'var(--text3)',background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)'}}>Aucun gérant — créez votre premier client</div>}
                {gerants.map((g,i)=>{
                  const restos = restaurants.filter(r=>r.gerant_id===g.user_id)
                  const empCount = employes.filter(e=>restos.some(r=>r.id===e.restaurant_id)).length
                  return (
                    <div key={g.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 20px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:42,height:42,borderRadius:'50%',background:'var(--accent-bg)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,flexShrink:0}}>G</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Gérant #{i+1}</div>
                          <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{restos.length} restaurant{restos.length>1?'s':''} • {empCount} employé{empCount>1?'s':''}</div>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          {restos.map(r=>(
                            <span key={r.id} style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:r.actif?'var(--green-bg)':'var(--bg)',color:r.actif?'#1a6b35':'var(--text3)',border:'1px solid var(--border)'}}>
                              🏪 {r.nom}
                            </span>
                          ))}
                        </div>
                      </div>
                      {restos.length>0&&(
                        <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)',display:'flex',gap:8,flexWrap:'wrap'}}>
                          {restos.map(r=>(
                            <div key={r.id} style={{flex:1,minWidth:200,padding:'10px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)'}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <div>
                                  <div style={{fontSize:13,fontWeight:700}}>{r.nom}</div>
                                  <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{r.adresse||'—'}</div>
                                </div>
                                <div style={{display:'flex',gap:6}}>
                                  <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:r.actif?'var(--green-bg)':'var(--red-bg)',color:r.actif?'#1a6b35':'var(--red)'}}>{r.actif?'Actif':'Inactif'}</span>
                                  <button onClick={()=>toggleResto(r)} style={{fontSize:10,padding:'2px 8px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--surface)',color:'var(--text2)',cursor:'pointer',fontWeight:600}}>{r.actif?'Désactiver':'Activer'}</button>
                                  <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/borne?resto=${r.id}`).then(()=>showToast('URL copiée !'))} style={{fontSize:10,padding:'2px 8px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--surface)',color:'var(--text2)',cursor:'pointer',fontWeight:600}}>URL borne</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* VUE RESTAURANTS */}
          {view==='restaurants' && (
            <div>
              <div style={{fontSize:18,fontWeight:800,marginBottom:4,color:'var(--text)'}}>Restaurants</div>
              <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Tous les restaurants de la plateforme</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {restaurants.map(r=>{
                  const nbEmp = employes.filter(e=>e.restaurant_id===r.id).length
                  return (
                    <div key={r.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:40,height:40,borderRadius:10,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏪</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{r.nom}</div>
                        <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{r.adresse||'Pas d\'adresse'} • PIN: {r.pin_borne}</div>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:'var(--text)',marginRight:8}}>{nbEmp} emp.</div>
                      <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:r.actif?'var(--green-bg)':'var(--red-bg)',color:r.actif?'#1a6b35':'var(--red)'}}>{r.actif?'Actif':'Inactif'}</span>
                      <button onClick={()=>toggleResto(r)} style={{padding:'5px 12px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer'}}>{r.actif?'Désactiver':'Activer'}</button>
                      <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/borne?resto=${r.id}`).then(()=>showToast('URL copiée !'))} style={{padding:'5px 12px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer'}}>URL borne</button>
                      <button onClick={()=>deleteResto(r.id)} style={{padding:'5px 10px',borderRadius:8,border:'none',background:'var(--red-bg)',color:'var(--red)',fontSize:11,fontWeight:600,cursor:'pointer'}}>🗑️</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* VUE EMPLOYES */}
          {view==='employes' && (
            <div>
              <div style={{fontSize:18,fontWeight:800,marginBottom:4,color:'var(--text)'}}>Tous les employés</div>
              <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Vue globale de tous les employés sur la plateforme</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
                {employes.map((emp,i)=>{
                  const resto = restaurants.find(r=>r.id===emp.restaurant_id)
                  const COLORS=[{bg:'#e8f2fd',color:'#0051a8'},{bg:'#f0faf3',color:'#1a6b35'},{bg:'#fff8ee',color:'#8a4a00'},{bg:'#f0f0fc',color:'#3a3880'}]
                  const c=COLORS[i%COLORS.length]
                  return (
                    <div key={emp.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'14px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                        <div style={{width:36,height:36,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{ini(emp.prenom,emp.nom)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.prenom} {emp.nom}</div>
                          <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{emp.role}</div>
                        </div>
                      </div>
                      {resto&&<div style={{fontSize:11,color:'var(--accent)',fontWeight:600,padding:'3px 8px',background:'var(--accent-bg)',borderRadius:8,display:'inline-block'}}>🏪 {resto.nom}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL CREATION CLIENT */}
      {createModal&&(
        <div onClick={()=>setCreateModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,padding:28,width:420,boxShadow:'0 20px 60px rgba(0,0,0,.2)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontSize:18,fontWeight:800,marginBottom:4,color:'var(--text)'}}>Nouveau client</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:22}}>Crée le restaurant + le compte gérant en une fois</div>

            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',letterSpacing:'.06em',marginBottom:8}}>RESTAURANT</div>
            {[{f:'nom_resto',l:'Nom du restaurant',ph:'Le Bistrot du Port'},{f:'adresse',l:'Adresse',ph:'12 rue du Port, Marseille'}].map(({f,l,ph})=>(
              <div key={f} style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:5}}>{l}</label>
                <input placeholder={ph} value={createForm[f]} onChange={e=>setCreateForm(ff=>({...ff,[f]:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            ))}

            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',letterSpacing:'.06em',marginBottom:8,marginTop:18}}>COMPTE GÉRANT</div>
            {[{f:'prenom',l:'Prénom',ph:'Sophie'},{f:'nom',l:'Nom',ph:'Martin'},{f:'email',l:'Email',ph:'sophie@bistrot.fr'},{f:'password',l:'Mot de passe',ph:'Min. 6 caractères'}].map(({f,l,ph})=>(
              <div key={f} style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:5}}>{l}</label>
                <input type={f==='password'?'password':'text'} placeholder={ph} value={createForm[f]} onChange={e=>setCreateForm(ff=>({...ff,[f]:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none'}}/>
              </div>
            ))}

            <div style={{padding:'10px 14px',background:'var(--accent-bg)',borderRadius:10,marginBottom:16,fontSize:12,color:'var(--accent)'}}>
              💡 Le gérant recevra ses identifiants pour accéder à son dashboard
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setCreateModal(false)} style={{flex:1,height:44,borderRadius:12,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text2)',fontSize:14,fontWeight:600,cursor:'pointer'}}>Annuler</button>
              <button onClick={createClient} style={{flex:1,height:44,borderRadius:12,border:'none',background:'var(--accent)',color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Créer le client</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'var(--text)',color:'white',padding:'10px 22px',borderRadius:22,fontSize:13,fontWeight:600,zIndex:300,whiteSpace:'nowrap'}}>{toast}</div>}
    </div>
  )
}
