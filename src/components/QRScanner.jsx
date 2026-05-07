import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { verifyToken } from '../lib/qrToken'
import { supabase } from '../lib/supabase'

export default function QRScanner({ employe, onSuccess, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    startScanner()
    return () => stopScanner()
  }, [])

  async function startScanner() {
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner()
          await handleScan(decodedText)
        },
        () => {}
      )
    } catch (err) {
      setError('Impossible d\'acceder a la camera — ' + err.message)
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
  }

  async function handleScan(data) {
    try {
      const { token, restoId, secret } = JSON.parse(data)
      if (!verifyToken(token, restoId, secret)) {
        setError('QR code expire — reessayez')
        setTimeout(() => startScanner(), 2000)
        return
      }
      if (employe.restaurant_id !== restoId) {
        setError('Ce QR code est pour un autre restaurant !')
        setTimeout(() => startScanner(), 3000)
        return
      }
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0')

      // Chercher le dernier pointage du jour sans depart
      const { data: pointages } = await supabase
        .from('pointages')
        .select('*')
        .eq('employe_id', employe.id)
        .eq('date', today)
        .order('heure_arrivee', { ascending: false })

      const dernierOuvert = pointages?.find(p => p.heure_arrivee && !p.heure_depart)

      if (dernierOuvert) {
        // Enregistrer le depart
        await supabase.from('pointages').update({ heure_depart: timeStr }).eq('id', dernierOuvert.id)
        onSuccess('depart', timeStr)
      } else {
        // Nouvelle arrivee
        await supabase.from('pointages').insert({
          employe_id: employe.id,
          date: today,
          heure_arrivee: timeStr,
          restaurant_id: restoId
        })
        onSuccess('arrivee', timeStr)
      }
    } catch {
      setError('QR code invalide')
      setTimeout(() => startScanner(), 2000)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ color: 'white', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Scanner le QR de la borne</div>
      <div id="qr-reader" style={{ width: 300, borderRadius: 16, overflow: 'hidden' }}></div>
      {error && (
        <div style={{ marginTop: 16, padding: '10px 20px', background: 'rgba(255,59,48,.15)', color: '#ff6b6b', borderRadius: 10, fontSize: 13, fontWeight: 600, maxWidth: 280, textAlign: 'center' }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,.5)', textAlign: 'center', maxWidth: 280 }}>
        Pointez votre camera vers le QR code sur la tablette
      </div>
      <button onClick={onClose} style={{ marginTop: 20, padding: '12px 32px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.12)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        Annuler
      </button>
    </div>
  )
}
