import { useState } from 'react'

const DAYS_LABELS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function fmtDate(d){return d.toISOString().split('T')[0]}

export default function PlanningMois({ employes, shifts, congesSemaine, shiftColors, today, onCellClick }) {
  const [moisDate, setMoisDate] = useState(new Date())

  const year = moisDate.getFullYear()
  const month = moisDate.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month+1, 0)
  const firstDow = monthStart.getDay()===0 ? 6 : monthStart.getDay()-1
  const totalDays = monthEnd.getDate()

  const cells = []
  for(let i=0; i<firstDow; i++) cells.push(null)
  for(let i=1; i<=totalDays; i++) cells.push(new Date(year, month, i))
  while(cells.length % 7 !== 0) cells.push(null)

  const monthLabel = moisDate.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})

  return (
    <div>
      {/* Nav mois */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,background:'var(--surface)',borderRadius:12,padding:'10px 16px',border:'1px solid var(--border)'}}>
        <button onClick={()=>setMoisDate(new Date(year,month-1,1))} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',cursor:'pointer',fontSize:16}}>‹</button>
        <div style={{flex:1,textAlign:'center',fontSize:15,fontWeight:700,textTransform:'capitalize'}}>{monthLabel}</div>
        <button onClick={()=>setMoisDate(new Date(year,month+1,1))} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',cursor:'pointer',fontSize:16}}>›</button>
        <button onClick={()=>setMoisDate(new Date())} style={{padding:'5px 12px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',fontSize:12,fontWeight:600,cursor:'pointer',color:'var(--accent)'}}>Aujourd'hui</button>
      </div>

      {/* Grille */}
      <div style={{background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden'}}>
        {/* Header */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--bg)',borderBottom:'2px solid var(--border)'}}>
          {DAYS_LABELS.map(d=>(
            <div key={d} style={{padding:'9px 6px',fontSize:11,fontWeight:700,color:'var(--text2)',textAlign:'center'}}>{d}</div>
          ))}
        </div>
        {/* Semaines */}
        {Array.from({length:cells.length/7},(_,wi)=>(
          <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:wi<cells.length/7-1?'1px solid var(--border)':'none'}}>
            {cells.slice(wi*7,(wi+1)*7).map((day,di)=>{
              const dateStr = day ? fmtDate(day) : null
              const isToday = dateStr===today
              const isPast = day && day < new Date(today)
              const dayShifts = dateStr ? shifts.filter(s=>s.date===dateStr) : []
              const dayConges = dateStr ? congesSemaine.filter(c=>c.date_debut<=dateStr&&c.date_fin>=dateStr) : []

              return (
                <div key={di} style={{minHeight:80,padding:5,borderRight:di<6?'1px solid var(--border)':'none',background:isToday?'rgba(0,113,227,.04)':!day?'var(--bg)':'transparent',cursor:day?'pointer':'default'}}
                  onClick={()=>day&&onCellClick&&onCellClick(day)}>
                  {day&&(
                    <>
                      <div style={{fontSize:11,fontWeight:isToday?800:500,width:22,height:22,borderRadius:'50%',background:isToday?'var(--accent)':'transparent',color:isToday?'white':isPast?'var(--text3)':'var(--text)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:3}}>{day.getDate()}</div>
                      {dayConges.slice(0,2).map((c,ci)=>{
                        const emp=employes.find(e=>e.id===c.employe_id)
                        return emp?<div key={ci} style={{fontSize:9,fontWeight:600,padding:'2px 5px',borderRadius:4,background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.prenom} · Congé</div>:null
                      })}
                      {dayShifts.slice(0,3).map((s,si)=>{
                        const emp=employes.find(e=>e.id===s.employe_id)
                        const sc=shiftColors[s.poste]
                        return emp?<div key={si} style={{fontSize:9,fontWeight:600,padding:'2px 5px',borderRadius:4,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.prenom} · {s.heure_debut.slice(0,5)}</div>:null
                      })}
                      {(dayShifts.length+dayConges.length)>3&&<div style={{fontSize:9,color:'var(--text3)',fontWeight:600}}>+{dayShifts.length+dayConges.length-3} autres</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
