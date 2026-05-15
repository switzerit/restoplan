import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useSearchParams } from 'react-router-dom'

// ── Wake Lock — empêche la tablette de se mettre en veille ────────────
function useWakeLock() {
  const wakeLockRef = useRef(null)
  const acquire = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        console.log('Wake Lock actif')
      }
    } catch(e) { console.warn('Wake Lock non disponible:', e) }
  }, [])
  useEffect(() => {
    acquire()
    const reacquire = () => { if(document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', reacquire)
    return () => {
      document.removeEventListener('visibilitychange', reacquire)
      wakeLockRef.current?.release()
    }
  }, [acquire])
}

// ── QR animé ─────────────────────────────────────────────────────────
function QRDisplay({ size = 160 }) {
  const [seed, setSeed] = useState(0)
  const [prog, setProg] = useState(0)
  const [fade, setFade] = useState(false)
  useEffect(() => {
    let p = 0
    const iv = setInterval(() => {
      p += 100 / 300
      if (p >= 100) { setFade(true); setTimeout(() => { setSeed(s => s + 1); setProg(0); setFade(false); p = 0 }, 300) }
      else setProg(p)
    }, 100)
    return () => clearInterval(iv)
  }, [])
  const rng = (x, y, s) => ((x * 7 + y * 13 + s * 31) % 17 > 7)
  const sz = 15, cs = 6, tot = sz * cs + (sz - 1)
  const cells = []
  for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) cells.push({ r, c, v: rng(r, c, seed) })
  const isFixed = (r, c) => (r < 4 && c < 4) || (r < 4 && c >= sz - 4) || (r >= sz - 4 && c < 4)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 12, opacity: fade ? .1 : 1, transition: fade ? 'opacity .25s' : 'none', boxShadow: '0 4px 24px rgba(0,0,0,.08)', border: '1px solid #e8e8e8' }}>
        <svg width={tot} height={tot} viewBox={`0 0 ${tot} ${tot}`}>
          {cells.map(({ r, c, v }) => {
            const x = c * (cs + 1), y = r * (cs + 1)
            const fill = isFixed(r, c) ? (r === 0 || r === 3 || c === 0 || c === 3 || (r >= sz - 4 && (c === 0 || c === 3)) ? '#111' : 'white') : (v ? '#111' : 'white')
            return <rect key={`${r}-${c}`} x={x} y={y} width={cs} height={cs} rx={0.5} fill={fill} />
          })}
        </svg>
      </div>
      <div style={{ width: size * 0.85 }}>
        <div style={{ height: 3, background: '#e8e8e8', borderRadius: 2 }}>
          <div style={{ height: '100%', background: '#0066cc', borderRadius: 2, width: `${prog}%`, transition: 'width .1s linear' }} />
        </div>
        <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 4, fontWeight: 500 }}>
          Renouvellement dans {Math.ceil(30 - (prog * 30 / 100))}s
        </div>
      </div>
    </div>
  )
}

