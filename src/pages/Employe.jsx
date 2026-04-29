import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

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

  useEffect(()=>{
    if(employe){loadShifts();loadPointages()}
  },[employe])

  async function loadEmployeFromSession(){
    const {data:{session}} = await supabase.auth.getSession()
    if(!session){navigate('/login');return}
    
    // Récupérer le profil pour avoir employe_id
    const {data:profil} = await supabase.from('profils').select('*').eq('user_id',session.user.id).single()
    if(!profil||profil.role!=='employe'){navigate('/gerant');return}
    
    // Récupérer les infos de l'employé
    const {data:emp} = await supabase.from('employes').select('*').eq('id',profil.employe_id).single()
    if(!emp){navigate('/login');return}
    
    setEmploye(emp)
    setLoading(false)
  }

  async function loadShifts(){
    const from = fmtDate(weekStart)
    const to = fmtDate(addDays(weekStart,6))
    const {data} = await supabase.from('shifts').select('*').eq('employe_id',employe.id).gte('date',from).lte('date',to)
    setShifts(data||[])
  }

  async function loadPointages(){
    const {data} = await supabase.from('pointages').select('*').eq('employe_id',employe.id).eq('date',today)
    setPointages(data||[])
  }

  async function deconnexion(){
    await supabase.auth.signOut()
    navigate('/login')
  }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'var(--text2)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>🍽️</div>
        <div>Chargement...</div>
      </div>
    </div>
  )

  const todayShift = shifts.find(s=>s.date===today)
  const todayPointage = pointages[0]
  const isPresent = todayPointage?.heure_arrivee && !todayPointage?.heure_depart
  const empIdx = 0
  const empColor = COLORS[empIdx%COLORS.length]
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
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:'10px 4px',border:'none',background:'transparent',cursor:'pointer',
              fontSize:13,fontWeight:600,color:tab===t.id?'var(--accent)':'var(--text2)',
              borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`,transition:'all .15s'
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* ACCUEIL */}
      {tab==='accueil' && (
        <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:12}}>
          {/* Statut présence */}
          <div style={{background:isPresent?'var(--green-bg)':'var(--surface)',border:`1px solid ${isPresent?'var(--green-border)':'var(--border)'}`,borderRadius:16,padding:16}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:isPresent?'var(--green)':'var(--border2)',boxShadow:isPresent?'0 0 0 3px rgba(52,199,89,.2)':'none'}}></div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:isPresent?'#1a6b35':'var(--text)'}}>{isPresent?'Vous êtes pointé':"Pas encore pointé aujourd'hui"}</div>
                {todayPointage?.heure_arrivee&&<div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>Arrivée à {todayPointage.heure_arrivee.slice(0,5)}</div>}
              </div>
              <div style={{fontSize:22,fontWeight:300,letterSpacing:-1}}>{clock}</div>
            </div>
            <div style={{marginTop:12,padding:'10px 12px',background:'rgba(255,149,0,.08)',border:'1px solid rgba(255,149,0,.2)',borderRadius:10}}>
              <div style={{fontSize:12,fontWeight:700,color:'#8a4a00'}}>📍 Badgeage sur la borne uniquement</div>
              <div style={{fontSize:11,color:'#a06020',marginTop:2}}>Pointez à l'entrée du restaurant</div>
            </div>
          </div>

          {/* Shift du jour */}
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>SHIFT DU JOUR</div>
            {todayShift ? (
              <div style={{position:'relative',paddingLeft:12}}>
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'var(--green)',borderRadius:3}}></div>
                <div style={{fontSize:11,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.06em'}}>Aujourd'hui</div>
                <div style={{fontSize:22,fontWeight:800,margin:'4px 0 2px',letterSpacing:-.5}}>{todayShift.heure_debut.slice(0,5)} → {todayShift.heure_fin.slice(0,5)}</div>
                <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20,...shiftColors[todayShift.poste]}}>{todayShift.poste[0].toUpperCase()+todayShift.poste.slice(1)}</span>
              </div>
            ) : (
              <div style={{fontSize:13,color:'var(--text3)',padding:'8px 0'}}>Pas de shift planifié aujourd'hui 😊</div>
            )}
          </div>

          {/* Semaine rapide */}
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
                    <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,background:isToday?'var(--accent)':'transparent',color:isToday?'white':'var(--text)'}}>{d.getDate()}</div>
                    <div style={{width:5,height:5,borderRadius:'50%',background:sh?sc.color:'transparent'}}></div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Heures */}
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>MES HEURES</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{color:'var(--text2)'}}>Shifts cette semaine</span>
                <span style={{fontWeight:700}}>{shifts.length} shift{shifts.length>1?'s':''}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'6px 0'}}>
                <span style={{color:'var(--text2)'}}>Dernier pointage</span>
                <span style={{fontWeight:700}}>{todayPointage?`Aujourd'hui ${todayPointage.heure_arrivee?.slice(0,5)}`:'—'}</span>
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
                <div style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:13,fontWeight:700,color:isToday?'var(--accent)':'var(--text)',flex:1}}>{fmtLabel(d)}</span>
                </div>
                {sh ? (
                  <div style={{padding:'10px 14px',borderTop:`1px solid ${sc.border}`,background:sc.bg,display:'flex',alignItems:'center',gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:sc.color}}>{sh.heure_debut.slice(0,5)} → {sh.heure_fin.slice(0,5)}</div>
                      <div style={{fontSize:11,color:sc.color,opacity:.75,marginTop:2}}>
                        {Math.round((new Date('1970-01-01T'+sh.heure_fin)-new Date('1970-01-01T'+sh.heure_debut))/3600000)}h de travail
                      </div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'white',color:sc.color}}>{sh.poste[0].toUpperCase()+sh.poste.slice(1)}</span>
                  </div>
                ) : (
                  <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',background:'var(--bg)',fontSize:12,color:'var(--text3)'}}>Repos</div>
                )}
              </div>
            )
          })}
          <div style={{background:'var(--orange-bg)',border:'1px solid #ffd99a',borderRadius:14,padding:'12px 14px',marginTop:4}}>
            <div style={{fontSize:12,fontWeight:700,color:'#8a4a00'}}>📍 Badgeage sur la borne uniquement</div>
            <div style={{fontSize:11,color:'#a06020',marginTop:3}}>Pointez à l'entrée du restaurant sur la tablette</div>
          </div>
        </div>
      )}

      {/* PROFIL */}
      {tab==='profil' && (
        <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:empColor.bg,color:empColor.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,margin:'0 auto 12px'}}>{ini(employe.prenom,employe.nom)}</div>
            <div style={{fontSize:18,fontWeight:800}}>{employe.prenom} {employe.nom}</div>
            <div style={{fontSize:13,color:'var(--text2)',marginTop:3}}>{employe.role}</div>
            {isPresent&&<div style={{marginTop:10,display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,background:'var(--green-bg)',color:'#1a6b35',fontSize:12,fontWeight:700}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)'}}></div>Présent aujourd'hui
            </div>}
          </div>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
            {[
              {l:'Email',v:employe.email},
              {l:'Poste',v:employe.role},
              {l:'Shifts cette semaine',v:`${shifts.length} shift${shifts.length>1?'s':''}`},
              {l:"Statut aujourd'hui",v:isPresent?'Présent':todayPointage?.heure_depart?'Parti':'Absent'},
            ].map(({l,v},i,arr)=>(
              <div key={l} style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                <span style={{fontSize:13,color:'var(--text2)',flex:1}}>{l}</span>
                <span style={{fontSize:13,fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={deconnexion} style={{width:'100%',padding:13,borderRadius:14,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--red)',fontSize:14,fontWeight:600,cursor:'pointer'}}>Se déconnecter</button>
        </div>
      )}
    </div>
  )
}
