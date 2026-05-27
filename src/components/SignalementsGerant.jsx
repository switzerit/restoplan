import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = {
  oubli_arrivee: "Oubli d'arrivée",
  oubli_depart: "Oubli de départ",
  heure_incorrecte: "Heure incorrecte",
  autre: "Autre"
}

export default function SignalementsGerant({ restaurant, employes }) {
  const [signalements, setSignalements] = useState([])
  const [selected, setSelected] = useState(null)
  const [commentaire, setCommentaire] = useState('')
  const [filtre, setFiltre] = useState('en_attente')

  useEffect(() => { if (restaurant) load() }, [restaurant?.id])

  async function load() {
    const { data } = await supabase.from('signalements').select('*, employes(prenom,nom)')
      .eq('restaurant_id', restaurant.id).order('created_at', { ascending: false })
    setSignalements(data || [])
  }

  async function traiter(id, statut) {
    await supabase.from('signalements').update({ statut, commentaire_gerant: commentaire || null }).eq('id', id)
    setSelected(null)
    setCommentaire('')
    load()
  }

  const filtered = signalements.filter(s => filtre === 'tous' ? true : s.statut === filtre)
  const enAttente = signalements.filter(s => s.statut === 'en_attente').length

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 3, gap: 3, marginBottom: 16 }}>
        {[['en_attente', `En attente${enAttente > 0 ? ` (${enAttente})` : ''}`], ['traite', 'Traités'], ['tous', 'Tous']].map(([id, l]) => (
          <button key={id} onClick={() => setFiltre(id)}
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: filtre === id ? 'var(--surface)' : 'transparent', color: filtre === id ? (id === 'en_attente' && enAttente > 0 ? '#ea580c' : 'var(--text)') : 'var(--text2)', fontSize: 12, fontWeight: filtre === id ? 700 : 500, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 13 }}>Aucun signalement</div>
        </div>
      ) : filtered.map(s => {
        const emp = s.employes
        const statutStyle = {
          en_attente: { bg: '#fff7ed', c: '#ea580c', bc: '#fed7aa', l: '⏳ À traiter' },
          traite: { bg: '#f0fdf4', c: '#16a34a', bc: '#bbf7d0', l: '✅ Traité' },
          rejete: { bg: '#fef2f2', c: '#dc2626', bc: '#fecaca', l: '❌ Rejeté' }
        }[s.statut]
        return (
          <div key={s.id} onClick={() => { setSelected(s); setCommentaire(s.commentaire_gerant || '') }}
            style={{ background: 'var(--surface)', borderRadius: 14, border: `1px solid ${s.statut === 'en_attente' ? '#fed7aa' : 'var(--border)'}`, overflow: 'hidden', marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{emp?.prenom} {emp?.nom}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                  {TYPES[s.type]} · {new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  {s.heure_souhaitee && ` · ${s.heure_souhaitee}`}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: statutStyle.bg, color: statutStyle.c, border: `1px solid ${statutStyle.bc}`, flexShrink: 0 }}>{statutStyle.l}</span>
            </div>
            {s.message && <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)', fontSize: 12, color: 'var(--text2)' }}>"{s.message}"</div>}
          </div>
        )
      })}

      {/* Modal traitement */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, width: 380, boxShadow: '0 8px 40px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>🔔 Signalement</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              {selected.employes?.prenom} {selected.employes?.nom} · {TYPES[selected.type]}
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Date : {new Date(selected.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              {selected.heure_souhaitee && <div style={{ fontSize: 12, color: 'var(--text2)' }}>Heure souhaitée : <strong>{selected.heure_souhaitee}</strong></div>}
              {selected.message && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, fontStyle: 'italic' }}>"{selected.message}"</div>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>RÉPONSE (optionnel)</label>
              <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Ex: Pointage corrigé à 17h00"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, resize: 'none', height: 70, outline: 'none' }} />
            </div>

            {selected.statut === 'en_attente' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => traiter(selected.id, 'rejete')} style={{ flex: 1, height: 44, borderRadius: 11, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>❌ Rejeter</button>
                <button onClick={() => traiter(selected.id, 'traite')} style={{ flex: 2, height: 44, borderRadius: 11, border: 'none', background: '#16a34a', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✅ Marquer traité</button>
              </div>
            ) : (
              <button onClick={() => setSelected(null)} style={{ width: '100%', height: 44, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