// ── Clavier PIN ───────────────────────────────────────────────────────
function PINKeypad({ onSubmit, loading, error, tentatives, bloqueJusqua }) {
  const [pin, setPin] = useState('')
  const MAX = 4

  const handleKey = (k) => {
    if (pin.length < MAX) {
      const newPin = pin + k
      setPin(newPin)
      if (newPin.length === MAX) {
        setTimeout(() => { onSubmit(newPin); setPin('') }, 200)
      }
    }
  }
  const handleDel = () => setPin(p => p.slice(0, -1))

  // Blocage temporaire
  const [countdown, setCountdown] = useState(0)
  useEffect(() => {
    if (!bloqueJusqua) return
    const update = () => {
      const diff = Math.ceil((new Date(bloqueJusqua) - new Date()) / 1000)
      setCountdown(Math.max(0, diff))
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [bloqueJusqua])

  const isBlocked = countdown > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* Points PIN */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {Array.from({ length: MAX }).map((_, i) => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: '50%',
            background: i < pin.length ? '#0066cc' : 'transparent',
            border: `2px solid ${i < pin.length ? '#0066cc' : '#d0d0d0'}`,
            transition: 'all .15s'
          }} />
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 20px', fontSize: 13, color: '#dc2626', textAlign: 'center', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Blocage */}
      {isBlocked && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 20px', fontSize: 13, color: '#ea580c', textAlign: 'center', fontWeight: 500 }}>
          ⏱ Trop de tentatives — réessayez dans {countdown}s
        </div>
      )}

      {/* Clavier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, opacity: isBlocked ? .4 : 1, pointerEvents: isBlocked ? 'none' : 'auto' }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => {
          if (k === '') return <div key={i} />
          return (
            <button key={i}
              onClick={() => k === '⌫' ? handleDel() : handleKey(String(k))}
              style={{
                width: 72, height: 72, borderRadius: 16,
                border: '1.5px solid #e8e8e8',
                background: k === '⌫' ? '#f8fafc' : 'white',
                fontSize: k === '⌫' ? 20 : 26,
                fontWeight: k === '⌫' ? 400 : 700,
                color: '#111',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,.05)',
                transition: 'transform .1s, box-shadow .1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(.94)'; e.currentTarget.style.boxShadow = 'none' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)' }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(.94)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {k}
            </button>
          )
        })}
      </div>

      {tentatives > 0 && !isBlocked && (
        <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
          {tentatives} tentative{tentatives > 1 ? 's' : ''} échouée{tentatives > 1 ? 's' : ''} · {3 - (tentatives % 3)} restante{3 - (tentatives % 3) > 1 ? 's' : ''} avant blocage
        </div>
      )}
    </div>
  )
}

// ══ PAGE BORNE ════════════════════════════════════════════════════════
export default function Borne() {
  useWakeLock()
  const [params] = useSearchParams()
  const token = params.get('token')

  const [state, setState] = useState('loading') // loading | pin | active | locked | invalid
  const [restaurant, setRestaurant] = useState(null)
  const [error, setError] = useState('')
  const [tentatives, setTentatives] = useState(0)
  const [bloqueJusqua, setBloqueJusqua] = useState(null)
  const [heure, setHeure] = useState(new Date())
  const [lastBadge, setLastBadge] = useState(null)
  const [scanLoading, setScanLoading] = useState(false)

  // Horloge
  useEffect(() => {
    const iv = setInterval(() => setHeure(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Plein écran auto
  useEffect(() => {
    const goFS = () => {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {})
    }
    document.addEventListener('click', goFS, { once: true })
    return () => document.removeEventListener('click', goFS)
  }, [])

  // Vérifier le token
  useEffect(() => {
    if (!token) { setState('invalid'); return }
    supabase.from('restaurants').select('id,nom,secteur,borne_verrouillee,borne_tentatives,borne_bloquee_jusqu_a')
      .eq('borne_token', token).single()
      .then(({ data, error }) => {
        if (error || !data) { setState('invalid'); return }
        setRestaurant(data)
        setTentatives(data.borne_tentatives || 0)
        setBloqueJusqua(data.borne_bloquee_jusqu_a)
        if (data.borne_verrouillee) setState('locked')
        else setState('pin')
      })
  }, [token])

  // Vérifier le PIN
  const checkPin = async (pin) => {
    setError('')
    const { data } = await supabase.from('restaurants').select('pin_borne,borne_tentatives,borne_bloquee_jusqu_a,borne_verrouillee').eq('borne_token', token).single()
    if (!data) return

    // Vérifie si bloqué
    if (data.borne_bloquee_jusqu_a && new Date(data.borne_bloquee_jusqu_a) > new Date()) {
      setBloqueJusqua(data.borne_bloquee_jusqu_a)
      return
    }

    if (pin === data.pin_borne) {
      // PIN correct — reset tentatives
      await supabase.from('restaurants').update({ borne_tentatives: 0, borne_bloquee_jusqu_a: null }).eq('borne_token', token)
      setState('active')
    } else {
      // PIN incorrect
      const nouvellesTentatives = (data.borne_tentatives || 0) + 1
      const updates = { borne_tentatives: nouvellesTentatives }

      if (nouvellesTentatives % 3 === 0 && nouvellesTentatives < 10) {
        // Bloquer 5 minutes
        const blocage = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        updates.borne_bloquee_jusqu_a = blocage
        setBloqueJusqua(blocage)
        setError('Trop de tentatives — borne bloquée 5 minutes')
      } else if (nouvellesTentatives >= 10) {
        // Verrouiller définitivement
        updates.borne_verrouillee = true
        setState('locked')
      } else {
        setError(`PIN incorrect (${3 - (nouvellesTentatives % 3)} tentative${3 - (nouvellesTentatives % 3) > 1 ? 's' : ''} restante${3 - (nouvellesTentatives % 3) > 1 ? 's' : ''})`)
      }

      await supabase.from('restaurants').update(updates).eq('borne_token', token)
      setTentatives(nouvellesTentatives)
    }
  }

  const fmt = (d) => d.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const fmtDate = (d) => d.toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })

  // ── ÉTAT: LOADING ─────────────────────────────────────────────────
  if (state === 'loading') return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'var(--font)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 15, color: '#888' }}>Chargement de la borne...</div>
      </div>
    </div>
  )

  // ── ÉTAT: INVALID ─────────────────────────────────────────────────
  if (state === 'invalid') return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', fontFamily: 'var(--font)' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Lien invalide</div>
        <div style={{ fontSize: 14, color: '#666' }}>Ce lien de borne n'existe pas ou a expiré.<br />Contactez votre gérant.</div>
      </div>
    </div>
  )

  // ── ÉTAT: LOCKED ──────────────────────────────────────────────────
  if (state === 'locked') return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', fontFamily: 'var(--font)' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔐</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10 }}>Borne verrouillée</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>
          Trop de tentatives échouées.<br />
          Contactez votre gérant pour déverrouiller.
        </div>
      </div>
    </div>
  )

  // ── ÉTAT: PIN ─────────────────────────────────────────────────────
  if (state === 'pin') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', fontFamily: 'var(--font)', userSelect: 'none' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <svg width="44" height="44" viewBox="0 0 34 34" fill="none" style={{ marginBottom: 12 }}>
          <rect width="34" height="34" rx="9" fill="#0066cc"/>
          <path d="M10 9v16M10 17l7-8M10 17l8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="24" cy="17" r="2.5" fill="white"/>
        </svg>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-.03em' }}>Kronvo</div>
        {restaurant && <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{restaurant.nom}</div>}
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 12 }}>Entrez le code PIN de la borne</div>
      </div>
      <PINKeypad
        onSubmit={checkPin}
        error={error}
        tentatives={tentatives}
        bloqueJusqua={bloqueJusqua}
      />
    </div>
  )

  // ── ÉTAT: ACTIVE — borne opérationnelle ───────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'var(--font)', userSelect: 'none', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: '#111', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="9" fill="#0066cc"/>
            <path d="M10 9v16M10 17l7-8M10 17l8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="24" cy="17" r="2.5" fill="white"/>
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Kronvo · {restaurant?.nom}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 1, textTransform: 'capitalize' }}>{fmtDate(heure)}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fmt(heure)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Borne active</span>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>

        {/* Message dernier badge */}
        {lastBadge && (
          <div style={{
            background: lastBadge.type === 'entree' ? '#f0fdf4' : '#fff7ed',
            border: `1px solid ${lastBadge.type === 'entree' ? '#bbf7d0' : '#fed7aa'}`,
            borderRadius: 16, padding: '16px 28px', textAlign: 'center',
            animation: 'fadeIn .3s ease'
          }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>{lastBadge.type === 'entree' ? '✅' : '👋'}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 2 }}>{lastBadge.nom}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{lastBadge.type === 'entree' ? 'Arrivée enregistrée' : 'Départ enregistré'} · {lastBadge.heure}</div>
          </div>
        )}

        {/* QR Code */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 16 }}>
            Scannez pour badger
          </div>
          <QRDisplay size={160} />
        </div>

        {/* Instruction */}
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>
            Ouvrez l'app Kronvo sur votre téléphone<br />et scannez ce QR code
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ background: 'white', borderTop: '1px solid #f0f0f0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: '#aaa' }}>Kronvo by SwitzerIT · 🇨🇭</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
          <span style={{ fontSize: 11, color: '#888' }}>QR sécurisé · renouvelé auto</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
      `}</style>
    </div>
  )
}
