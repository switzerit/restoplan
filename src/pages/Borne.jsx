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
  const [selected, setSelected] = useState(null)
  const [flash, setFlash] = useState(null)
  const [clock, setClock] = useState(nowStr())
  const [date, setDate] = useState('')
  const [filter, setFilter] = useState('all')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showRestoSelect, setShowRestoSelect] = useState(false)
  // NOUVEAU — état déverrouillage borne
  const [unlocked, setUnlocked] = useState(false)
  const [unlockPin, setUnlockPin] = useState('')
  const [unlockError, setUnlockError] = useState(false)
  const [unlockShake, setUnlockShake] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const restoId = params.get('resto')
    // Vérifie si déjà déverrouillé en session
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
    data?.forEach(p=>{map[p.employe_id]=p})
    setPointages(map)
  }

  // DÉVERROUILLAGE BORNE
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

  async function doBadge(emp){
    const p=pointages[emp.id]
    const t=nowStr()
    if(!p){
      await supabase.from('pointages').insert({employe_id:emp.id,date:today,heure_arrivee:t,restaurant_id:restaurant.id})
      setFlash({emoji:'👋',name:emp.prenom,msg:'Bonne journée !',bg:'var(--green)'})
    } else if(!p.heure_depart){
      await supabase.from('pointages').update({heure_depart:t}).eq('id',p.id)
      setFlash({emoji:'👍',name:emp.prenom,msg:'À bientôt !',bg:'#1d1d1f'})
    }
    setTimeout(()=>setFlash(null),2000)
    setSelected(null)
    loadPointages()
  }

  async function forceArrivee(empId){
    const p=pointages[empId]
    if(!p) await supabase.from('pointages').insert({employe_id:empId,date:today,heure_arrivee:nowStr(),restaurant_id:restaurant.id})
    loadPointages()
  }

  async function forceDepart(empId){
    const p=pointages[empId]
    if(p) await supabase.from('pointages').update({heure_depart:nowStr()}).eq('id',p.id)
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

  const filtered=employes.filter(e=>{
    const p=pointages[e.id]
    const present=p&&p.heure_arrivee&&!p.heure_depart
    if(filter==='present')return present
    if(filter==='absent')return !present
    return true
  })

  const presentCount=employes.filter(e=>{
    const p=pointages[e.id]
    return p&&p.heure_arrivee&&!p.heure_depart
  }).length

  // ECRAN SELECTION RESTAURANT
  if(showRestoSelect) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'var(--font)'}}>
      <div style={{width:'100%',maxWidth:400,textAlign:'center'}}>
        <div style={{fontSize:28,marginBottom:8}}>🏪</div>
        <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Choisir le restaurant</div>
        <div style={{fontSize:14,color:'var(--text2)',marginBottom:28}}>Cette borne est associée à quel établissement ?</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {restaurants.map(r=>(
            <button key={r.id} onClick={()=>selectResto(r)} style={{padding:'16px 20px',background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:14,cursor:'pointer',textAlign:'left',width:'100%'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--accent-bg)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface)'}}>
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

  // ECRAN DEVERROUILLAGE PIN
  if(!unlocked) return (
    <div style={{minHeight:'100vh',background:'#1d1d1f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'var(--font)'}}>
      <div style={{width:'100%',maxWidth:340,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <div style={{fontSize:22,fontWeight:800,color:'white',marginBottom:6}}>{restaurant.nom}</div>
        <div style={{fontSize:14,color:'rgba(255,255,255,.5)',marginBottom:36}}>Entrez le code PIN de la borne</div>

        {/* DOTS */}
        <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:32,animation:unlockShake?'shake .3s ease':'none'}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{
              width:18,height:18,borderRadius:'50%',
              background:unlockError?'#ff3b30':i<unlockPin.length?'white':'rgba(255,255,255,.2)',
              transition:'all .15s',
              boxShadow:i<unlockPin.length&&!unlockError?'0 0 0 4px rgba(255,255,255,.1)':'none'
            }}></div>
          ))}
        </div>

        {unlockError&&<div style={{fontSize:13,color:'#ff3b30',fontWeight:600,marginBottom:12}}>Code incorrect — réessayez</div>}

        {/* CLAVIER */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,maxWidth:280,margin:'0 auto'}}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i)=>(
            <button key={i} onClick={()=>k==='⌫'?setUnlockPin(p=>p.slice(0,-1)):k?unlockKey(k):null} style={{
              height:72,borderRadius:16,
              border:'none',
              background:k?'rgba(255,255,255,.1)':'transparent',
              color:'white',fontSize:k==='⌫'?20:26,fontWeight:500,
              cursor:k?'pointer':'default',
              transition:'all .13s',
              display:'flex',alignItems:'center',justifyContent:'center'
            }}
            onMouseEnter={e=>{if(k)e.currentTarget.style.background='rgba(255,255,255,.2)'}}
            onMouseLeave={e=>{if(k)e.currentTarget.style.background='rgba(255,255,255,.1)'}}>
              {k}
            </button>
          ))}
        </div>

        <div style={{marginTop:32,fontSize:12,color:'rgba(255,255,255,.3)'}}>
          Ce code est défini par le gérant du restaurant
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          25%{transform:translateX(-8px)}
          75%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  )

  // BORNE PRINCIPALE (déverrouillée)
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'var(--bg)',fontFamily:'var(--font)'}}>

      {/* STATUS BAR */}
      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:18,fontWeight:800}}>{restaurant.nom}</div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'var(--green)',boxShadow:'0 0 0 3px rgba(52,199,89,.2)'}}></div>
            <span style={{fontSize:12,fontWeight:700,color:'#1a6b35'}}>Borne active • déverrouillée</span>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:22,fontWeight:700,letterSpacing:-.5}}>{clock}</div>
          <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{date}</div>
        </div>
      </div>

      {/* HERO */}
      <div style={{padding:'24px 28px 14px',textAlign:'center'}}>
        <div style={{fontSize:26,fontWeight:800}}>Bonjour, qui êtes-vous ?</div>
        <div style={{fontSize:14,color:'var(--text2)',marginTop:4}}>Appuyez sur votre nom pour pointer votre arrivée ou départ</div>
      </div>

      {/* FILTERS */}
      <div style={{display:'flex',justifyContent:'center',gap:6,padding:'0 28px 18px'}}>
        {['all','present','absent'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'8px 18px',borderRadius:20,fontSize:13,fontWeight:600,
            border:filter===f?'none':'1.5px solid var(--border)',
            background:filter===f?'var(--accent)':'var(--surface)',
            color:filter===f?'white':'var(--text2)',cursor:'pointer',transition:'all .15s'
          }}>
            {f==='all'?'Tous':f==='present'?'Présents':'Pas encore arrivés'}
          </button>
        ))}
      </div>

      {/* GRID EMPLOYES */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,padding:'0 28px 20px',flex:1}}>
        {filtered.map((emp,i)=>{
          const c=COLORS[i%COLORS.length]
          const p=pointages[emp.id]
          const present=p&&p.heure_arrivee&&!p.heure_depart
          return (
            <div key={emp.id} onClick={()=>setSelected(emp)} style={{
              background:present?'var(--green-bg)':'var(--surface)',
              border:`1.5px solid ${present?'var(--green-border)':'var(--border)'}`,
              borderRadius:20,padding:'20px 14px',display:'flex',flexDirection:'column',
              alignItems:'center',gap:10,cursor:'pointer',transition:'all .18s',position:'relative',overflow:'hidden'
            }}>
              {present&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'var(--green)'}}></div>}
              {present&&<div style={{position:'absolute',top:10,right:10,width:10,height:10,borderRadius:'50%',background:'var(--green)',boxShadow:'0 0 0 3px rgba(52,199,89,.2)'}}></div>}
              <div style={{width:62,height:62,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:21,fontWeight:800}}>
                {ini(emp.prenom,emp.nom)}
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:14,fontWeight:700}}>{emp.prenom} {emp.nom}</div>
                <div style={{fontSize:11,color:'var(--text2)'}}>{emp.role}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20,background:present?'rgba(52,199,89,.14)':'var(--bg)',color:present?'#1a6b35':'var(--text3)'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:present?'var(--green)':'var(--text3)'}}></div>
                {present?'Présent':'Pas encore arrivé'}
              </div>
              {present&&p.heure_arrivee&&<div style={{fontSize:11,color:'#1a7a3a',fontWeight:600}}>Arrivée à {p.heure_arrivee.slice(0,5)}</div>}
            </div>
          )
        })}
        {filtered.length===0&&(
          <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'var(--text3)',fontSize:14}}>
            {filter==='present'?'Personne n\'est encore arrivé':filter==='absent'?'Tout le monde est présent !':'Aucun employé dans ce restaurant'}
          </div>
        )}
      </div>

      {/* QR CODE */}
      {restaurant && unlocked && (
        <div style={{background:'var(--surface)',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'center',padding:'8px 0'}}>
          <QRDisplay restaurant={restaurant}/>
        </div>
      )}

      {/* BOTTOM */}
      <div style={{background:'var(--surface)',borderTop:'1px solid var(--border)',padding:'12px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:13,color:'var(--text2)'}}>
          <strong style={{color:'var(--green)'}}>{presentCount}</strong> présent{presentCount>1?'s':''} sur {employes.length} employés
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{setUnlocked(false);sessionStorage.removeItem('borne_unlocked_'+restaurant.id)}} style={{fontSize:12,fontWeight:600,color:'var(--text3)',background:'transparent',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px',cursor:'pointer'}}>
            🔒 Verrouiller
          </button>
          <button onClick={()=>setShowPin(true)} style={{fontSize:13,fontWeight:600,color:'var(--text2)',background:'#f5f5f7',border:'1px solid var(--border2)',borderRadius:10,padding:'8px 16px',display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
            ⚙️ Accès gérant
          </button>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {selected&&(
        <div onClick={()=>setSelected(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:28,padding:'30px 26px',width:330,textAlign:'center',boxShadow:'0 12px 50px rgba(0,0,0,.18)'}}>
            {(()=>{
              const i=employes.findIndex(e=>e.id===selected.id)
              const c=COLORS[i%COLORS.length]
              const p=pointages[selected.id]
              const present=p&&p.heure_arrivee&&!p.heure_depart
              return <>
                <div style={{width:78,height:78,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:27,fontWeight:800,margin:'0 auto 14px'}}>{ini(selected.prenom,selected.nom)}</div>
                <div style={{fontSize:21,fontWeight:800}}>{selected.prenom} {selected.nom}</div>
                <div style={{fontSize:13,color:'var(--text2)',marginTop:3}}>{selected.role}</div>
                <div style={{fontSize:14,color:'var(--text2)',margin:'18px 0 6px'}}>{present?`Arrivé à ${p.heure_arrivee.slice(0,5)} — Enregistrer votre départ ?`:'Enregistrer votre arrivée ?'}</div>
                <div style={{fontSize:38,fontWeight:300,letterSpacing:-1}}>{clock}</div>
                <div style={{display:'flex',gap:10,marginTop:16}}>
                  <button onClick={()=>setSelected(null)} style={{flex:1,height:50,borderRadius:14,border:'none',background:'#f5f5f7',color:'var(--text2)',fontSize:14,fontWeight:700,cursor:'pointer'}}>Annuler</button>
                  <button onClick={()=>doBadge(selected)} style={{flex:1,height:50,borderRadius:14,border:present?'2px solid rgba(255,59,48,.2)':'none',background:present?'var(--red-bg)':'var(--green)',color:present?'var(--red)':'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>{present?'Départ':'Arrivée'}</button>
                </div>
              </>
            })()}
          </div>
        </div>
      )}

      {/* PIN GERANT MODAL */}
      {showPin&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'var(--surface)',borderRadius:28,padding:'30px 26px',width:340,textAlign:'center',boxShadow:'0 12px 50px rgba(0,0,0,.18)'}}>
            <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>Accès gérant</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:24}}>Code PIN gérant à 4 chiffres</div>
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
          <div style={{background:'var(--surface)',borderRadius:28,width:520,boxShadow:'0 12px 60px rgba(0,0,0,.2)',overflow:'hidden',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⚙️</div>
              <div style={{flex:1}}>
                <div style={{fontSize:17,fontWeight:800}}>Panneau gérant</div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{restaurant.nom}</div>
              </div>
              <button onClick={()=>setShowAdmin(false)} style={{width:32,height:32,borderRadius:'50%',border:'none',background:'var(--bg)',color:'var(--text2)',fontSize:18,cursor:'pointer'}}>×</button>
            </div>
            <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',letterSpacing:'.07em',textTransform:'uppercase',marginBottom:10}}>Corriger les pointages du jour</div>
              {employes.map((emp,i)=>{
                const c=COLORS[i%COLORS.length]
                const p=pointages[emp.id]
                const present=p&&p.heure_arrivee&&!p.heure_depart
                return (
                  <div key={emp.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--bg)',borderRadius:14,marginBottom:7,border:'1px solid var(--border)'}}>
                    <div style={{width:38,height:38,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>{ini(emp.prenom,emp.nom)}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700}}>{emp.prenom} {emp.nom}</div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>{present?`Présent depuis ${p.heure_arrivee.slice(0,5)}`:p?.heure_depart?`Parti à ${p.heure_depart.slice(0,5)}`:'Absent / non pointé'}</div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {!present
                        ?<button onClick={()=>forceArrivee(emp.id)} style={{padding:'7px 12px',borderRadius:9,border:'1px solid var(--green-border)',background:'var(--green-bg)',color:'#1a6b35',fontSize:12,fontWeight:700,cursor:'pointer'}}>Forcer arrivée</button>
                        :<button onClick={()=>forceDepart(emp.id)} style={{padding:'7px 12px',borderRadius:9,border:'1px solid rgba(255,59,48,.2)',background:'var(--red-bg)',color:'var(--red)',fontSize:12,fontWeight:700,cursor:'pointer'}}>Forcer départ</button>
                      }
                    </div>
                  </div>
                )
              })}
              {restaurants.length>1&&(
                <div style={{marginTop:20}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',letterSpacing:'.07em',textTransform:'uppercase',marginBottom:10}}>Changer de restaurant</div>
                  {restaurants.filter(r=>r.id!==restaurant.id).map(r=>(
                    <button key={r.id} onClick={()=>{selectResto(r);setShowAdmin(false)}} style={{width:'100%',padding:'10px 14px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',textAlign:'left',fontSize:13,fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
                      🏪 {r.nom}
                    </button>
                  ))}
                </div>
              )}
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
