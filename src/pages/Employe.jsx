import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import QRScanner from '../components/QRScanner'
import CongesEmploye from '../components/CongesEmploye'

const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const POSTE_COLORS = {
  cuisine:{bg:'#f0faf3',c:'#1a6b35',border:'#b8e8c8'},
  salle:{bg:'#e8f2fd',c:'#004aad',border:'#b3d4f7'},
  bar:{bg:'#fff8ee',c:'#8a4a00',border:'#ffd99a'},
  reception:{bg:'#faf5ff',c:'#6b21a8',border:'#e9d5ff'},
  default:{bg:'#f5f5f5',c:'#555',border:'#e0e0e0'}
}
const getPosteColor = (p) => POSTE_COLORS[p?.toLowerCase()] || POSTE_COLORS.default

function ini(p,n){return((p?.[0]||'')+(n?.[0]||'')).toUpperCase()}
function getMonday(d){const dt=new Date(d);const day=dt.getDay();const diff=dt.getDate()-day+(day===0?-6:1);return new Date(dt.setDate(diff))}
function addDays(d,n){const dt=new Date(d);dt.setDate(dt.getDate()+n);return dt}
function fmtDate(d){return d.toISOString().split('T')[0]}
function calcDur(a,b){if(!a||!b)return null;const [ah,am]=a.split(':').map(Number);const [bh,bm]=b.split(':').map(Number);const mins=(bh*60+bm)-(ah*60+am);if(mins<=0)return null;return `${Math.floor(mins/60)}h${mins%60>0?(mins%60)+'min':''}`}
function fmtJour(dateStr){
  const d=new Date(dateStr+'T00:00:00')
  const today=new Date();today.setHours(0,0,0,0)
  const diff=Math.round((d-today)/(1000*60*60*24))
  if(diff===0)return "Aujourd'hui"
  if(diff===-1)return "Hier"
  return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})
}

