const DAYS_LABELS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function fmtDate(d){return d.toISOString().split('T')[0]}

export default function PlanningMois({ employes, shifts, congesSemaine, shiftColors, today, moisDate, setMoisDate, onCellClick }) {
  const year = moisDate.getFullYear()
  const month = moisDate.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month+1, 0)
  const firstDow = monthStart.getDay()===0 ? 6 : monthStart.getDay()-1

  const cells = []
  for(let i=0; i<firstDow; i++) cells.push(null)
  for(let i=1; i<=monthEnd.getDate(); i++) cells.push(new Date(year, month, i))
  while(cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden'}}>
      {/* Header jours */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--bg)',borderBottom:'2px solid var(--border)'}}>
        {DAYS_LABELS.map((d,i)=>(
          <div key={d} style={{padding:'10px 8px',fontSize:11,fontWeight:700,color:i>=5?'#ea580c':'var(--text2)',textAlign:'center'}}>{d}</div>
        ))}
      </div>

      {/* Semaines */}
      {Array.from({length:cells.length/7},(_,wi)=>(
        <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:wi<cells.length/7-1?'1px solid var(--border)':'none'}}>
          {cells.slice(wi*7,(wi+1)*7).map((day,di)=>{
            const dateStr = day ? fmtDate(day) : null
            const isToday = dateStr===today
            const isWeekend = di >= 5
            const otherMonth = !day
            const dayShifts = dateStr ? shifts.filter(s=>s.date===dateStr) : []
            const dayConges = dateStr ? congesSemaine.filter(c=>c.date_debut<=dateStr&&c.date_fin>=dateStr) : []
            const total = dayShifts.length + dayConges.length

            return (
              <div key={di}
                onClick={()=>day&&onCellClick&&onCellClick(day)}
                style={{
                  minHeight:85,padding:'6px 7px',
                  borderRight:di<6?'1px solid var(--border)':'none',
                  background:otherMonth?'var(--bg)':isToday?'rgba(0,113,227,.05)':isWeekend?'rgba(0,0,0,.01)':'transparent',
                  cursor:day?'pointer':'default',
                  transition:'background .1s'
                }}
                onMouseEnter={e=>{if(day)e.currentTarget.style.background=isToday?'rgba(0,113,227,.08)':'var(--bg)'}}
                onMouseLeave={e=>{if(day)e.currentTarget.style.background=isToday?'rgba(0,113,227,.05)':isWeekend?'rgba(0,0,0,.01)':'transparent'}}
              >
                {day&&(
                  <>
                    {/* Numéro du jour */}
                    <div style={{marginBottom:4}}>
                      <span style={{
                        fontSize:12,fontWeight:isToday?800:400,
                        width:24,height:24,borderRadius:'50%',
                        background:isToday?'var(--accent)':'transparent',
                        color:isToday?'white':isWeekend?'#ea580c':'var(--text)',
                        display:'inline-flex',alignItems:'center',justifyContent:'center'
                      }}>{day.getDate()}</span>
                    </div>

                    {/* Congés */}
                    {dayConges.slice(0,1).map((c,ci)=>{
                      const emp=employes.find(e=>e.id===c.employe_id)
                      return emp?<div key={ci} style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:4,background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {emp.prenom} · Congé
                      </div>:null
                    })}

                    {/* Shifts */}
                    {dayShifts.slice(0,dayConges.length>0?1:2).map((s,si)=>{
                      const emp=employes.find(e=>e.id===s.employe_id)
                      const sc=shiftColors[s.poste]
                      return emp?<div key={si} style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:4,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {emp.prenom} · {s.heure_debut.slice(0,5)}
                      </div>:null
                    })}

                    {/* +N autres */}
                    {total>2&&<div style={{fontSize:9,color:'var(--text3)',fontWeight:600,padding:'1px 4px'}}>
                      +{total-2} autres
                    </div>}

                    {/* Indicateur si shifts mais pas affiché */}
                    {total===0&&<div style={{display:'flex',gap:3,marginTop:4}}>
                    </div>}
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Légende */}
      <div style={{padding:'10px 16px',borderTop:'1px solid var(--border)',background:'var(--bg)',display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontSize:11,color:'var(--text3)',fontWeight:600}}>Cliquez sur un jour pour voir la semaine</span>
        <div style={{display:'flex',gap:10,marginLeft:'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:10,height:10,borderRadius:2,background:'#fef2f2',border:'1px solid #fecaca'}}/>
            <span style={{fontSize:10,color:'var(--text2)'}}>Congé</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:10,height:10,borderRadius:2,background:'#f0faf3',border:'1px solid #b8e8c8'}}/>
            <span style={{fontSize:10,color:'var(--text2)'}}>Shift</span>
          </div>
        </div>
      </div>
    </div>
  )
}
