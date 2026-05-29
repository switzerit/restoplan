import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fmtTime(d) {
  const dt = new Date(d), now = new Date()
  const diff = Math.floor((now - dt) / 60000)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `Il y a ${diff}min`
  if (diff < 1440) return `Il y a ${Math.floor(diff/60)}h`
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getIcon(titre) {
  if (titre?.includes('supprimé')) return '🗑️'
  if (titre?.includes('modifié') || titre?.includes('jour')) return '✏️'
  if (titre?.includes('Nouveau') || titre?.includes('planifié')) return '✅'
  return '🔔'
}

export default function NotifsGerant({ restaurant, employes }) {
  const [notifs, setNotifs] = useState([])
  const [filtre, setFiltre] = useState('all') // all | nonlu | lu

  useEffect(() => {
    if (!restaurant) return
    loadNotifs()
    const ch = supabase.channel('notifs-gerant')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `restaurant_id=eq.${restaurant.id}` }, loadNotifs)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [restaurant?.id])

  async function loadNotifs() {
    const { data } = await supabase.from('notifications')
      .select('*, employes(prenom, nom, role)')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifs(data || [])
  }

  const filtered = notifs.filter(n =>
    filtre === 'all' ? true : filtre === 'nonlu' ? !n.lu : n.lu
  )

  const nonLuCount = notifs.filter(n => !n.lu).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { n: notifs.length, l: 'Envoyées', c: '#E11D48', bg: '#fff1f3', bc: '#fecdd3' },
          { n: nonLuCount, l: 'Non lues', c: '#ea580c', bg: '#fff7ed', bc: '#fed7aa' },
          { n: notifs.length - nonLuCount, l: 'Lues ✓', c: '#16a34a', bg: '#f0fdf4', bc: '#bbf7d0' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.n}</div>
            <div style={{ fontSize: 11, color: s.c, marginTop: 2, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 3, gap: 3 }}>
        {[['all', 'Toutes'], ['nonlu', 'Non lues'], ['lu', 'Lues']].map(([id, l]) => (
          <button key={id} onClick={() => setFiltre(id)}
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: filtre === id ? 'var(--surface)' : 'transparent', color: filtre === id ? 'var(--text)' : 'var(--text2)', fontSize: 12, fontWeight: filtre === id ? 700 : 500, cursor: 'pointer', boxShadow: filtre === id ? '0 1px 4px rgba(0,0,0,.06)' : 'none' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 13 }}>Aucune notification</div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.map((n, i) => (
            <div key={n.id} style={{ padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{getIcon(n.titre)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{n.employes?.prenom} {n.employes?.nom}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{n.employes?.role}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: n.lu ? '#f0fdf4' : '#fff7ed', color: n.lu ? '#16a34a' : '#ea580c', border: `1px solid ${n.lu ? '#bbf7d0' : '#fed7aa'}` }}>
                    {n.lu ? `✓ Lu ${n.lu_at ? fmtTime(n.lu_at) : ''}` : '⏳ Pas encore lu'}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{n.titre}</div>
                {n.message && <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{n.message}</div>}
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{fmtTime(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
