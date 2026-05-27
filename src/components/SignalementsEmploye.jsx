import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = {
  oubli_arrivee: { l: "Oubli d'arrivée", icon: '🕐' },
  oubli_depart: { l: "Oubli de départ", icon: '🕐' },
  heure_incorrecte: { l: "Heure incorrecte", icon: '✏️' },
  autre: { l: "Autre problème", icon: '❓' }
}

export default function SignalementsEmploye({ employe }) {
  const [signalements, setSignalements] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'oubli_depart', heure_souhaitee: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { if (employe) load() }, [employe?.id])

  async function load() {
    const { data } = await supabase.from('signalements').select('*')
      .eq('employe_id', employe.id).order('created_at', { ascending: false })
    setSignalements(data || [])
  }

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  async function soumettre() {
    if (!form.date) { showToast('Choisis une date'); return }
    setLoading(true)
    const { error } = await supabase.from('signalements').insert({
      employe_id: employe.id, restaurant_id: employe.restaurant_id,
      date: form.date, type: form.type,
      heure_souhaitee: form.heure_souhaitee || null,
      message: form.message || null
    })
    setLoading(false)
    if (error) { showToast('Erreur: ' + error.message); return }
    showToast('✅ Signalement envoyé !')
    setModal(false)
    setForm({ date: new Date().toISOString().split('T')[0], type: 'oubli_depart', heure_souhaitee: '', message: '' })
    load()
  }

  const enAttente = signalements.filter(s => s.statut === 'en_attente').length

  const statutStyle = (statut) => ({
    en_attente: { bg: '#fff7ed', c: '#ea580c', bc: '#fed7aa', l: '⏳ En attente' },
    traite: { bg: '#f0fdf4', c: '#16a34a', bc: '#bbf7d0', l: '✅ Traité' },
    rejete: { bg: '#fef2f2', c: '#dc2626', bc: '#fecaca', l: '❌ Rejeté' }
  })[statut]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>🔔 Signalements</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Signalez une erreur de pointage</div>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: '#0066cc', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          + Signaler
        </button>
      </div>

      {/* Liste */}
      {signalements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Aucun signalement</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Tout est correct !</div>
        </div>
      ) : signalements.map(s => {
        const t = TYPES[s.type] || TYPES.autre
        const st = statutStyle(s.statut)
        return (
          <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 16, border: `1px solid ${s.statut === 'en_attente' ? '#fed7aa' : 'var(--border)'}`, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.l}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {s.heure_souhaitee && <span style={{ fontWeight: 600 }}> · {s.heure_souhaitee}</span>}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: st.bg, color: st.c, border: `1px solid ${st.bc}`, flexShrink: 0 }}>{st.l}</span>
            </div>
            {s.message && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)', fontSize: 12, color: 'var(--text2)', fontStyle: 'italic' }}>"{s.message}"</div>
            )}
            {s.commentaire_gerant && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #d0e8ff', background: '#f0f7ff', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>💬</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#0066cc', marginBottom: 2 }}>RÉPONSE DU RESPONSABLE</div>
                  <div style={{ fontSize: 13, color: '#0066cc', fontWeight: 500 }}>{s.commentaire_gerant}</div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Modal */}
      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)', zIndex: 199 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', borderRadius: 20, padding: '20px 16px', zIndex: 200, width: 'min(92vw, 440px)', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>🔔 Signaler une erreur</div>

            {/* Date */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, letterSpacing: '.05em' }}>DATE CONCERNÉE</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
            </div>

            {/* Type */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, letterSpacing: '.05em' }}>TYPE DE PROBLÈME</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(TYPES).map(([k, v]) => (
                  <div key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                    style={{ padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${form.type === k ? '#0066cc' : 'var(--border)'}`, background: form.type === k ? '#f0f7ff' : 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s' }}>
                    <span style={{ fontSize: 16 }}>{v.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: form.type === k ? 700 : 500, color: form.type === k ? '#0066cc' : 'var(--text)', flex: 1 }}>{v.l}</span>
                    {form.type === k && <span style={{ color: '#0066cc', fontSize: 15 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Heure */}
            {form.type !== 'autre' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, letterSpacing: '.05em' }}>HEURE CORRECTE</label>
                <input type="time" value={form.heure_souhaitee} onChange={e => setForm(f => ({ ...f, heure_souhaitee: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
              </div>
            )}

            {/* Message */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, letterSpacing: '.05em' }}>MESSAGE (optionnel)</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Donnez plus de détails..."
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 14, color: 'var(--text)', outline: 'none', resize: 'none', height: 90 }} />
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, height: 44, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={soumettre} disabled={loading}
                style={{ flex: 2, height: 44, borderRadius: 12, border: 'none', background: loading ? '#ccc' : '#0066cc', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#111', color: 'white', padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600, zIndex: 300, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  )
}
