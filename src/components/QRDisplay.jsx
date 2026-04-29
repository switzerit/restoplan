import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { generateToken, secondsLeft } from '../lib/qrToken'

export default function QRDisplay({ restaurant }) {
  const canvasRef = useRef(null)
  const [token, setToken] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)

  useEffect(() => {
    updateQR()
    const interval = setInterval(() => {
      const secs = secondsLeft()
      setTimeLeft(secs)
      if (secs === 30) updateQR()
    }, 1000)
    return () => clearInterval(interval)
  }, [restaurant])

  function updateQR() {
    if (!restaurant) return
    const t = generateToken(restaurant.id, restaurant.qr_secret || 'restoplan')
    setToken(t)
    const data = JSON.stringify({ token: t, restoId: restaurant.id, secret: restaurant.qr_secret })
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: 180,
        margin: 2,
        color: { dark: '#1d1d1f', light: '#ffffff' }
      })
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Scanner pour badger
      </div>
      <div style={{ background: 'white', borderRadius: 12, padding: 12, display: 'inline-block', boxShadow: '0 2px 12px rgba(0,0,0,.1)' }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: timeLeft <= 5 ? 'var(--red-bg)' : 'var(--green-bg)',
          color: timeLeft <= 5 ? 'var(--red)' : 'var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800
        }}>{timeLeft}</div>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>secondes restantes</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
        Code : {token}
      </div>
    </div>
  )
}
