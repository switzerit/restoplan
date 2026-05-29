const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function fmtDate(d){return d.toISOString().split('T')[0]}
function calcH(a,b){
  if(!a||!b)return 0
  const [ah,am]=a.slice(0,5).split(':').map(Number)
  const [bh,bm]=b.slice(0,5).split(':').map(Number)
  return Math.max(0,((bh*60+bm)-(ah*60+am))/60)
}

export default function PlanningMois({employes,shifts,congesSemaine,shiftColors,today,moisDate,setMoisDate,onCellClick,filtreEmploye}){
  const y=moisDate.getFullYear(), m=moisDate.getMonth()
  const mEnd=new Date(y,m+1,0)
  const firstDow=new Date(y,m,1).getDay()===0?6:new Date(y,m,1).getDay()-1
  const cells=[]
  for(let i=0;i<firstDow;i++)cells.push(null)
  for(let i=1;i<=mEnd.getDate();i++)cells.push(new Date(y,m,i))
  while(cells.length%7!==0)cells.push(null)

  const fShifts=filtreEmploye?shifts.filter(s=>s.employe_id===filtreEmploye):shifts
  const fConges=filtreEmploye?congesSemaine.filter(c=>c.employe_id===filtreEmploye):congesSemaine
  const mDates=cells.filter(Boolean).map(d=>fmtDate(d))
  const mShifts=fShifts.filter(s=>mDates.includes(s.date))
  const mConges=fConges.filter(c=>mDates.some(d=>c.date_debut<=d&&c.date_fin>=d))
  const mHeures=Math.round(mShifts.reduce((a,s)=>a+calcH(s.heure_debut,s.heure_fin),0))
  const mEmp=new Set(mShifts.map(s=>s.employe_id)).size

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {[
          {icon:'📅',n:mShifts.length,l:'Shifts',c:'#E11D48',bg:'#fff1f3',bc:'#fecdd3'},
          {icon:'⏱️',n:`${mHeures}h`,l:'Planifiées',c:'#7c3aed',bg:'#faf5ff',bc:'#e9d5ff'},
          {icon:'👥',n:mEmp,l:'Employés',c:'#16a34a',bg:'#f0fdf4',bc:'#bbf7d0'},
          {icon:'🏖️',n:mConges.length,l:'Congés',c:'#dc2626',bg:'#fef2f2',bc:'#fecaca'},
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:`1.5px solid ${s.bc}`,borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:22}}>{s.icon}</div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:s.c,lineHeight:1}}>{s.n}</div>
              <div style={{fontSize:11,color:s.c,marginTop:3,fontWeight:500,opacity:.75}}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grille */}
      <div style={{background:'var(--surface)',borderRadius:16,border:'1px solid var(--border)',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.04)'}}>
        {/* Header */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'2px solid var(--border)'}}>
          {DAYS.map((d,i)=>(
            <div key={d} style={{padding:'11px 8px',fontSize:11,fontWeight:700,color:i>=5?'#ea580c':'var(--text2)',textAlign:'center',background:i>=5?'rgba(234,88,12,.05)':'var(--bg)'}}>{d}</div>
          ))}
        </div>

        {Array.from({length:cells.length/7},(_,wi)=>(
          <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:wi<cells.length/7-1?'1px solid var(--border)':'none'}}>
            {cells.slice(wi*7,(wi+1)*7).map((day,di)=>{
              const ds=day?fmtDate(day):null
              const isToday=ds===today
              const isWE=di>=5
              const dayS=ds?fShifts.filter(s=>s.date===ds):[]
              const dayC=ds?fConges.filter(c=>c.date_debut<=ds&&c.date_fin>=ds):[]
              const hasConflict=dayS.some(s=>dayC.some(c=>c.employe_id===s.employe_id))
              const total=dayS.length+dayC.length

              return (
                <div key={di}
                  onClick={()=>day&&onCellClick&&onCellClick(day)}
                  style={{minHeight:90,padding:'7px 8px',borderRight:di<6?'1px solid var(--border)':'none',
                    background:!day?'rgba(0,0,0,.02)':isToday?'rgba(0,102,204,.06)':isWE?'rgba(234,88,12,.03)':'white',
                    cursor:day?'pointer':'default',transition:'all .15s',position:'relative'}}
                  onMouseEnter={e=>{if(day)e.currentTarget.style.background=isToday?'rgba(0,102,204,.1)':'rgba(0,0,0,.03)'}}
                  onMouseLeave={e=>{if(day)e.currentTarget.style.background=!day?'rgba(0,0,0,.02)':isToday?'rgba(0,102,204,.06)':isWE?'rgba(234,88,12,.03)':'white'}}
                >
                  {hasConflict&&<div style={{position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',background:'#dc2626',color:'white',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>!</div>}
                  {day&&<>
                    <div style={{marginBottom:5}}>
                      <span style={{fontSize:12,fontWeight:isToday?800:500,width:26,height:26,borderRadius:'50%',
                        background:isToday?'#E11D48':'transparent',
                        color:isToday?'white':isWE?'#ea580c':'var(--text)',
                        display:'inline-flex',alignItems:'center',justifyContent:'center',
                        boxShadow:isToday?'0 2px 8px rgba(0,102,204,.3)':'none'
                      }}>{day.getDate()}</span>
                    </div>
                    {dayC.slice(0,1).map((c,ci)=>{
                      const emp=employes.find(e=>e.id===c.employe_id)
                      return emp?<div key={ci} style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:5,background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {emp.prenom} · Congé
                      </div>:null
                    })}
                    {dayS.slice(0,dayC.length>0?1:2).map((s,si)=>{
                      const emp=employes.find(e=>e.id===s.employe_id)
                      const sc=shiftColors[s.poste]
                      return emp?<div key={si} style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:5,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {emp.prenom} · {s.heure_debut.slice(0,5)}
                      </div>:null
                    })}
                    {total>2&&<div style={{fontSize:9,color:'var(--text3)',fontWeight:600,padding:'1px 4px'}}>+{total-2}</div>}
                  </>}
                </div>
              )
            })}
          </div>
        ))}

        {/* Footer légende */}
        <div style={{padding:'10px 16px',borderTop:'1px solid var(--border)',background:'var(--bg)',display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:11,color:'var(--text3)'}}>Cliquez sur un jour pour voir la semaine détaillée</span>
          <div style={{display:'flex',gap:12,marginLeft:'auto',alignItems:'center'}}>
            {[
              {bg:'#fef2f2',bc:'#fecaca',c:'#dc2626',l:'Congé'},
              {bg:'#f0faf3',bc:'#b8e8c8',c:'#1a6b35',l:'Shift'},
              {bg:'white',bc:'#dc2626',c:'#dc2626',l:'⚠️ Conflit'},
            ].map((s,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:5}}>
                <div style={{width:11,height:11,borderRadius:3,background:s.bg,border:`1.5px solid ${s.bc}`}}/>
                <span style={{fontSize:10,color:'var(--text2)',fontWeight:500}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
