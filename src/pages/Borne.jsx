import Logo from '../components/Logo'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import socket from '../socketClient'
import { api } from '../apiClient'
import { generateToken, secondsLeft } from '../lib/qrToken'
import { useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'

// ── Wake Lock ─────────────────────────────────────────────────────────
function useWakeLock() {
  const ref = useRef(null)
  const acquire = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) ref.current = await navigator.wakeLock.request('screen')
    } catch(e) {}
  }, [])
  useEffect(() => {
    acquire()
    const re = () => { if(document.visibilityState==='visible') acquire() }
    document.addEventListener('visibilitychange', re)
    return () => { document.removeEventListener('visibilitychange', re); ref.current?.release() }
  }, [acquire])
}

// ── QR Code réel ──────────────────────────────────────────────────────
function RealQR({ restoId, secret }) {
  const [dataUrl, setDataUrl] = useState('')
  const [secs, setSecs] = useState(secondsLeft())
  const [prog, setProg] = useState(0)

  const generate = useCallback(async () => {
    const token = generateToken(restoId, secret)
    const payload = JSON.stringify({ token, restoId, secret })
    try {
      const url = await QRCode.toDataURL(payload, {
        width: 220, margin: 1,
        color: { dark: '#111111', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      })
      setDataUrl(url)
    } catch(e) { console.error(e) }
  }, [restoId, secret])

  useEffect(() => {
    generate()
    const iv = setInterval(() => {
      const s = secondsLeft()
      setSecs(s)
      setProg(((30 - s) / 30) * 100)
      if (s === 30 || s === 0) generate()
    }, 500)
    return () => clearInterval(iv)
  }, [generate])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      {dataUrl ? (
        <img src={dataUrl} alt="QR Code" style={{ width:220, height:220, borderRadius:12, border:'1px solid #e8e8e8', boxShadow:'0 4px 24px rgba(0,0,0,.08)' }}/>
      ) : (
        <div style={{ width:220, height:220, borderRadius:12, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#aaa' }}>Génération...</div>
      )}
      <div style={{ width:220 }}>
        <div style={{ height:3, background:'#e8e8e8', borderRadius:2 }}>
          <div style={{ height:'100%', background:'#E11D48', borderRadius:2, width:`${prog}%`, transition:'width .5s linear' }}/>
        </div>
        <div style={{ fontSize:11, color:'#999', textAlign:'center', marginTop:4, fontWeight:500 }}>
          Renouvellement dans {secs}s
        </div>
      </div>
    </div>
  )
}

// ── Clavier PIN ───────────────────────────────────────────────────────
function PINKeypad({ onSubmit, error, tentatives, bloqueJusqua }) {
  const [pin, setPin] = useState('')
  const MAX = 4

  const handleKey = (k) => {
    if (pin.length >= MAX) return
    const next = pin + k
    setPin(next)
    if (next.length === MAX) setTimeout(() => { onSubmit(next); setPin('') }, 150)
  }

  const [countdown, setCountdown] = useState(0)
  useEffect(() => {
    if (!bloqueJusqua) { setCountdown(0); return }
    const upd = () => setCountdown(Math.max(0, Math.ceil((new Date(bloqueJusqua) - new Date()) / 1000)))
    upd()
    const iv = setInterval(upd, 1000)
    return () => clearInterval(iv)
  }, [bloqueJusqua])

  const blocked = countdown > 0

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
      {/* Dots */}
      <div style={{ display:'flex', gap:16 }}>
        {Array.from({length:MAX}).map((_,i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: i<pin.length ? '#E11D48' : 'transparent', border:`2px solid ${i<pin.length ? '#E11D48' : '#d0d0d0'}`, transition:'all .15s' }}/>
        ))}
      </div>

      {error && !blocked && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'9px 18px', fontSize:13, color:'#dc2626', textAlign:'center', fontWeight:500 }}>{error}</div>
      )}
      {blocked && (
        <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'9px 18px', fontSize:13, color:'#ea580c', textAlign:'center', fontWeight:500 }}>
          ⏱ Bloquée {countdown}s
        </div>
      )}

      {/* Clavier */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, opacity:blocked?.4:1, pointerEvents:blocked?'none':'auto' }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k,i) => {
          if (k==='') return <div key={i}/>
          return (
            <button key={i}
              onClick={() => k==='⌫' ? setPin(p=>p.slice(0,-1)) : handleKey(String(k))}
              style={{ width:76, height:76, borderRadius:18, border:'1.5px solid #e8e8e8', background: k==='⌫'?'#f8fafc':'white', fontSize: k==='⌫'?22:28, fontWeight: k==='⌫'?400:700, color:'#111', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.05)', transition:'transform .1s', display:'flex', alignItems:'center', justifyContent:'center' }}
              onPointerDown={e=>e.currentTarget.style.transform='scale(.93)'}
              onPointerUp={e=>e.currentTarget.style.transform='scale(1)'}
              onPointerLeave={e=>e.currentTarget.style.transform='scale(1)'}
            >{k}</button>
          )
        })}
      </div>

      {tentatives > 0 && !blocked && (
        <div style={{ fontSize:12, color:'#aaa', textAlign:'center' }}>
          {tentatives % 3} tentative{(tentatives%3)>1?'s':''} · {3-(tentatives%3)} avant blocage
        </div>
      )}
    </div>
  )
}

