import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import QRScanner from '../components/QRScanner'

const COLORS = [
  {bg:'#e8f2fd',color:'#0051a8'},{bg:'#f0faf3',color:'#1a6b35'},
  {bg:'#fff8ee',color:'#8a4a00'},{bg:'#f0f0fc',color:'#3a3880'},
  {bg:'#fff2f1',color:'#b02020'},{bg:'#fdf0f8',color:'#8a2060'},
]
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}
function getMonday(d){const dt=new Date(d);const day=dt.getDay();const diff=dt.getDate()-day+(day===0?-6:1);return new Date(dt.setDate(diff))}
function addDays(d,n){const dt=new Date(d);dt.setDate(dt.getDate()+n);return dt}
function fmtDate(d){return d.toISOString().split('T')[0]}
function fmtLabel(d){return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}

export default function Employe() {
  const [tab, setTab] = useState('accueil')
  const [employe, setEmploye] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shifts, setShifts] = useState([])
  const [pointages, setPointages] = useState([])
  const [clock, setClock] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [badgeFlash, setBadgeFlash] = useState(null)
  const [selectedDay, setSelectedDay] = useState(fmtDate(new Date()))
  const navigate = useNavigate()
  const today = fmtDate(new Date())
  const weekStart = getMonday(new Date())
  const weekDays = Array.from({length:7},(_,i)=>addDays(weekStart,i))

  useEffect(()=>{
    loadEmployeFromSession()
    const n = new Date()
    setClock(n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0'))
    setDateStr(n.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))
    const t = setInterval(()=>{
      const nn=new Date()
      setClock(nn.getHours().toString().padStart(2,'0')+':'+nn.getMinutes().toString().padStart(2,'0'))
    },10000)
    return()=>clearInterval(t)
  },[])

  useEffect(()=>{ if(employe){loadShifts();loadPointages()} },[employe])

  async function loadEmployeFromSession(){
    const {data:{session}} = await supabase.auth.getSession()
    if(!session){navigate('/login');return}
    const {data:profil} = await supabase.from('profils').select('*').eq('user_id',session.user.id).single()
    if(!profil||profil.role!=='employe'){navigate('/gerant');return}
    const {data:emp} = await supabase.from('employes').select('*').eq('id',profil.employe_id).single()
    if(!emp){navigate('/login');return}
    setEmploye(emp)
    setLoading(false)
  }

  async function loadShifts(){
    const from=fmtDate(weekStart); const to=fmtDate(addDays(weekStart,6))
    const {data}=await supabase.from('shifts').select('*').eq('employe_id',employe.id).gte('date',from).lte('date',to)
    setShifts(data||[])
  }

  async function loadPointages(){
    const {data}=await supabase.from('pointages').select('*').eq('employe_id',employe.id).eq('date',today)
    setPointages(data||[])
  }

  async function deconnexion(){ await supabase.auth.signOut(); navigate('/login') }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'var(--text2)'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:12}}>🍽️</div><div>Chargement...</div></div>
    </div>
  )

  const todayShift = shifts.find(s=>s.date===selectedDay)
  const todayPointage = pointages[0]
  const isPresent = todayPointage?.heure_arrivee && !todayPointage?.heure_depart
  const isParti = todayPointage?.heure_arrivee && todayPointage?.heure_depart
  const empColor = COLORS[0]
  const shiftColors = {cuisine:{bg:'#f0faf3',color:'#1a6b35',border:'#b8e8c8'},salle:{bg:'#e8f2fd',color:'#004aad',border:'#b3d4f7'},bar:{bg:'#fff8ee',color:'#8a4a00',border:'#ffd99a'}}

  return (
    <div style={{maxWidth:430,margin:'0 auto',minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',fontFamily:'var(--font)'}}>

      {/* HEADER */}
      <div style={{background:'var(--surface)',padding:'16px 20px 0',borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{width:38,height:38,borderRadius:'50%',background:empColor.bg,color:empColor.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>{ini(employe.prenom,employe.nom)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>Bonjour, {employe.prenom} 👋</div>
            <div style={{fontSize:12,color:'var(--text2)'}}>{dateStr}</div>
          </div>
          <button onClick={deconnexion} style={{fontSize:12,color:'var(--red)',background:'var(--red-bg)',border:'none',borderRadius:8,padding:'5px 10px',cursor:'pointer',fontWeight:600}}>Déconnexion</button>
        </div>
        <div style={{display:'flex',gap:2}}>
          {[{id:'accueil',l:'Accueil'},{id:'planning',l:'Planning'},{id:'profil',l:'Profil'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'10px 4px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:600,color:tab===t.id?'var(--accent)':'var(--text2)',borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`,transition:'all .15s'}}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* ACCUEIL */}
      {tab==='accueil' && (
        <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:isPresent?'var(--green-bg)':'var(--surface)',border:`1px solid ${isPresent?'#b8e8c8':'var(--border)'}`,borderRadius:16,padding:16}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:isPresent?'var(--green)':'var(--border2)',boxShadow:isPresent?'0 0 0 3px rgba(52,199,89,.2)':'none'}}></div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:isPresent?'#1a6b35':'var(--text)'}}>{isPresent?'Vous etes pointe':isParti?'Journee terminee':"Pas encore pointe aujourd'hui"}</div>
                {todayPointage?.heure_arrivee&&<div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>Arrivee {todayPointage.heure_arrivee.slice(0,5)}{todayPointage?.heure_depart?' - Depart '+todayPointage.heure_depart.slice(0,5):''}</div>}
              </div>
              <div style={{fontSize:22,fontWeight:300,letterSpacing:-1}}>{clock}</div>
            </div>
            <div style={{marginTop:12}}>
              <button onClick={()=>!isParti&&setShowScanner(true)} style={{width:'100%',height:48,borderRadius:12,border:'none',background:isPresent?'var(--red-bg)':isParti?'var(--bg)':'var(--green)',color:isPresent?'var(--red)':isParti?'var(--text3)':'white',fontSize:15,fontWeight:700,cursor:isParti?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                {isParti?'Journee terminee':isPresent?'Scanner mon depart':'Scanner mon arrivee'}
              </button>
              {!isParti&&<div style={{fontSize:11,color:'var(--text3)',textAlign:'center',marginTop:6}}>Scannez le QR code affiche sur la borne</div>}
            </div>
          </div>

          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>SHIFT - {new Date(selectedDay).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
            {todayShift ? (
              <div style={{position:'relative',paddingLeft:12}}>
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'var(--green)',borderRadius:3}}></div>
                <div style={{fontSize:22,fontWeight:800,margin:'4px 0 2px',letterSpacing:-.5}}>{todayShift.heure_debut.slice(0,5)} - {todayShift.heure_fin.slice(0,5)}</div>
                <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20,...shiftColors[todayShift.poste]}}>{todayShift.poste[0].toUpperCase()+todayShift.poste.slice(1)}</span>
              </div>
            ) : (
              <div style={{fontSize:13,color:'var(--text3)',padding:'8px 0'}}>Pas de shift planifie</div>
            )}
          </div>

          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>CETTE SEMAINE</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
              {weekDays.map((d,i)=>{
                const isToday=fmtDate(d)===today
                const sh=shifts.find(s=>s.date===fmtDate(d))
                const sc=sh?shiftColors[sh.poste]:null
                return (
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'6px 2px',borderRadius:10,background:isToday?'var(--accent-bg)':'transparent'}}>
                    <span style={{fontSize:9,fontWeight:700,color:isToday?'var(--accent)':'var(--text3)',textTransform:'uppercase'}}>{DAYS[i]}</span>
                    <div onClick={()=>setSelectedDay(fmtDate(d))} style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,cursor:'pointer',background:isToday?'var(--accent)':fmtDate(d)===selectedDay?'rgba(0,113,227,.15)':'transparent',color:isToday?'white':fmtDate(d)===selectedDay?'var(--accent)':'var(--text)'}}>{d.getDate()}</div>
                    <div style={{width:5,height:5,borderRadius:'50%',background:sh?sc.color:'transparent'}}></div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>MES HEURES</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{color:'var(--text2)'}}>Shifts cette semaine</span>
                <span style={{fontWeight:700}}>{shifts.length} shift{shifts.length>1?'s':''}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'6px 0'}}>
                <span style={{color:'var(--text2)'}}>Dernier pointage</span>
                <span style={{fontWeight:700}}>{todayPointage?`Aujourd'hui ${todayPointage.heure_arrivee?.slice(0,5)}`:'--'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLANNING */}
      {tab==='planning' && (
        <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Mon planning</div>
          {weekDays.map((d,i)=>{
            const isToday=fmtDate(d)===today
            const sh=shifts.find(s=>s.date===fmtDate(d))
            const sc=sh?shiftColors[sh.poste]:null
            return (
              <div key={i} style={{background:'var(--surface)',border:`1px solid ${isToday?'var(--accent)':'var(--border)'}`,borderRadius:14,overflow:'hidden'}}>
                <div style={{padding:'10px 14px'}}><span style={{fontSize:13,fontWeight:700,color:isToday?'var(--accent)':'var(--text)'}}>{fmtLabel(d)}</span></div>
                {sh ? (
                  <div style={{padding:'10px 14px',borderTop:`1px solid ${sc.border}`,background:sc.bg,display:'flex',alignItems:'center',gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:sc.color}}>{sh.heure_debut.slice(0,5)} - {sh.heure_fin.slice(0,5)}</div>
                      <div style={{fontSize:11,color:sc.color,opacity:.75,marginTop:2}}>{Math.round((new Date('1970-01-01T'+sh.heure_fin)-new Date('1970-01-01T'+sh.heure_debut))/3600000)}h de travail</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'white',color:sc.color}}>{sh.poste[0].toUpperCase()+sh.poste.slice(1)}</span>
                  </div>
                ) : (
                  <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',background:'var(--bg)',fontSize:12,color:'var(--text3)'}}>Repos</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* PROFIL */}
      {tab==='profil' && (
        <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:empColor.bg,color:empColor.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,margin:'0 auto 12px'}}>{ini(employe.prenom,employe.nom)}</div>
            <div style={{fontSize:18,fontWeight:800}}>{employe.prenom} {employe.nom}</div>
            <div style={{fontSize:13,color:'var(--text2)',marginTop:3}}>{employe.role}</div>
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
            {[{l:'Email',v:employe.email},{l:'Poste',v:employe.role},{l:'Shifts semaine',v:`${shifts.length} shift${shifts.length>1?'s':''}`}].map(({l,v},i,arr)=>(
              <div key={l} style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                <span style={{fontSize:13,color:'var(--text2)',flex:1}}>{l}</span>
                <span style={{fontSize:13,fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={deconnexion} style={{width:'100%',padding:13,borderRadius:14,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--red)',fontSize:14,fontWeight:600,cursor:'pointer'}}>Se deconnecter</button>
        </div>
      )}

      {/* SCANNER QR */}
      {showScanner && (
        <QRScanner
          employe={employe}
          onSuccess={(type,time)=>{
            setShowScanner(false)
            setBadgeFlash({type,time})
            loadPointages()
            setTimeout(()=>setBadgeFlash(null),3000)
          }}
          onClose={()=>setShowScanner(false)}
        />
      )}

      {/* FLASH SUCCES */}
      {badgeFlash && (
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,pointerEvents:'none'}}>
          <div style={{background:badgeFlash.type==='arrivee'?'var(--green)':'#1d1d1f',borderRadius:28,padding:'30px 40px',textAlign:'center',color:'white',boxShadow:'0 8px 40px rgba(0,0,0,.2)'}}>
            <div style={{fontSize:52,marginBottom:12}}>{badgeFlash.type==='arrivee'?'👋':'👍'}</div>
            <div style={{fontSize:22,fontWeight:800}}>{employe.prenom}</div>
            <div style={{fontSize:16,opacity:.85,marginTop:4}}>{badgeFlash.type==='arrivee'?'Arrivee':'Depart'} a {badgeFlash.time}</div>
          </div>
        </div>
      )}

    </div>
  )
}
