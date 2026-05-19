import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Notifications({ employe }) {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!employe) return
    loadNotifs()
    const ch = supabase.channel('notifs-employe')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `employe_id=eq.${employe.id}` }, () => loadNotifs())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [employe?.id])

  async function loadNotifs() {
    const { data } = await supabase.from('notifications')
      .select('*')
      .eq('employe_id', employe.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs(data || [])
  }

  async function marquerLu(id) {
    await supabase.from('notifications').update({ lu: true, lu_at: new Date().toISOString() }).eq('id', id)
    loadNotifs()
  }

  async function toutMarquerLu() {
    const ids = notifs.filter(n => !n.lu).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ lu: true, lu_at: new Date().toISOString() }).in('id', ids)
    loadNotifs()
  }

  const nonLues = notifs.filter(n => !n.lu).length

  function fmtTime(d) {
    const dt = new Date(d)
    const now = new Date()
    const diff = Math.floor((now - dt) / 60000)
    if (diff < 1) return "À l'instant"
    if (diff < 60) return `Il y a ${diff} min`
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
    return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); if (!open && nonLues > 0) toutMarquerLu() }}
        style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: nonLues > 0 ? 'var(--accent-bg)' : 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        🔔
        {nonLues > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
            {nonLues > 9 ? '9+' : nonLues}
          </div>
        )}
      </button>

      {open && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 380, background: 'var(--surface)', boxShadow: '-4px 0 24px rgba(0,0,0,.12)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>🔔 Notifications</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Tout est à jour'}</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucune notification</div>
                <div style={{ fontSize: 12 }}>Vous serez notifié des changements de planning</div>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} onClick={() => !n.lu && marquerLu(n.id)}
                style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: n.lu ? 'transparent' : 'var(--accent-bg)', cursor: n.lu ? 'default' : 'pointer', transition: 'background .15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.lu ? 'var(--bg)' : '#e8f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {n.type === 'planning' ? '📅' : n.type === 'conge' ? '🏖️' : '💬'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: n.lu ? 600 : 800, color: 'var(--text)' }}>{n.titre}</span>
                      {!n.lu && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0066cc', flexShrink: 0, display: 'inline-block' }} />}
                    </div>
                    {n.message && <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 4 }}>{n.message}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtTime(n.created_at)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifs.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <button onClick={toutMarquerLu} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ✓ Tout marquer comme lu
              </button>
            </div>
          )}
        </div>
      )}

      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />}
    </div>
  )
}