// ── Présences live ────────────────────────────────────────────────────
function PresencesLive({ restoId }) {
  const [presences, setPresences] = useState([])

  const load = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('pointages')
      .select('*, employes(prenom,nom,role)')
      .eq('restaurant_id', restoId)
      .eq('date', today)
      .order('heure_arrivee', { ascending: false })
    setPresences(data || [])
  }, [restoId])

  useEffect(() => {
    load()
    // Realtime via Socket.io
    socket.connect()
    socket.emit('join-restaurant', restoId)
    socket.on('pointage', load)
    return () => { socket.off('pointage'); socket.disconnect() }
  }, [load])

  const presents = presences.filter(p => p.heure_arrivee && !p.heure_depart)
  const partis = presences.filter(p => p.heure_arrivee && p.heure_depart)

  if (presences.length === 0) return (
    <div style={{ fontSize:13, color:'#aaa', textAlign:'center', padding:'12px 0' }}>Aucun pointage aujourd'hui</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {presents.length > 0 && (
        <>
          <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', letterSpacing:'.08em', marginBottom:2 }}>PRÉSENTS ({presents.length})</div>
          {presents.map((p,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#16a34a', flexShrink:0 }}>
                {(p.employes?.prenom?.[0]||'')+(p.employes?.nom?.[0]||'')}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>{p.employes?.prenom} {p.employes?.nom}</div>
                <div style={{ fontSize:11, color:'#888' }}>{p.employes?.role} · Arrivée {p.heure_arrivee?.slice(0,5)}</div>
              </div>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 0 2px rgba(34,197,94,.25)' }}></div>
            </div>
          ))}
        </>
      )}
      {partis.length > 0 && (
        <>
          <div style={{ fontSize:11, fontWeight:700, color:'#888', letterSpacing:'.08em', marginTop:6, marginBottom:2 }}>PARTIS ({partis.length})</div>
          {partis.map((p,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px', background:'#f8fafc', border:'1px solid #e8e8e8', borderRadius:10 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#888', flexShrink:0 }}>
                {(p.employes?.prenom?.[0]||'')+(p.employes?.nom?.[0]||'')}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#555' }}>{p.employes?.prenom} {p.employes?.nom}</div>
                <div style={{ fontSize:11, color:'#aaa' }}>{p.heure_arrivee?.slice(0,5)} → {p.heure_depart?.slice(0,5)}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ══ PAGE BORNE ════════════════════════════════════════════════════════
export default function Borne() {
  useWakeLock()
  const [params] = useSearchParams()
  const token = params.get('token')

  const [state, setState] = useState('loading')
  const [restaurant, setRestaurant] = useState(null)
  const [pinError, setPinError] = useState('')
  const [tentatives, setTentatives] = useState(0)
  const [bloqueJusqua, setBloqueJusqua] = useState(null)
  const [heure, setHeure] = useState(new Date())
  const [lastBadge, setLastBadge] = useState(null)

  useEffect(() => {
    const iv = setInterval(() => setHeure(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const goFS = () => document.documentElement.requestFullscreen?.().catch(()=>{})
    document.addEventListener('click', goFS, { once:true })
    return () => document.removeEventListener('click', goFS)
  }, [])

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    api.get(`/restaurants/borne/${token}`)
      .then(async ({ data, error }) => {
        if (error || !data) { setState('invalid'); return }
        // Vérifier si le badgeage est activé pour ce gérant
        const gerantArr = await api.get(`/gerants/trial-by-restaurant/${data.id}`)
        const gerant = gerantArr ? [gerantArr] : []
        if(gerantErr || !gerant || gerant.length === 0) { setState('invalid'); return }
        const features = gerant[0]?.features || {}
        if(features.badgeage === false) { setState('invalid'); return }
        setRestaurant(data)
        setTentatives(data.borne_tentatives || 0)
        setBloqueJusqua(data.borne_bloquee_jusqu_a)
        setState(data.borne_verrouillee ? 'locked' : 'pin')
      })
  }, [token])

  const checkPin = async (pin) => {
    setPinError('')
    const data = await api.get(`/restaurants/borne/${token}`)
    if(!data) return

    if (data.borne_bloquee_jusqu_a && new Date(data.borne_bloquee_jusqu_a) > new Date()) {
      setBloqueJusqua(data.borne_bloquee_jusqu_a); return
    }

    if (pin === data.pin_borne) {
      await api.put(`/restaurants/borne-token/${token}`, { borne_tentatives:0, borne_bloquee_jusqu_a:null })
      setState('active')
    } else {
      const nouv = (data.borne_tentatives || 0) + 1
      const upd = { borne_tentatives: nouv }
      if (nouv >= 10) { upd.borne_verrouillee = true; setState('locked') }
      else if (nouv % 3 === 0) {
        const bloc = new Date(Date.now() + 5*60*1000).toISOString()
        upd.borne_bloquee_jusqu_a = bloc
        setBloqueJusqua(bloc)
        setPinError('Trop de tentatives — bloquée 5 min')
      } else {
        setPinError(`PIN incorrect — ${3-(nouv%3)} tentative${3-(nouv%3)>1?'s':''} restante${3-(nouv%3)>1?'s':''}`)
      }
      await api.put(`/restaurants/borne-token/${token}`, upd)
      setTentatives(nouv)
    }
  }

  const fmt = d => d.toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  const fmtDate = d => d.toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long'})

  // Écouter les nouveaux pointages pour le flash
  useEffect(() => {
    if (state !== 'active' || !restaurant) return
    socket.connect()
    socket.emit('join-restaurant', restaurant.id)
    socket.on('pointage', async (data) => {
      const emp = await api.get(`/employes/one/${data.employe_id}`)
      if (emp) {
        const type = data.heure_depart ? 'depart' : 'entree'
        const heure = (data.heure_depart || data.heure_arrivee)?.slice(0,5)
        setLastBadge({ nom:`${emp.prenom} ${emp.nom}`, type, heure })
        setTimeout(() => setLastBadge(null), 4000)
      }
    })
    return () => { socket.off('pointage'); socket.disconnect() }
  }, [state, restaurant])

  const LOGO = (
    <svg width="36" height="36" viewBox="0 0 34 34" fill="none">
      <rect width="34" height="34" rx="9" fill="#E11D48"/>
      <path d="M10 9v16M10 17l7-8M10 17l8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="17" r="2.5" fill="white"/>
    </svg>
  )

  if (state==='loading') return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc',fontFamily:'var(--font)'}}>
      <div style={{textAlign:'center',color:'#aaa',fontSize:14}}>Chargement...</div>
    </div>
  )

  if (state==='invalid') return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fef2f2',fontFamily:'var(--font)'}}>
      <div style={{textAlign:'center',padding:32}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <div style={{fontSize:20,fontWeight:700,color:'#dc2626',marginBottom:8}}>Lien invalide</div>
        <div style={{fontSize:14,color:'#666'}}>Ce lien n'existe pas ou a expiré.<br/>Contactez votre gérant.</div>
      </div>
    </div>
  )

  if (state==='locked') return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#111',fontFamily:'var(--font)'}}>
      <div style={{textAlign:'center',padding:32}}>
        <div style={{fontSize:64,marginBottom:20}}>🔐</div>
        <div style={{fontSize:22,fontWeight:800,color:'white',marginBottom:10}}>Borne verrouillée</div>
        <div style={{fontSize:14,color:'rgba(255,255,255,.5)',lineHeight:1.7}}>Trop de tentatives échouées.<br/>Contactez votre gérant pour déverrouiller.</div>
      </div>
    </div>
  )

  if (state==='pin') return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'white',fontFamily:'var(--font)',userSelect:'none'}}>
      <div style={{textAlign:'center',marginBottom:32}}>
        {LOGO}
        <div style={{fontSize:24,fontWeight:800,color:'#111',letterSpacing:'-.03em',marginTop:10}}>Varman</div>
        {restaurant && <div style={{fontSize:14,color:'#888',marginTop:4}}>{restaurant.nom}</div>}
        <div style={{fontSize:13,color:'#bbb',marginTop:10}}>Entrez le code PIN</div>
      </div>
      <PINKeypad onSubmit={checkPin} error={pinError} tentatives={tentatives} bloqueJusqua={bloqueJusqua}/>
    </div>
  )

  // ── ACTIVE ─────────────────────────────────────────────────────────
  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'white',fontFamily:'var(--font)',userSelect:'none',overflow:'hidden'}}>

      {/* Header */}
      <div style={{background:'#111',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {LOGO}
          <div>
            <div style={{fontSize:14,fontWeight:700,color:'white'}}>Varman · {restaurant?.nom}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:1,textTransform:'capitalize'}}>{fmtDate(heure)}</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:32,fontWeight:900,color:'white',letterSpacing:'-.04em',lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{fmt(heure)}</div>
          <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end',marginTop:3}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',display:'inline-block',boxShadow:'0 0 0 2px rgba(34,197,94,.25)'}}></span>
            <span style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>Borne active</span>
          </div>
        </div>
      </div>

      {/* Corps — centré */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:28}}>

        {/* Flash badge — affiché 4 secondes puis disparaît */}
        {lastBadge ? (
          <div style={{
            background:lastBadge.type==='entree'?'#f0fdf4':'#fff7ed',
            border:`2px solid ${lastBadge.type==='entree'?'#22c55e':'#f97316'}`,
            borderRadius:20,padding:'28px 40px',textAlign:'center',
            animation:'fadeIn .4s cubic-bezier(.16,1,.3,1)',
            boxShadow:lastBadge.type==='entree'?'0 8px 32px rgba(34,197,94,.15)':'0 8px 32px rgba(249,115,22,.15)'
          }}>
            <div style={{fontSize:52,marginBottom:8}}>{lastBadge.type==='entree'?'✅':'👋'}</div>
            <div style={{fontSize:22,fontWeight:800,color:'#111',marginBottom:4}}>Bonjour, {lastBadge.nom.split(' ')[0]} !</div>
            <div style={{fontSize:15,color:lastBadge.type==='entree'?'#16a34a':'#ea580c',fontWeight:600}}>
              {lastBadge.type==='entree'?'Arrivée enregistrée':'Départ enregistré'}
            </div>
          </div>
        ) : (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:16,fontWeight:600,color:'#555',marginBottom:20}}>
              Scannez pour badger
            </div>
            {restaurant && <RealQR restoId={restaurant.id} secret={restaurant.qr_secret}/>}
            <div style={{fontSize:13,color:'#bbb',marginTop:16,lineHeight:1.7}}>
              Ouvrez l'app Varman sur votre téléphone<br/>et scannez ce QR code
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{background:'#fafafa',borderTop:'1px solid #f0f0f0',padding:'10px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{fontSize:11,color:'#ccc'}}>Varman by SwitzerIT · 🇨🇭</div>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>
          <span style={{fontSize:11,color:'#bbb'}}>QR sécurisé · renouvelé toutes les 30s</span>
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}
