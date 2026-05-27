import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = {
  oubli_arrivee: { l: "Oubli de pointage d'arrivée", icon: '🕐' },
  oubli_depart: { l: "Oubli de pointage de départ", icon: '🕐' },
  heure_incorrecte: { l: "Heure incorrecte enregistrée", icon: '✏️' },
  autre: { l: "Autre problème", icon: '❓' }
}

export default function SignalementsEmploye({ employe }) {
  const [signalements, setSignalements] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date: '', type: 'oubli_depart', heure_souhaitee: '', message: '' })
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
    if (!form.date || !form.type) { showToast('Remplis la date et le type'); return }
    setLoading(true)
    const { error } = await supabase.from('signalements').insert({
      employe_id: employe.id,
      restaurant_id: employe.restaurant_id,
      date: form.date,
      type: form.type,
      heure_souhaitee: form.heure_souhaitee || null,
      message: form.message || null
    })
    setLoading(false)
    if (error) { showToast('Erreur: ' + error.message); return }
    showToast('✅ Signalement envoyé')
    setModal(false)
    setForm({ date: '', type: 'oubli_depart', heure_souhaitee: '', message: '' })
    load()
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Signalements</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Signalez une erreur de pointage</div>
        </div>
        <button onClick={() => setModal(true)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#0066cc', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Signaler</button>
      </div>

      {signalements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 13 }}>Aucun signalement</div>
        </div>
      ) : signalements.map(s => {
        const t = TYPES[s.type] || TYPES.autre
        const statutStyle = {
          en_attente: { bg: '#fff7ed', c: '#ea580c', bc: '#fed7aa', l: '⏳ En attente' },
          traite: { bg: '#f0fdf4', c: '#16a34a', bc: '#bbf7d0', l: '✅ Traité' },
          rejete: { bg: '#fef2f2', c: '#dc2626', bc: '#fecaca', l: '❌ Rejeté' }
        }[s.statut]
        return (
          <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 22 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t.l}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                  {new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {s.heure_souhaitee && ` · ${s.heure_souhaitee}`}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: statutStyle.bg, color: statutStyle.c, border: `1px solid ${statutStyle.bc}` }}>{statutStyle.l}</span>
            </div>
            {(s.message || s.commentaire_gerant) && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', background: 'var(--bg)' }}>
                {s.message && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: s.commentaire_gerant ? 6 : 0 }}>"{s.message}"</div>}
                {s.commentaire_gerant && (
                  <div style={{ background: '#f0f7ff', border: '1px solid #d0e8ff', borderRadius: 8, padding: '8px 10px', marginTop: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#0066cc', marginBottom: 2 }}>RÉPONSE DU RESPONSABLE</div>
                    <div style={{ fontSize: 12, color: '#0066cc' }}>{s.commentaire_gerant}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {modal && (
        <div onClick={() => setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, width: '92%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>🔔 Signaler une erreur</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>DATE CONCERNÉE</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>TYPE DE PROBLÈME</label>
              {Object.entries(TYPES).map(([k, v]) => (
                <div key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                  style={{ padding: '10px 14px', borderRadius: 10, border: `2px solid ${form.type === k ? '#0066cc' : 'var(--border)'}`, background: form.type === k ? '#f0f7ff' : 'var(--bg)', cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{v.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: form.type === k ? 700 : 500, color: form.type === k ? '#0066cc' : 'var(--text)' }}>{v.l}</span>
                  {form.type === k && <span style={{ marginLeft: 'auto', color: '#0066cc' }}>✓</span>}
                </div>
              ))}
            </div>
            {(form.type !== 'autre') && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>HEURE CORRECTE</label>
                <input type="time" value={form.heure_souhaitee} onChange={e => setForm(f => ({ ...f, heure_souhaitee: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>MESSAGE (optionnel)</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Expliquez le problème..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border2)', background: 'var(--bg)', fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'none', height: 80 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, height: 44, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={soumettre} disabled={loading} style={{ flex: 2, height: 44, borderRadius: 11, border: 'none', background: '#0066cc', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? .7 : 1 }}>
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#111', color: 'white', padding: '9px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 300 }}>{toast}</div>}
    </div>
  )
}
