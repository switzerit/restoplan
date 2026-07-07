import { useState, useRef, useEffect } from 'react'

const PAYS=[
  {code:'CH',nom:'Suisse',ind:'+41',flag:'🇨🇭'},
  {code:'FR',nom:'France',ind:'+33',flag:'🇫🇷'},
  {code:'BE',nom:'Belgique',ind:'+32',flag:'🇧🇪'},
  {code:'LU',nom:'Luxembourg',ind:'+352',flag:'🇱🇺'},
  {code:'DE',nom:'Allemagne',ind:'+49',flag:'🇩🇪'},
  {code:'IT',nom:'Italie',ind:'+39',flag:'🇮🇹'},
  {code:'ES',nom:'Espagne',ind:'+34',flag:'🇪🇸'},
  {code:'PT',nom:'Portugal',ind:'+351',flag:'🇵🇹'},
  {code:'GB',nom:'Royaume-Uni',ind:'+44',flag:'🇬🇧'},
  {code:'NL',nom:'Pays-Bas',ind:'+31',flag:'🇳🇱'},
  {code:'AT',nom:'Autriche',ind:'+43',flag:'🇦🇹'},
  {code:'US',nom:'États-Unis',ind:'+1',flag:'🇺🇸'},
  {code:'CA',nom:'Canada',ind:'+1',flag:'🇨🇦'},
  {code:'MA',nom:'Maroc',ind:'+212',flag:'🇲🇦'},
  {code:'DZ',nom:'Algérie',ind:'+213',flag:'🇩🇿'},
  {code:'TN',nom:'Tunisie',ind:'+216',flag:'🇹🇳'},
  {code:'TR',nom:'Turquie',ind:'+90',flag:'🇹🇷'},
  {code:'LK',nom:'Sri Lanka',ind:'+94',flag:'🇱🇰'},
  {code:'IN',nom:'Inde',ind:'+91',flag:'🇮🇳'},
  {code:'CN',nom:'Chine',ind:'+86',flag:'🇨🇳'},
  {code:'BR',nom:'Brésil',ind:'+55',flag:'🇧🇷'},
]

// Sépare un numéro stocké (ex "+41 79 123") en {indicatif, reste}
function parseValue(val){
  if(!val) return {pays:PAYS[0], numero:''}
  const trimmed=val.trim()
  // Chercher le pays dont l'indicatif matche (le plus long d'abord)
  const sorted=[...PAYS].sort((a,b)=>b.ind.length-a.ind.length)
  for(const p of sorted){
    if(trimmed.startsWith(p.ind)){
      return {pays:p, numero:trimmed.slice(p.ind.length).trim()}
    }
  }
  return {pays:PAYS[0], numero:trimmed}
}

export default function PhoneField({value, onChange}){
  const init=parseValue(value)
  const [pays,setPays]=useState(init.pays)
  const [numero,setNumero]=useState(init.numero)
  const [open,setOpen]=useState(false)
  const [search,setSearch]=useState('')
  const ref=useRef(null)

  useEffect(()=>{
    const p=parseValue(value)
    setPays(p.pays); setNumero(p.numero)
  },[])

  useEffect(()=>{
    function onDoc(e){ if(ref.current&&!ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown',onDoc)
    return ()=>document.removeEventListener('mousedown',onDoc)
  },[])

  function emit(p,n){
    const val=n.trim()?`${p.ind} ${n.trim()}`:''
    onChange(val)
  }
  function choisirPays(p){
    setPays(p); setOpen(false); setSearch('')
    emit(p,numero)
  }
  function onNum(e){
    const n=e.target.value
    setNumero(n); emit(pays,n)
  }

  const filtered=search.trim()
    ? PAYS.filter(p=>p.nom.toLowerCase().includes(search.toLowerCase())||p.ind.includes(search))
    : PAYS

  const inputBase={padding:'9px 12px',borderRadius:8,border:'1.5px solid var(--border2)',background:'var(--bg)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box'}

  return (
    <div ref={ref} style={{position:'relative',display:'flex',gap:6}}>
      <button type="button" onClick={()=>setOpen(o=>!o)} style={{...inputBase,display:'flex',alignItems:'center',gap:6,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>
        <span style={{fontSize:16}}>{pays.flag}</span>
        <span style={{fontSize:13,color:'var(--text2)'}}>{pays.ind}</span>
        <span style={{fontSize:10,color:'var(--text3)'}}>▾</span>
      </button>
      <input type="tel" value={numero} onChange={onNum} placeholder="79 123 45 67" style={{...inputBase,flex:1,width:'100%'}}/>

      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,zIndex:50,width:260,maxHeight:280,overflowY:'auto',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,boxShadow:'0 8px 30px rgba(0,0,0,.14)',scrollbarWidth:'none'}}>
          <div style={{padding:8,position:'sticky',top:0,background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un pays..." style={{...inputBase,width:'100%',fontSize:12,padding:'7px 10px'}}/>
          </div>
          {filtered.map(p=>(
            <button key={p.code} type="button" onClick={()=>choisirPays(p)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',border:'none',background:pays.code===p.code?'var(--bg)':'transparent',cursor:'pointer',textAlign:'left'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
              onMouseLeave={e=>e.currentTarget.style.background=pays.code===p.code?'var(--bg)':'transparent'}>
              <span style={{fontSize:17}}>{p.flag}</span>
              <span style={{flex:1,fontSize:13,color:'var(--text)'}}>{p.nom}</span>
              <span style={{fontSize:12,color:'var(--text2)'}}>{p.ind}</span>
            </button>
          ))}
          {filtered.length===0&&<div style={{padding:'14px',textAlign:'center',fontSize:12,color:'var(--text3)'}}>Aucun pays</div>}
        </div>
      )}
    </div>
  )
}
