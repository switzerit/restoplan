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
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [filtre, setFiltre] = useState('en_attente')

  useEffect(() => { if (restaurant) load() }, [restaurant?.id])

  async function load() {
    const { data } = await supabase.from('signalements')
      .select('*, employes(prenom,nom)')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
    setSignalements(data || [])
  }

  async function traiter(id, statut) {
    await supabase.from('signalements').update({ statut, commentaire_gerant: commentaire || null }).eq('id', id)
    setSelected(null); setCommentaire(''); load()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer ce signalement ?')) return
    await supabase.from('signalements').delete().eq('id', id)
    setSelected(null); load()
  }

  async function sauvegarderEdit() {
    await supabase.from('signalements').update({
      date: editForm.date,
      type: editForm.type,
      heure_souhaitee: editForm.heure_souhaitee || null,
      message: editForm.message || null,
      commentaire_gerant: editForm.commentaire_gerant || null
    }).eq('id', selected.id)
    setEditMode(false); setSelected(null); load()
  }

  async function supprimerTousTraites() {
    if (!confirm('Supprimer tous les signalements traités et rejetés ?')) return
    await supabase.from('signalements').delete()
      .eq('restaurant_id', restaurant.id)
      .in('statut', ['traite', 'rejete'])
    load()
  }

  const filtered = signalements.filter(s => filtre === 'tous' ? true : s.statut === filtre)
  const enAttente = signalements.filter(s => s.statut === 'en_attente').length
  const traites = signalements.filter(s => s.statut !== 'en_attente').length

  return (
    <div>
      {/* Tabs + action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 3, gap: 3, flex: 1 }}>
          {[['en_attente', `À traiter${enAttente > 0 ? ` (${enAttente})` : ''}`], ['traite', 'Traités'], ['tous', 'Tous']].map(([id, l]) => (
            <button key={id} onClick={() => setFiltre(id)}
              style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', background: filtre === id ? 'var(--surface)' : 'transparent', color: filtre === id ? (id === 'en_attente' && enAttente > 0 ? '#ea580c' : 'var(--text)') : 'var(--text2)', fontSize: 11, fontWeight: filtre === id ? 700 : 500, cursor: 'pointer' }}>
              {l}
            </button>
          ))}
        </div>
        {traites > 0 && (
          <button onClick={supprimerTousTraites}
            style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            🗑️ Vider
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 13 }}>{filtre === 'en_attente' ? 'Aucun signalement en attente' : 'Aucun signalement'}</div>
        </div>
      ) : filtered.map(s => {
        const emp = s.employes
        const statutStyle = {
          en_attente: { bg: '#fff7ed', c: '#ea580c', bc: '#fed7aa', l: '⏳ À traiter' },
          traite: { bg: '#f0fdf4', c: '#16a34a', bc: '#bbf7d0', l: '✅ Traité' },
          rejete: { bg: '#fef2f2', c: '#dc2626', bc: '#fecaca', l: '❌ Rejeté' }
        }[s.statut]
        return (
          <div key={s.id} onClick={() => { setSelected(s); setCommentaire(s.commentaire_gerant || ''); setEditMode(false); setEditForm({ date: s.date, type: s.type, heure_souhaitee: s.heure_souhaitee || '', message: s.message || '', commentaire_gerant: s.commentaire_gerant || '' }) }}
            style={{ background: 'var(--surface)', borderRadius: 14, border: `1px solid ${s.statut === 'en_attente' ? '#fed7aa' : 'var(--border)'}`, overflow: 'hidden', marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff1f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔔</div>
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

      {/* Modal */}
      {selected && (
        <div onClick={() => { setSelected(null); setEditMode(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, width: 400, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.15)' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>🔔 Signalement</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{selected.employes?.prenom} {selected.employes?.nom}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setEditMode(!editMode); setCommentaire(selected.commentaire_gerant||'') }}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: editMode ? '#E11D48' : 'var(--bg)', color: editMode ? 'white' : 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  ✏️ {editMode ? 'Annuler' : 'Modifier'}
                </button>
                <button onClick={() => supprimer(selected.id)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>

            {editMode ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>DATE</label>
                  <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>TYPE</label>
                  <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, outline: 'none' }}>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>HEURE CORRECTE</label>
                  <input type="time" value={editForm.heure_souhaitee} onChange={e => setEditForm(f => ({ ...f, heure_souhaitee: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>MESSAGE EMPLOYÉ</label>
                  <textarea value={editForm.message} onChange={e => setEditForm(f => ({ ...f, message: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, resize: 'none', height: 60, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>RÉPONSE GÉRANT</label>
                  <textarea value={editForm.commentaire_gerant} onChange={e => setEditForm(f => ({ ...f, commentaire_gerant: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, resize: 'none', height: 60, outline: 'none' }} />
                </div>
                <button onClick={sauvegarderEdit} style={{ width: '100%', height: 44, borderRadius: 11, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  ✅ Sauvegarder
                </button>
              </>
            ) : (
              <>
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{selected.employes?.prenom} {selected.employes?.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Type : {TYPES[selected.type]}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Date : {new Date(selected.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  {selected.heure_souhaitee && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Heure souhaitée : <strong>{selected.heure_souhaitee}</strong></div>}
                  {selected.message && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, fontStyle: 'italic' }}>"{selected.message}"</div>}
                </div>

                {selected.statut === 'en_attente' && (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>RÉPONSE (optionnel)</label>
                      <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Ex: Pointage corrigé à 17h00"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, resize: 'none', height: 70, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => traiter(selected.id, 'rejete')} style={{ flex: 1, height: 44, borderRadius: 11, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>❌ Rejeter</button>
                      <button onClick={() => traiter(selected.id, 'traite')} style={{ flex: 2, height: 44, borderRadius: 11, border: 'none', background: '#16a34a', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✅ Traité</button>
                    </div>
                  </>
                )}
                {selected.statut !== 'en_attente' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setSelected(null); setEditMode(false) }} style={{ flex: 1, height: 44, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
                    <button onClick={() => traiter(selected.id, 'en_attente')} style={{ flex: 1, height: 44, borderRadius: 11, border: '1px solid #fed7aa', background: '#fff7ed', color: '#ea580c', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>↩️ Rouvrir</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
