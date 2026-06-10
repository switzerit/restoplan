import { useState, useEffect } from 'react'
import socket from '../socketClient'
import { api } from '../apiClient'

export default function Notifications({ employe }) {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!employe) return
    loadNotifs()
    socket.connect()
    socket.on('notification', loadNotifs)
    return () => { socket.off('notification'); socket.disconnect() }
  }, [employe?.id])

  async function loadNotifs() {
    const data = await api.get(`/notifications?employe_id=${employe.id}&limit=30`)
    setNotifs(data || [])
  }

  async function marquerLu(id) {
    await api.put(`/notifications/${id}`, { lu: true, lu_at: new Date().toISOString() })
    loadNotifs()
  }

  async function supprimerNotif(id) {
    await api.delete(`/notifications/${id}`)
    loadNotifs()
  }

  async function toutSupprimer() {
    await api.delete(`/notifications/employe/${employe.id}`)
    loadNotifs()
  }

  async function ouvrirPanel() {
    setOpen(true)
    // Marquer toutes comme lues à l'ouverture
    const nonLues = notifs.filter(n => !n.lu).map(n => n.id)
    if (nonLues.length > 0) {
      await api.post('/notifications/mark-all-lu', { ids: nonLues })
      loadNotifs()
    }
  }

  function fmtTime(d) {
    const dt = new Date(d), now = new Date()
    const diff = Math.floor((now - dt) / 60000)
    if (diff < 1) return "À l'instant"
    if (diff < 60) return `Il y a ${diff} min`
    if (diff < 1440) return `Il y a ${Math.floor(diff/60)}h`
    if (diff < 2880) return 'Hier'
    return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  function getIcon(titre) {
    if (titre?.includes('supprimé')) return { icon: '🗑️', bg: '#fef2f2' }
    if (titre?.includes('modifié') || titre?.includes('jour')) return { icon: '✏️', bg: '#fff7ed' }
    if (titre?.includes('Nouveau') || titre?.includes('planifié')) return { icon: '✅', bg: '#f0fdf4' }
    if (titre?.includes('Congé') || titre?.includes('congé')) return { icon: '🏖️', bg: '#faf5ff' }
    return { icon: '🔔', bg: '#fff1f3' }
  }

  const nonLues = notifs.filter(n => !n.lu).length

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={ouvrirPanel}
        style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: nonLues > 0 ? '#fff7ed' : 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
        🔔
        {nonLues > 0 && (
          <div style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', padding: '0 3px' }}>
            {nonLues > 9 ? '9+' : nonLues}
          </div>
        )}
      </button>

      {open && <>
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)' }} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 400, background: 'var(--surface)', boxShadow: '-4px 0 32px rgba(0,0,0,.15)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Notifications</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                {notifs.length === 0 ? 'Aucune notification' : `${notifs.length} notification${notifs.length > 1 ? 's' : ''}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {notifs.length > 0 && (
                <button onClick={toutSupprimer} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Tout effacer
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🔔</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Tout est à jour</div>
                <div style={{ fontSize: 13 }}>Vous serez notifié des changements de planning</div>
              </div>
            ) : notifs.map(n => {
              const { icon, bg } = getIcon(n.titre)
              return (
                <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: n.lu ? 'transparent' : 'rgba(0,102,204,.03)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: n.lu ? 600 : 800, color: 'var(--text)', flex: 1 }}>{n.titre}</span>
                      {!n.lu && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E11D48', flexShrink: 0, display: 'inline-block' }} />}
                    </div>
                    {n.message && <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 5 }}>{n.message}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtTime(n.created_at)}</span>
                      <button onClick={() => supprimerNotif(n.id)}
                        style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </>}
    </div>
  )
}
