const DAYS_LABELS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function fmtDate(d){return d.toISOString().split('T')[0]}
function calcMins(a,b){
  if(!a||!b)return 0
  const [ah,am]=a.slice(0,5).split(':').map(Number)
  const [bh,bm]=b.slice(0,5).split(':').map(Number)
  return Math.max(0,(bh*60+bm)-(ah*60+am))
}

export default function PlanningMois({ employes, shifts, congesSemaine, shiftColors, today, moisDate, setMoisDate, onCellClick, filtreEmploye }) {
  const year = moisDate.getFullYear()
  const month = moisDate.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month+1, 0)
  const firstDow = monthStart.getDay()===0 ? 6 : monthStart.getDay()-1

  const cells = []
  for(let i=0; i<firstDow; i++) cells.push(null)
  for(let i=1; i<=monthEnd.getDate(); i++) cells.push(new Date(year, month, i))
  while(cells.length % 7 !== 0) cells.push(null)

  // Filtrer par employé si filtre actif
  const filteredShifts = filtreEmploye ? shifts.filter(s=>s.employe_id===filtreEmploye) : shifts
  const filteredConges = filtreEmploye ? congesSemaine.filter(c=>c.employe_id===filtreEmploye) : congesSemaine

  // Stats du mois
  const monthDateStrs = []
  for(let i=1;i<=monthEnd.getDate();i++) monthDateStrs.push(fmtDate(new Date(year,month,i)))
  const totalShiftsMois = filteredShifts.filter(s=>monthDateStrs.includes(s.date)).length
  const totalHeuresMois = filteredShifts.filter(s=>monthDateStrs.includes(s.date)).reduce((a,s)=>a+calcMins(s.heure_debut,s.heure_fin)/60,0)
  const totalCongesMois = filteredConges.filter(c=>monthDateStrs.some(d=>c.date_debut<=d&&c.date_fin>=d)).length
  const empAvecShift = new Set(filteredShifts.filter(s=>monthDateStrs.includes(s.date)).map(s=>s.employe_id)).size

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {[
          {n:totalShiftsMois,l:'Shifts planifiés',c:'#0066cc',bg:'#f0f7ff',bc:'#d0e8ff'},
          {n:`${Math.round(totalHeuresMois)}h`,l:'Heures planifiées',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
          {n:empAvecShift,l:'Employés planifiés',c:'#16a34a',bg:'#f0fdf4',bc:'#bbf7d0'},
          {n:totalCongesMois,l:'Jours congés',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.bc}`,borderRadius:12,padding:'12px 14px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.n}</div>
            <div style={{fontSize:11,color:s.c,marginTop:2,fontWeight:500,opacity:.8}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Grille */}
      <div style={{background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden'}}>
        {/* Header jours */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'2px solid var(--border)'}}>
          {DAYS_LABELS.map((d,i)=>(
            <div key={d} style={{padding:'10px 8px',fontSize:11,fontWeight:700,color:i>=5?'#ea580c':'var(--text2)',textAlign:'center',background:i>=5?'rgba(234,88,12,.04)':'var(--bg)'}}>{d}</div>
          ))}
        </div>

        {/* Semaines */}
        {Array.from({length:cells.length/7},(_,wi)=>{
          // Stats par semaine
          const weekDays = cells.slice(wi*7,(wi+1)*7).filter(Boolean)
          const weekDateStrs = weekDays.map(d=>fmtDate(d))
          const weekShifts = filteredShifts.filter(s=>weekDateStrs.includes(s.date))
          const weekEmpCount = new Set(weekShifts.map(s=>s.employe_id)).size
          const totalEmp = employes.length

          return (
          <div key={wi} style={{borderBottom:wi<cells.length/7-1?'1px solid var(--border)':'none'}}>
            {/* Indicateur semaine */}
            {weekDays.length>0&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'rgba(0,0,0,.01)',borderBottom:'1px solid var(--border)'}}>
                <div style={{gridColumn:'1/-1',padding:'3px 10px',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:9,fontWeight:700,color:'var(--text3)'}}>Sem. {Math.ceil(weekDays[0].getDate()/7)}</span>
                  <div style={{flex:1,height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',background:weekEmpCount/totalEmp>0.7?'#16a34a':weekEmpCount>0?'#0066cc':'var(--border)',width:`${Math.min(100,Math.round(weekEmpCount/totalEmp*100))}%`,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:9,color:'var(--text3)'}}>{weekEmpCount}/{totalEmp} planifiés</span>
                </div>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
              {cells.slice(wi*7,(wi+1)*7).map((day,di)=>{
                const dateStr = day ? fmtDate(day) : null
                const isToday = dateStr===today
                const isWeekend = di >= 5
                const dayShifts = dateStr ? filteredShifts.filter(s=>s.date===dateStr) : []
                const dayConges = dateStr ? filteredConges.filter(c=>c.date_debut<=dateStr&&c.date_fin>=dateStr) : []
                const total = dayShifts.length + dayConges.length

                return (
                  <div key={di}
                    onClick={()=>day&&onCellClick&&onCellClick(day)}
                    style={{
                      minHeight:82,padding:'6px 7px',
                      borderRight:di<6?'1px solid var(--border)':'none',
                      background:!day?'var(--bg)':isToday?'rgba(0,113,227,.05)':isWeekend?'rgba(234,88,12,.03)':'transparent',
                      cursor:day?'pointer':'default',transition:'background .1s'
                    }}
                    onMouseEnter={e=>{if(day)e.currentTarget.style.background=isToday?'rgba(0,113,227,.1)':'rgba(0,0,0,.03)'}}
                    onMouseLeave={e=>{if(day)e.currentTarget.style.background=!day?'var(--bg)':isToday?'rgba(0,113,227,.05)':isWeekend?'rgba(234,88,12,.03)':'transparent'}}
                  >
                    {day&&(
                      <>
                        <div style={{marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:isToday?800:400,width:24,height:24,borderRadius:'50%',background:isToday?'var(--accent)':'transparent',color:isToday?'white':isWeekend?'#ea580c':'var(--text)',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                            {day.getDate()}
                          </span>
                        </div>
                        {dayConges.slice(0,1).map((c,ci)=>{
                          const emp=employes.find(e=>e.id===c.employe_id)
                          return emp?<div key={ci} style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:4,background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {emp.prenom} · Congé
                          </div>:null
                        })}
                        {dayShifts.slice(0,dayConges.length>0?1:2).map((s,si)=>{
                          const emp=employes.find(e=>e.id===s.employe_id)
                          const sc=shiftColors[s.poste]
                          return emp?<div key={si} style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:4,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {emp.prenom} · {s.heure_debut.slice(0,5)}
                          </div>:null
                        })}
                        {total>2&&<div style={{fontSize:9,color:'var(--text3)',fontWeight:600,padding:'1px 4px'}}>+{total-2} autres</div>}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )})}

        {/* Légende */}
        <div style={{padding:'10px 16px',borderTop:'1px solid var(--border)',background:'var(--bg)',display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:11,color:'var(--text3)'}}>Cliquez sur un jour → voir la semaine</span>
          <div style={{display:'flex',gap:10,marginLeft:'auto'}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:10,height:10,borderRadius:2,background:'#fef2f2',border:'1px solid #fecaca'}}/>
              <span style={{fontSize:10,color:'var(--text2)'}}>Congé</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:10,height:10,borderRadius:2,background:'#f0faf3',border:'1px solid #b8e8c8'}}/>
              <span style={{fontSize:10,color:'var(--text2)'}}>Shift planifié</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:'rgba(234,88,12,.2)',border:'1px solid #fed7aa'}}/>
              <span style={{fontSize:10,color:'var(--text2)'}}>Weekend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
