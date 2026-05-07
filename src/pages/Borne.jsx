import { useEffect, useState } from 'react'
import QRDisplay from '../components/QRDisplay'
import { supabase } from '../lib/supabase'

const COLORS = [
  {bg:'#e8f2fd',color:'#0051a8'},{bg:'#f0faf3',color:'#1a6b35'},
  {bg:'#fff8ee',color:'#8a4a00'},{bg:'#f0f0fc',color:'#3a3880'},
  {bg:'#fff2f1',color:'#b02020'},{bg:'#fdf0f8',color:'#8a2060'},
]

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}
function nowStr(){const n=new Date();return n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0')}

export default function Borne() {
  const [restaurant, setRestaurant] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [employes, setEmployes] = useState([])
  const [pointages, setPointages] = useState({})
  const [flash, setFlash] = useState(null)
  const [clock, setClock] = useState(nowStr())
  const [date, setDate] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showRestoSelect, setShowRestoSelect] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [unlockPin, setUnlockPin] = useState('')
  const [unlockError, setUnlockError] = useState(false)
  const [unlockShake, setUnlockShake] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const restoId = params.get('resto')
    const session = sessionStorage.getItem('borne_unlocked_'+restoId)
    if(session === 'true') setUnlocked(true)
    loadRestaurants(restoId)
    const n = new Date()
    setDate(n.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}))
    const t = setInterval(()=>setClock(nowStr()),10000)
    return()=>clearInterval(t)
  },[])

  useEffect(()=>{if(restaurant&&unlocked){loadEmployes();loadPointages()}},[restaurant,unlocked])

  async function loadRestaurants(restoId){
    const {data} = await supabase.from('restaurants').select('*').eq('actif',true).order('nom')
    setRestaurants(data||[])
    if(restoId){
      const found = data?.find(r=>r.id===restoId)
      if(found){setRestaurant(found);return}
    }
    if(data?.length===1){
      setRestaurant(data[0])
      window.history.replaceState(null,'',`?resto=${data[0].id}`)
    } else {
      setShowRestoSelect(true)
    }
  }

  function selectResto(r){
    setRestaurant(r)
    setShowRestoSelect(false)
    setUnlocked(false)
    setUnlockPin('')
    window.history.replaceState(null,'',`?resto=${r.id}`)
  }

  async function loadEmployes(){
    const {data} = await supabase.from('employes').select('*').eq('actif',true).eq('restaurant_id',restaurant.id).order('prenom')
    setEmployes(data||[])
  }

  async function loadPointages(){
    const {data} = await supabase.from('pointages').select('*').eq('date',today).eq('restaurant_id',restaurant.id)
    const map={}
    data?.forEach(p=>{
      if(!map[p.employe_id]) map[p.employe_id] = []
      map[p.employe_id].push(p)
    })
    setPointages(map)
  }

  function isPresent(empId){
    const pts = pointages[empId]||[]
    return pts.some(p=>p.heure_arrivee&&!p.heure_depart)
  }

  function derniereArrivee(empId){
    const pts = pointages[empId]||[]
    const open = pts.find(p=>p.heure_arrivee&&!p.heure_depart)
    return open?.heure_arrivee
  }

  function unlockKey(k){
    if(unlockPin.length>=4)return
    const next = unlockPin+k
    setUnlockPin(next)
    if(next.length===4) setTimeout(()=>checkUnlock(next),120)
  }

  function checkUnlock(input){
    if(input===restaurant.pin_borne){
      setUnlocked(true)
      setUnlockPin('')
      setUnlockError(false)
      sessionStorage.setItem('borne_unlocked_'+restaurant.id,'true')
    } else {
      setUnlockError(true)
      setUnlockShake(true)
      setTimeout(()=>{setUnlockPin('');setUnlockError(false);setUnlockShake(false)},900)
    }
  }

  async function forceArrivee(empId){
    await supabase.from('pointages').insert({employe_id:empId,date:today,heure_arrivee:nowStr(),restaurant_id:restaurant.id})
    loadPointages()
  }

  async function forceDepart(empId){
    const pts = pointages[empId]||[]
    const open = pts.find(p=>p.heure_arrivee&&!p.heure_depart)
    if(open) await supabase.from('pointages').update({heure_depart:nowStr()}).eq('id',open.id)
    loadPointages()
  }

  function checkPin(input){
    if(input==='1234'){setShowPin(false);setPin('');setPinError(false);setShowAdmin(true)}
    else{setPinError(true);setTimeout(()=>{setPin('');setPinError(false)},900)}
  }

  function pinKey(k){
    if(pin.length>=4)return
    const next=pin+k
    setPin(next)
    if(next.length===4)setTimeout(()=>checkPin(next),120)
  }

  const presentCount=employes.filter(e=>isPresent(e.id)).length

  if(showRestoSelect) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'var(--font)'}}>
      <div style={{width:'100%',maxWidth:400,textAlign:'center'}}>
        <div style={{fontSize:28,marginBottom:8}}>🏪</div>
        <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Choisir le restaurant</div>
        <div style={{fontSize:14,color:'var(--text2)',marginBottom:28}}>Cette borne est associée à quel établissement ?</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {restaurants.map(r=>(
            <button key={r.id} onClick={()=>selectResto(r)} style={{padding:'16px 20px',background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:14,cursor:'pointer',textAlign:'left',width:'100%'}}>
              <div style={{fontSize:15,fontWeight:700}}>{r.nom}</div>
              {r.adresse&&<div style={{fontSize:12,color:'var(--text2)',marginTop:3}}>{r.adresse}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  if(!restaurant) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'var(--text2)'}}>Chargement...</div>
  )

  if(!unlocked) return (
    <div style={{minHeight:'100vh',background:'#1d1d1f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'var(--font)'}}>
      <div style={{width:'100%',maxWidth:340,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <div style={{fontSize:22,fontWeight:800,color:'white',marginBottom:6}}>{restaurant.nom}</div>
        <div style={{fontSize:14,color:'rgba(255,255,255,.5)',marginBottom:36}}>Entrez le code PIN de la borne</div>
        <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:32,animation:unlockShake?'shake .3s ease':'none'}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:18,height:18,borderRadius:'50%',background:unlockError?'#ff3b30':i<unlockPin.length?'white':'rgba(255,255,255,.2)',transition:'all .15s'}}></div>
          ))}
        </div>
        {unlockError&&<div style={{fontSize:13,color:'#ff3b30',fontWeight:600,marginBottom:12}}>Code incorrect</div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,maxWidth:280,margin:'0 auto'}}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i)=>(
            <button key={i} onClick={()=>k==='⌫'?setUnlockPin(p=>p.slice(0,-1)):k?unlockKey(k):null} style={{height:72,borderRadius:16,border:'none',background:k?'rgba(255,255,255,.1)':'transparent',color:'white',fontSize:k==='⌫'?20:26,fontWeight:500,cursor:k?'pointer':'default'}}>
              {k}
            </button>
          ))}
        </div>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
    </div>
  )

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'var(--bg)',fontFamily:'var(--font)',overflow:'hidden'}}>

      {/* TOPBAR */}
      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div>
          <div style={{fontSize:16,fontWeight:800}}>{restaurant.nom}</div>
          <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)'}}></div>
            <span style={{fontSize:11,color:'#1a6b35',fontWeight:600}}>Borne active</span>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:20,fontWeight:700}}>{clock}</div>
          <div style={{fontSize:11,color:'var(--text2)'}}>{date}</div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'20px 16px',gap:20,overflowY:'auto'}}>

        {/* QR CODE */}
        <div style={{background:'var(--surface)',borderRadius:20,padding:20,border:'1px solid var(--border)',width:'100%',maxWidth:400,textAlign:'center',boxShadow:'0 2px 16px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Badgeage QR Code</div>
          <div style={{fontSize:12,color:'var(--text2)',marginBottom:12}}>Scannez depuis votre telephone</div>
          <QRDisplay restaurant={restaurant}/>
        </div>

        {/* LISTE EMPLOYES */}
        <div style={{width:'100%',maxWidth:600}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--text2)',marginBottom:10}}>
            {presentCount} present{presentCount>1?'s':''} sur {employes.length}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
            {employes.map((emp,i)=>{
              const c=COLORS[i%COLORS.length]
              const present=isPresent(emp.id)
              const arrivee=derniereArrivee(emp.id)
              return (
                <div key={emp.id} style={{background:present?'var(--green-bg)':'var(--surface)',border:`1.5px solid ${present?'#b8e8c8':'var(--border)'}`,borderRadius:14,padding:'14px 12px',display:'flex',flexDirection:'column',alignItems:'center',gap:8,position:'relative'}}>
                  {present&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'var(--green)',borderRadius:'14px 14px 0 0'}}></div>}
                  <div style={{width:48,height:48,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800}}>{ini(emp.prenom,emp.nom)}</div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:700}}>{emp.prenom} {emp.nom}</div>
                    <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{emp.role}</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:present?'rgba(52,199,89,.15)':'var(--bg)',color:present?'#1a6b35':'var(--text3)'}}>
                    {present?`Arrive ${arrivee?.slice(0,5)}`:'Absent'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div style={{background:'var(--surface)',borderTop:'1px solid var(--border)',padding:'10px 16px',paddingBottom:'max(10px,env(safe-area-inset-bottom))',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',bottom:0,zIndex:10}}>
        <button onClick={()=>{setUnlocked(false);sessionStorage.removeItem('borne_unlocked_'+restaurant.id)}} style={{fontSize:12,fontWeight:600,color:'var(--text3)',background:'transparent',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px',cursor:'pointer'}}>
          🔒 Verrouiller
        </button>
        <button onClick={()=>setShowPin(true)} style={{fontSize:12,fontWeight:600,color:'var(--text2)',background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:8,padding:'6px 12px',cursor:'pointer'}}>
          ⚙️ Acces gerant
        </button>
      </div>

      {/* PIN GERANT */}
      {showPin&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'var(--surface)',borderRadius:28,padding:'30px 26px',width:340,textAlign:'center',boxShadow:'0 12px 50px rgba(0,0,0,.18)'}}>
            <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>Acces gerant</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:24}}>Code PIN a 4 chiffres</div>
            <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:28}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:16,height:16,borderRadius:'50%',background:pinError?'var(--red)':i<pin.length?'var(--text)':'var(--border2)',transition:'all .15s'}}></div>
              ))}
            </div>
            {pinError&&<div style={{fontSize:12,color:'var(--red)',fontWeight:600,marginBottom:8}}>Code incorrect</div>}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i)=>(
                <button key={i} onClick={()=>k==='⌫'?setPin(p=>p.slice(0,-1)):k?pinKey(k):null} style={{height:60,borderRadius:14,border:k?'1.5px solid var(--border)':'none',background:k?'var(--surface)':'transparent',fontSize:k==='⌫'?16:22,fontWeight:600,color:'var(--text)',cursor:k?'pointer':'default'}}>
                  {k}
                </button>
              ))}
            </div>
            <button onClick={()=>{setShowPin(false);setPin('');setPinError(false)}} style={{marginTop:14,width:'100%',padding:11,borderRadius:12,border:'none',background:'transparent',color:'var(--text2)',fontSize:14,fontWeight:600,cursor:'pointer'}}>Annuler</button>
          </div>
        </div>
      )}

      {/* ADMIN PANEL */}
      {showAdmin&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'var(--surface)',borderRadius:28,width:520,maxWidth:'95vw',boxShadow:'0 12px 60px rgba(0,0,0,.2)',overflow:'hidden',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
              <div style={{fontSize:17,fontWeight:800,flex:1}}>Panneau gerant — {restaurant.nom}</div>
              <button onClick={()=>setShowAdmin(false)} style={{width:32,height:32,borderRadius:'50%',border:'none',background:'var(--bg)',color:'var(--text2)',fontSize:18,cursor:'pointer'}}>×</button>
            </div>
            <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
              {employes.map((emp,i)=>{
                const c=COLORS[i%COLORS.length]
                const present=isPresent(emp.id)
                const arrivee=derniereArrivee(emp.id)
                return (
                  <div key={emp.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--bg)',borderRadius:14,marginBottom:7,border:'1px solid var(--border)'}}>
                    <div style={{width:38,height:38,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>{ini(emp.prenom,emp.nom)}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700}}>{emp.prenom} {emp.nom}</div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>{present?`Present depuis ${arrivee?.slice(0,5)}`:'Absent'}</div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {!present
                        ?<button onClick={()=>forceArrivee(emp.id)} style={{padding:'7px 12px',borderRadius:9,border:'1px solid #b8e8c8',background:'var(--green-bg)',color:'#1a6b35',fontSize:12,fontWeight:700,cursor:'pointer'}}>Arrivee</button>
                        :<button onClick={()=>forceDepart(emp.id)} style={{padding:'7px 12px',borderRadius:9,border:'1px solid rgba(255,59,48,.2)',background:'var(--red-bg)',color:'var(--red)',fontSize:12,fontWeight:700,cursor:'pointer'}}>Depart</button>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{padding:'16px 24px',borderTop:'1px solid var(--border)'}}>
              <button onClick={()=>setShowAdmin(false)} style={{width:'100%',height:42,borderRadius:12,border:'none',background:'var(--accent)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Terminer</button>
            </div>
          </div>
        </div>
      )}

      {flash&&(
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,pointerEvents:'none'}}>
          <div style={{background:flash.bg,borderRadius:28,padding:'30px 40px',textAlign:'center',color:'white',boxShadow:'0 8px 40px rgba(0,0,0,.2)'}}>
            <div style={{fontSize:52,marginBottom:12}}>{flash.emoji}</div>
            <div style={{fontSize:24,fontWeight:800}}>{flash.name}</div>
            <div style={{fontSize:15,opacity:.85,marginTop:4}}>{flash.msg}</div>
          </div>
        </div>
      )}
    </div>
  )
}