export default function Employe() {
  const [tab,setTab]=useState('accueil')
  const [employe,setEmploye]=useState(null)
  const [loading,setLoading]=useState(true)
  const [shifts,setShifts]=useState([])
  const [pointages,setPointages]=useState([])
  const [historique,setHistorique]=useState([])
  const [clock,setClock]=useState('')
  const [dateStr,setDateStr]=useState('')
  const [showScanner,setShowScanner]=useState(false)
  const [badgeFlash,setBadgeFlash]=useState(null)
  const [selectedDay,setSelectedDay]=useState(fmtDate(new Date()))
  const navigate=useNavigate()
  const today=fmtDate(new Date())
  const weekStart=getMonday(new Date())
  const weekDays=Array.from({length:7},(_,i)=>addDays(weekStart,i))

  const updateClock=()=>{
    const n=new Date()
    setClock(n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0'))
    setDateStr(n.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))
  }

  useEffect(()=>{
    loadEmployeFromSession()
    updateClock()
    const t=setInterval(updateClock,10000)
    return()=>clearInterval(t)
  },[])

  useEffect(()=>{
    if(!employe) return
    loadShifts();loadPointages();loadHistorique()
    // Realtime shifts
    const chShifts = supabase.channel('employe-shifts')
      .on('postgres_changes',{event:'*',schema:'public',table:'shifts',filter:`employe_id=eq.${employe.id}`},()=>loadShifts())
      .subscribe()
    // Realtime pointages
    const chPointages = supabase.channel('employe-pointages')
      .on('postgres_changes',{event:'*',schema:'public',table:'pointages',filter:`employe_id=eq.${employe.id}`},()=>{loadPointages();loadHistorique()})
      .subscribe()
    return()=>{
      supabase.removeChannel(chShifts)
      supabase.removeChannel(chPointages)
    }
  },[employe])

  async function loadEmployeFromSession(){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session){navigate('/login');return}
    const {data:profil}=await supabase.from('profils').select('*').eq('user_id',session.user.id).single()
    if(!profil||profil.role!=='employe'){navigate('/gerant');return}
    const {data:emp}=await supabase.from('employes').select('*').eq('id',profil.employe_id).single()
    if(!emp){navigate('/login');return}
    setEmploye(emp)
    setLoading(false)
  }

  async function loadShifts(){
    const from=fmtDate(weekStart);const to=fmtDate(addDays(weekStart,6))
    const {data}=await supabase.from('shifts').select('*').eq('employe_id',employe.id).gte('date',from).lte('date',to)
    setShifts(data||[])
  }

  async function loadPointages(){
    const {data}=await supabase.from('pointages').select('*').eq('employe_id',employe.id).eq('date',today).order('heure_arrivee',{ascending:true})
    setPointages(data||[])
  }

  async function loadHistorique(){
    const depuis=fmtDate(addDays(new Date(),-30))
    const {data}=await supabase.from('pointages').select('*').eq('employe_id',employe.id).gte('date',depuis).order('date',{ascending:false}).order('heure_arrivee',{ascending:false})
    setHistorique(data||[])
  }

  async function deconnexion(){await supabase.auth.signOut();navigate('/login')}

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font)',color:'var(--text2)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:36,marginBottom:12}}>⏳</div>
        <div style={{fontSize:14,color:'#888'}}>Chargement...</div>
      </div>
    </div>
  )

  // Pointage actif = dernier sans départ
  const pointageActif=pointages.find(p=>p.heure_arrivee&&!p.heure_depart)
  const isPresent=!!pointageActif
  const todayShift=shifts.find(s=>s.date===selectedDay)
  const sc=getPosteColor(todayShift?.poste)

  // Grouper historique par date
  const historiqueGroupé=historique.reduce((acc,p)=>{
    if(!acc[p.date])acc[p.date]=[]
    acc[p.date].push(p)
    return acc
  },{})

  // Total heures aujourd'hui
  const totalAujourdhui=pointages.reduce((acc,p)=>{
    if(!p.heure_arrivee||!p.heure_depart)return acc
    const [ah,am]=p.heure_arrivee.split(':').map(Number)
    const [bh,bm]=p.heure_depart.split(':').map(Number)
    return acc+(bh*60+bm)-(ah*60+am)
  },0)

  return (
    <div style={{maxWidth:430,margin:'0 auto',minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',fontFamily:'var(--font)'}}>

      {/* ── HEADER ── */}
      <div style={{background:'var(--surface)',padding:'20px 20px 0',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:'#e8f2fd',color:'#0066cc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,flexShrink:0}}>
            {ini(employe.prenom,employe.nom)}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:17,fontWeight:800,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              Bonjour, {employe.prenom} 👋
            </div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:1}}>{dateStr}</div>
          </div>
          <button onClick={deconnexion} style={{fontSize:11,color:'#888',background:'#f5f5f5',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer',fontWeight:600,flexShrink:0}}>
            Déconnexion
          </button>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:0}}>
          {[{id:'accueil',l:'Accueil',icon:'🏠'},{id:'planning',l:'Planning',icon:'📅'},{id:'historique',l:'Historique',icon:'📋'},{id:'profil',l:'Profil',icon:'👤'},{id:'conges',l:'Congés',icon:'🏖️'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'10px 4px',border:'none',background:'transparent',cursor:'pointer',fontSize:12,fontWeight:600,color:tab===t.id?'var(--accent)':'var(--text2)',borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`,transition:'all .15s',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
              <span style={{fontSize:16}}>{t.icon}</span>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── ACCUEIL ── */}
      {tab==='accueil'&&(
        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>

          {/* Carte statut + badge */}
          <div style={{background:isPresent?'#f0fdf4':'var(--surface)',border:`2px solid ${isPresent?'#22c55e':'var(--border)'}`,borderRadius:18,padding:20,transition:'all .3s'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:12,height:12,borderRadius:'50%',background:isPresent?'#22c55e':'#e0e0e0',boxShadow:isPresent?'0 0 0 4px rgba(34,197,94,.2)':'none',transition:'all .3s',flexShrink:0}}></div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700,color:isPresent?'#15803d':'var(--text)'}}>
                  {isPresent?'Vous êtes pointé':'Pas encore pointé'}
                </div>
                {isPresent&&pointageActif?.heure_arrivee&&(
                  <div style={{fontSize:13,color:'#16a34a',marginTop:2,fontWeight:500}}>
                    Arrivée à {pointageActif.heure_arrivee.slice(0,5)}
                  </div>
                )}
              </div>
              <div style={{fontSize:24,fontWeight:900,color:'var(--text)',letterSpacing:'-.02em',fontVariantNumeric:'tabular-nums'}}>{clock}</div>
            </div>

            {/* Bouton scan */}
            <button onClick={()=>setShowScanner(true)} style={{width:'100%',height:52,borderRadius:14,border:'none',background:isPresent?'#dc2626':'#16a34a',color:'white',fontSize:16,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:isPresent?'0 4px 16px rgba(220,38,38,.2)':'0 4px 16px rgba(22,163,74,.2)',transition:'all .2s'}}
            onActiveCapture={e=>e.currentTarget.style.transform='scale(.97)'}
            onBlur={e=>e.currentTarget.style.transform='none'}>
              <span style={{fontSize:20}}>{isPresent?'📷':'📷'}</span>
              {isPresent?'Scanner mon départ':'Scanner mon arrivée'}
            </button>
            <div style={{fontSize:11,color:'var(--text3)',textAlign:'center',marginTop:8}}>
              Scannez le QR code affiché sur la borne
            </div>
          </div>

          {/* Pointages du jour */}
          {pointages.length>0&&(
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--text2)'}}>MES POINTAGES AUJOURD'HUI</div>
                {totalAujourdhui>0&&(
                  <div style={{fontSize:12,fontWeight:700,color:'#0066cc',background:'#f0f7ff',border:'1px solid #d0e8ff',borderRadius:20,padding:'2px 10px'}}>
                    {Math.floor(totalAujourdhui/60)}h{totalAujourdhui%60>0?(totalAujourdhui%60)+'min':''}
                  </div>
                )}
              </div>
              {pointages.map((p,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:!p.heure_depart?'#f0fdf4':'#f8fafc',border:`1px solid ${!p.heure_depart?'#bbf7d0':'#e8e8e8'}`,borderRadius:10,marginBottom:i<pointages.length-1?6:0}}>
                  <span style={{fontSize:16}}>{!p.heure_depart?'🟢':'✅'}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>
                      {p.heure_arrivee?.slice(0,5)} → {p.heure_depart?p.heure_depart.slice(0,5):'en cours'}
                    </div>
                    {p.heure_arrivee&&p.heure_depart&&(
                      <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>
                        Durée : {calcDur(p.heure_arrivee,p.heure_depart)}
                      </div>
                    )}
                  </div>
                  {!p.heure_depart&&(
                    <span style={{fontSize:10,fontWeight:700,color:'#16a34a',background:'#dcfce7',border:'1px solid #bbf7d0',borderRadius:20,padding:'2px 8px'}}>EN COURS</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Shift du jour */}
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>
              MON SHIFT — {new Date(selectedDay+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
            </div>
            {todayShift?(
              <div style={{background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:12,padding:'14px 16px'}}>
                <div style={{fontSize:22,fontWeight:800,color:sc.c,letterSpacing:'-.02em'}}>{todayShift.heure_debut.slice(0,5)} — {todayShift.heure_fin.slice(0,5)}</div>
                {todayShift.heure_debut_2&&(
                  <div style={{fontSize:16,fontWeight:700,color:sc.c,opacity:.8,marginTop:4}}>puis {todayShift.heure_debut_2.slice(0,5)} — {todayShift.heure_fin_2.slice(0,5)}</div>
                )}
                <span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20,marginTop:8,display:'inline-block',background:'white',color:sc.c,border:`1px solid ${sc.border}`}}>
                  {todayShift.poste.charAt(0).toUpperCase()+todayShift.poste.slice(1)}
                </span>
              </div>
            ):(
              <div style={{fontSize:13,color:'var(--text3)',padding:'8px 0'}}>Pas de shift planifié aujourd'hui</div>
            )}
          </div>

          {/* Semaine mini */}
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>CETTE SEMAINE</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
              {weekDays.map((d,i)=>{
                const isToday=fmtDate(d)===today
                const sh=shifts.find(s=>s.date===fmtDate(d))
                const sc2=sh?getPosteColor(sh.poste):null
                return (
                  <div key={i} onClick={()=>setSelectedDay(fmtDate(d))} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'6px 2px',borderRadius:10,background:isToday?'#f0f7ff':'transparent',cursor:'pointer'}}>
                    <span style={{fontSize:9,fontWeight:700,color:isToday?'#0066cc':'var(--text3)',textTransform:'uppercase'}}>{DAYS[i]}</span>
                    <div style={{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,background:isToday?'#0066cc':fmtDate(d)===selectedDay?'rgba(0,102,204,.12)':'transparent',color:isToday?'white':fmtDate(d)===selectedDay?'#0066cc':'var(--text)'}}>
                      {d.getDate()}
                    </div>
                    <div style={{width:6,height:6,borderRadius:'50%',background:sh?(sc2?.c||'#888'):'transparent'}}></div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── PLANNING ── */}
      {tab==='planning'&&(
        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Mon planning de la semaine</div>
          {weekDays.map((d,i)=>{
            const isToday=fmtDate(d)===today
            const sh=shifts.find(s=>s.date===fmtDate(d))
            const sc2=getPosteColor(sh?.poste)
            const label=fmtDate(d)===today?"Aujourd'hui":d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})
            return (
              <div key={i} style={{background:'var(--surface)',border:`1.5px solid ${isToday?'#0066cc':'var(--border)'}`,borderRadius:14,overflow:'hidden'}}>
                <div style={{padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,fontWeight:700,color:isToday?'#0066cc':'var(--text)',textTransform:'capitalize'}}>{label}</span>
                  {isToday&&<span style={{fontSize:10,fontWeight:700,color:'#0066cc',background:'#f0f7ff',border:'1px solid #d0e8ff',borderRadius:20,padding:'2px 8px'}}>Aujourd'hui</span>}
                </div>
                {sh?(
                  <div style={{padding:'12px 14px',borderTop:`1px solid ${sc2.border}`,background:sc2.bg}}>
                    <div style={{fontSize:16,fontWeight:800,color:sc2.c}}>{sh.heure_debut.slice(0,5)} — {sh.heure_fin.slice(0,5)}</div>
                    {sh.heure_debut_2&&<div style={{fontSize:13,fontWeight:700,color:sc2.c,opacity:.8,marginTop:2}}>puis {sh.heure_debut_2.slice(0,5)} — {sh.heure_fin_2.slice(0,5)}</div>}
                    <div style={{fontSize:11,color:sc2.c,opacity:.7,marginTop:6}}>
                      {(()=>{
                        const t1=Math.round((new Date('1970-01-01T'+sh.heure_fin)-new Date('1970-01-01T'+sh.heure_debut))/3600000)
                        const t2=sh.heure_debut_2?Math.round((new Date('1970-01-01T'+sh.heure_fin_2)-new Date('1970-01-01T'+sh.heure_debut_2))/3600000):0
                        return (t1+t2)+'h de travail · '+sh.poste.charAt(0).toUpperCase()+sh.poste.slice(1)
                      })()}
                    </div>
                  </div>
                ):(
                  <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',background:'var(--bg)',fontSize:12,color:'var(--text3)'}}>Repos</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── HISTORIQUE ── */}
      {tab==='historique'&&(
        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:0}}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Mes 30 derniers jours</div>
          <div style={{fontSize:12,color:'var(--text2)',marginBottom:16}}>Historique de vos pointages</div>
          {Object.keys(historiqueGroupé).length===0?(
            <div style={{textAlign:'center',padding:40,color:'var(--text3)',fontSize:14}}>
              <div style={{fontSize:32,marginBottom:12}}>📋</div>
              Aucun pointage dans les 30 derniers jours
            </div>
          ):Object.entries(historiqueGroupé).map(([date,pts])=>{
            const totalMins=pts.reduce((acc,p)=>{
              if(!p.heure_arrivee||!p.heure_depart)return acc
              const [ah,am]=p.heure_arrivee.split(':').map(Number)
              const [bh,bm]=p.heure_depart.split(':').map(Number)
              return acc+(bh*60+bm)-(ah*60+am)
            },0)
            return (
              <div key={date} style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--text)',textTransform:'capitalize'}}>{fmtJour(date)}</div>
                  {totalMins>0&&(
                    <div style={{fontSize:12,fontWeight:600,color:'#0066cc',background:'#f0f7ff',border:'1px solid #d0e8ff',borderRadius:20,padding:'2px 10px'}}>
                      {Math.floor(totalMins/60)}h{totalMins%60>0?(totalMins%60)+'min':''}
                    </div>
                  )}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {pts.map((p,i)=>(
                    <div key={i} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:18}}>{!p.heure_depart?'🟢':'✅'}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>
                          {p.heure_arrivee?.slice(0,5)} → {p.heure_depart?p.heure_depart.slice(0,5):'en cours'}
                        </div>
                        {p.heure_arrivee&&p.heure_depart&&(
                          <div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>
                            {calcDur(p.heure_arrivee,p.heure_depart)}
                          </div>
                        )}
                      </div>
                      {!p.heure_depart&&<span style={{fontSize:10,fontWeight:700,color:'#16a34a',background:'#dcfce7',borderRadius:20,padding:'2px 8px'}}>EN COURS</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── PROFIL ── */}
      {tab==='profil'&&(
        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,padding:24,textAlign:'center'}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:'#e8f2fd',color:'#0066cc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,margin:'0 auto 14px'}}>
              {ini(employe.prenom,employe.nom)}
            </div>
            <div style={{fontSize:20,fontWeight:800,color:'var(--text)'}}>{employe.prenom} {employe.nom}</div>
            <div style={{fontSize:14,color:'var(--text2)',marginTop:4}}>{employe.role}</div>
            <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:12}}>
              <span style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,background:'#f0f7ff',color:'#0066cc',border:'1px solid #d0e8ff'}}>
                {shifts.length} shift{shifts.length>1?'s':''} cette semaine
              </span>
              {totalAujourdhui>0&&(
                <span style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0'}}>
                  {Math.floor(totalAujourdhui/60)}h{totalAujourdhui%60>0?(totalAujourdhui%60)+'min':''} aujourd'hui
                </span>
              )}
            </div>
          </div>

          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
            {[{l:'Email',v:employe.email||'—'},{l:'Poste',v:employe.role},{l:'Statut',v:employe.actif?'Actif':'Inactif'}].map(({l,v},i,arr)=>(
              <div key={l} style={{display:'flex',alignItems:'center',padding:'14px 16px',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                <span style={{fontSize:13,color:'var(--text2)',flex:1}}>{l}</span>
                <span style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{v}</span>
              </div>
            ))}
          </div>

          <button onClick={deconnexion} style={{width:'100%',padding:14,borderRadius:14,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:14,fontWeight:600,cursor:'pointer'}}>
            Se déconnecter
          </button>
        </div>
      )}

      {/* ── CONGÉS ── */}
      {tab==='conges'&&<CongesEmploye employe={employe}/>}

      {/* ── SCANNER ── */}
      {showScanner&&(
        <QRScanner
          employe={employe}
          onSuccess={(type,time)=>{
            setShowScanner(false)
            setBadgeFlash({type,time})
            loadPointages()
            loadHistorique()
            setTimeout(()=>setBadgeFlash(null),3500)
          }}
          onClose={()=>setShowScanner(false)}
        />
      )}

      {/* ── FLASH BADGE ── */}
      {badgeFlash&&(
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)'}}>
          <div style={{background:badgeFlash.type==='arrivee'?'#f0fdf4':'#111',borderRadius:24,padding:'36px 48px',textAlign:'center',boxShadow:'0 16px 48px rgba(0,0,0,.2)',border:badgeFlash.type==='arrivee'?'2px solid #22c55e':'2px solid #333'}}>
            <div style={{fontSize:56,marginBottom:12}}>{badgeFlash.type==='arrivee'?'✅':'👋'}</div>
            <div style={{fontSize:22,fontWeight:800,color:badgeFlash.type==='arrivee'?'#15803d':'white',marginBottom:4}}>
              {badgeFlash.type==='arrivee'?'Arrivée enregistrée !':'Départ enregistré !'}
            </div>
            <div style={{fontSize:16,color:badgeFlash.type==='arrivee'?'#16a34a':'rgba(255,255,255,.6)',fontWeight:500}}>
              {badgeFlash.time}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
