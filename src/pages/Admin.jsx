import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState([])
  const [employes, setEmployes] = useState([])
  const [pointages, setPointages] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({nom_resto:'',adresse:'',prenom:'',nom:'',email:'',password:''})
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  useEffect(()=>{
    checkAdmin().then(ok=>{if(ok) loadData()})
  },[])

  async function checkAdmin(){
    const {data:{session}} = await supabase.auth.getSession()
    if(!session){navigate('/login');return}
    const {data:profil} = await supabase.from('profils').select('role').eq('user_id',session.user.id).single()
    if(profil?.role !== 'super_admin'){navigate('/gerant');return}
    setLoading(false)
    return true
  }

  async function loadData(){
    const {data:r} = await supabase.from('restaurants').select('*').order('created_at',{ascending:false})
    setRestaurants(r||[])
    const {data:e} = await supabase.from('employes').select('*')
    setEmployes(e||[])
    const today = new Date().toISOString().split('T')[0]
    const {data:p} = await supabase.from('pointages').select('*').eq('date',today)
    setPointages(p||[])
  }

  async function createClient(){
    if(!createForm.nom_resto||!createForm.email||!createForm.password||!createForm.prenom||!createForm.nom){
      showToast('Remplis tous les champs');return
    }
    showToast('Creation en cours...')
    // 1. Créer le restaurant
    const {data:resto,error:restoErr} = await supabase.from('restaurants').insert({
      nom:createForm.nom_resto,
      adresse:createForm.adresse,
      actif:true,
      pin_borne:'1234'
    }).select().single()
    if(restoErr){showToast('Erreur resto: '+restoErr.message);return}

    // 2. Créer le compte gérant via Edge Function
    const {data,error} = await supabase.functions.invoke('create-employe',{
      body:{
        email:createForm.email,
        password:createForm.password,
        prenom:createForm.prenom,
        nom:createForm.nom,
        role:'Gerant',
        restaurant_id:resto.id,
        skip_employe:true,
        employe_id:null
      }
    })

    // 3. Mettre le rôle gérant dans profils
    const {data:{users}} = await supabase.auth.admin?.listUsers() || {data:{users:[]}}
    // Via la liste users Supabase - on cherche par email
    // Le profil sera créé par la edge function mais avec role employe
    // On doit le mettre en gerant
    await supabase.from('profils').update({role:'gerant',employe_id:null}).eq('user_id',(data?.user_id||''))

    // Lier restaurant au gérant
    await supabase.from('restaurants').update({gerant_id:data?.user_id||null}).eq('id',resto.id)

    setCreateModal(false)
    setCreateForm({nom_resto:'',adresse:'',prenom:'',nom:'',email:'',password:''})
    loadData()
    showToast('Client cree avec succes !')
  }

  async function toggleResto(resto){
    await supabase.from('restaurants').update({actif:!resto.actif}).eq('id',resto.id)
    loadData()
    showToast(resto.actif?'Restaurant desactive':'Restaurant active')
  }

  async function deconnexion(){
    await supabase.auth.signOut()
    navigate('/login')
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),3000)}

  const todayPointages = pointages.length
  const activeRestos = restaurants.filter(r=>r.actif).length

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>⚡</div>
        <div style={{color:'var(--text2)'}}>Chargement admin...</div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0f0f13',fontFamily:'var(--font)',color:'white'}}>

      {/* TOPBAR */}
      <div style={{background:'rgba(255,255,255,.05)',borderBottom:'1px solid rgba(255,255,255,.08)',padding:'14px 28px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:34,height:34,background:'linear-gradient(135deg,#0071e3,#5856d6)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⚡</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:800}}>RestoPlan Admin</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>Super Dashboard</div>
        </div>
        <button onClick={()=>setCreateModal(true)} style={{padding:'8px 18px',borderRadius:10,border:'none',background:'#0071e3',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Nouveau client</button>
        <button onClick={deconnexion} style={{padding:'8px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,.15)',background:'transparent',color:'rgba(255,255,255,.6)',fontSize:13,cursor:'pointer'}}>Déconnexion</button>
      </div>

      <div style={{padding:'28px 28px',maxWidth:1100,margin:'0 auto'}}>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28}}>
          {[
            {icon:'🏪',label:'Restaurants actifs',value:activeRestos,sub:`${restaurants.length} total`},
            {icon:'👥',label:'Employes total',value:employes.length,sub:'tous restaurants'},
            {icon:'📍',label:'Pointages aujourd\'hui',value:todayPointages,sub:'en temps reel'},
            {icon:'📊',label:'Taux presence',value:employes.length>0?Math.round(todayPointages/employes.length*100)+'%':'—',sub:'aujourd\'hui'},
          ].map((s,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:16,padding:'18px 20px'}}>
              <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:26,fontWeight:800,marginBottom:2}}>{s.value}</div>
              <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.7)'}}>{s.label}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* LISTE RESTAURANTS */}
        <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:18,overflow:'hidden'}}>
          <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:14,fontWeight:800,flex:1}}>Tous les restaurants</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>{restaurants.length} clients</div>
          </div>
          {restaurants.length===0 && (
            <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.3)',fontSize:14}}>
              Aucun restaurant — créez votre premier client
            </div>
          )}
          {restaurants.map((r,i)=>{
            const nbEmp = employes.filter(e=>e.restaurant_id===r.id).length
            const nbPointages = pointages.filter(p=>p.restaurant_id===r.id).length
            return (
              <div key={r.id} style={{padding:'16px 22px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:42,height:42,borderRadius:12,background:'rgba(0,113,227,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏪</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700}}>{r.nom}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:2}}>{r.adresse||'Pas d\'adresse'}</div>
                </div>
                <div style={{display:'flex',gap:20,fontSize:12,color:'rgba(255,255,255,.5)'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:700,color:'white'}}>{nbEmp}</div>
                    <div>employes</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:700,color:'white'}}>{nbPointages}</div>
                    <div>pointages/j</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20,background:r.actif?'rgba(52,199,89,.15)':'rgba(255,59,48,.15)',color:r.actif?'#34c759':'#ff3b30'}}>
                    {r.actif?'Actif':'Inactif'}
                  </span>
                  <button onClick={()=>toggleResto(r)} style={{padding:'6px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,.12)',background:'transparent',color:'rgba(255,255,255,.6)',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                    {r.actif?'Désactiver':'Activer'}
                  </button>
                  <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/borne?resto=${r.id}`).then(()=>showToast('URL borne copiée !'))} style={{padding:'6px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,.12)',background:'transparent',color:'rgba(255,255,255,.6)',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                    📋 URL borne
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL CREATION CLIENT */}
      {createModal&&(
        <div onClick={()=>setCreateModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#1c1c1e',border:'1px solid rgba(255,255,255,.1)',borderRadius:22,padding:28,width:420,boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
            <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>Nouveau client</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:22}}>Crée le restaurant + le compte gérant</div>

            <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',letterSpacing:'.06em',marginBottom:8}}>RESTAURANT</div>
            {[{f:'nom_resto',l:'Nom du restaurant',ph:'Le Bistrot du Port'},{f:'adresse',l:'Adresse',ph:'12 rue du Port, Marseille'}].map(({f,l,ph})=>(
              <div key={f} style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:'rgba(255,255,255,.5)',marginBottom:5}}>{l}</label>
                <input placeholder={ph} value={createForm[f]} onChange={e=>setCreateForm(ff=>({...ff,[f]:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.06)',fontSize:13,color:'white',outline:'none'}}/>
              </div>
            ))}

            <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',letterSpacing:'.06em',marginBottom:8,marginTop:16}}>COMPTE GÉRANT</div>
            {[{f:'prenom',l:'Prénom',ph:'Sophie'},{f:'nom',l:'Nom',ph:'Martin'},{f:'email',l:'Email',ph:'sophie@bistrot.fr'},{f:'password',l:'Mot de passe',ph:'Min. 8 caractères'}].map(({f,l,ph})=>(
              <div key={f} style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:'rgba(255,255,255,.5)',marginBottom:5}}>{l}</label>
                <input type={f==='password'?'password':'text'} placeholder={ph} value={createForm[f]} onChange={e=>setCreateForm(ff=>({...ff,[f]:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.06)',fontSize:13,color:'white',outline:'none'}}/>
              </div>
            ))}

            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button onClick={()=>setCreateModal(false)} style={{flex:1,height:44,borderRadius:12,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(255,255,255,.6)',fontSize:14,fontWeight:600,cursor:'pointer'}}>Annuler</button>
              <button onClick={createClient} style={{flex:1,height:44,borderRadius:12,border:'none',background:'#0071e3',color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>Créer le client</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'rgba(255,255,255,.95)',color:'#1d1d1f',padding:'10px 22px',borderRadius:22,fontSize:13,fontWeight:600,zIndex:300,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>{toast}</div>}
    </div>
  )
}
