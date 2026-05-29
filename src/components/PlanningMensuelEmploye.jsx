import { useState, useEffect } from 'react'

export default function PlanningMensuelEmploye({ employe, today, getPosteColor, supabase }) {
  const [planMois, setPlanMois] = useState(new Date())
  const [shiftsMonth, setShiftsMonth] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    if (!employe) return
    const y = planMois.getFullYear(), m = planMois.getMonth()
    const from = y + '-' + String(m+1).padStart(2,'0') + '-01'
    const to = y + '-' + String(m+1).padStart(2,'0') + '-' + String(new Date(y,m+1,0).getDate()).padStart(2,'0')
    supabase.from('shifts').select('*').eq('employe_id', employe.id).gte('date', from).lte('date', to)
      .then(({data}) => setShiftsMonth(data || []))
  }, [planMois, employe?.id])

  const y = planMois.getFullYear(), m = planMois.getMonth()
  const firstDow = new Date(y,m,1).getDay()===0 ? 6 : new Date(y,m,1).getDay()-1
  const cells = []
  for(let i=0; i<firstDow; i++) cells.push(null)
  for(let i=1; i<=new Date(y,m+1,0).getDate(); i++) cells.push(new Date(y,m,i))
  while(cells.length%7 !== 0) cells.push(null)

  const totalH = Math.round(shiftsMonth.reduce((a,s) => {
    const d1 = new Date('1970-01-01T'+s.heure_fin) - new Date('1970-01-01T'+s.heure_debut)
    const d2 = s.heure_debut_2 ? (new Date('1970-01-01T'+s.heure_fin_2) - new Date('1970-01-01T'+s.heure_debut_2)) : 0
    return a + (d1+d2)/3600000
  }, 0))

  const fmtDs = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
  const selectedSh = selectedDay ? shiftsMonth.find(s=>s.date===selectedDay) : null
  const selectedSc = selectedSh ? getPosteColor(selectedSh.poste) : null

  return (
    <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {[{n:shiftsMonth.length,l:'Shifts ce mois',c:'#E11D48'},{n:totalH+'h',l:'Heures planifiées',c:'#16a34a'}].map((s,i)=>(
          <div key={i} style={{background:'var(--surface)',borderRadius:12,padding:'12px 14px',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.n}</div>
            <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface)',borderRadius:12,padding:'10px 14px',border:'1px solid var(--border)'}}>
        <button onClick={()=>setPlanMois(new Date(y,m-1,1))} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
        <div style={{flex:1,textAlign:'center',fontSize:14,fontWeight:700,textTransform:'capitalize'}}>{planMois.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</div>
        <button onClick={()=>setPlanMois(new Date(y,m+1,1))} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
        <button onClick={()=>setPlanMois(new Date())} style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)',fontSize:11,fontWeight:600,color:'#E11D48',cursor:'pointer'}}>Auj.</button>
      </div>

      <div style={{background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--bg)',borderBottom:'1px solid var(--border)'}}>
          {['L','M','M','J','V','S','D'].map((d,i)=>(
            <div key={i} style={{padding:'8px 4px',fontSize:10,fontWeight:700,color:i>=5?'#ea580c':'var(--text2)',textAlign:'center'}}>{d}</div>
          ))}
        </div>
        {Array.from({length:cells.length/7},(_,wi)=>(
          <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:wi<cells.length/7-1?'1px solid var(--border)':'none'}}>
            {cells.slice(wi*7,(wi+1)*7).map((day,di)=>{
              if(!day) return <div key={di} style={{minHeight:52,background:'rgba(0,0,0,.02)'}}/>
              const ds=fmtDs(day)
              const sh=shiftsMonth.find(s=>s.date===ds)
              const isToday=ds===today
              const isSelected=ds===selectedDay
              const isWE=di>=5
              const pc=sh?getPosteColor(sh.poste):null
              return (
                <div key={di} onClick={()=>setSelectedDay(isSelected?null:ds)}
                  style={{minHeight:52,padding:'5px 4px',borderRight:di<6?'1px solid var(--border)':'none',
                    background:isSelected?'#fff1f3':isToday?'rgba(0,102,204,.05)':isWE?'rgba(234,88,12,.03)':'transparent',
                    cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                  <span style={{fontSize:11,fontWeight:isToday?800:400,width:22,height:22,borderRadius:'50%',
                    background:isToday?'#E11D48':'transparent',
                    color:isToday?'white':isWE?'#ea580c':'var(--text)',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {day.getDate()}
                  </span>
                  {sh&&<div style={{width:'70%',height:4,borderRadius:2,background:pc.c}}/>}
                  {sh&&<div style={{fontSize:8,fontWeight:700,color:pc.c}}>{sh.heure_debut.slice(0,5)}</div>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {selectedDay&&(
        <div style={{background:'var(--surface)',borderRadius:14,border:`1.5px solid ${selectedSh?selectedSc.border:'var(--border)'}`,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:13,fontWeight:700,textTransform:'capitalize'}}>
              {new Date(selectedDay+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
            </div>
            <button onClick={()=>setSelectedDay(null)} style={{width:24,height:24,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--bg)',cursor:'pointer',fontSize:12}}>✕</button>
          </div>
          {selectedSh?(
            <div style={{padding:'14px 16px',borderTop:`1px solid ${selectedSc.border}`,background:selectedSc.bg}}>
              <div style={{fontSize:20,fontWeight:800,color:selectedSc.c}}>{selectedSh.heure_debut.slice(0,5)} — {selectedSh.heure_fin.slice(0,5)}</div>
              {selectedSh.heure_debut_2&&<div style={{fontSize:14,color:selectedSc.c,opacity:.8,marginTop:4}}>puis {selectedSh.heure_debut_2.slice(0,5)} — {selectedSh.heure_fin_2.slice(0,5)}</div>}
              <div style={{fontSize:12,color:selectedSc.c,opacity:.7,marginTop:8}}>
                {Math.round(((new Date('1970-01-01T'+selectedSh.heure_fin)-new Date('1970-01-01T'+selectedSh.heure_debut))+(selectedSh.heure_debut_2?(new Date('1970-01-01T'+selectedSh.heure_fin_2)-new Date('1970-01-01T'+selectedSh.heure_debut_2)):0))/3600000)}h · {selectedSh.poste.charAt(0).toUpperCase()+selectedSh.poste.slice(1)}
              </div>
            </div>
          ):(
            <div style={{padding:'14px 16px',borderTop:'1px solid var(--border)',background:'var(--bg)',fontSize:13,color:'var(--text3)'}}>Repos — pas de shift ce jour</div>
          )}
        </div>
      )}
    </div>
  )
}
