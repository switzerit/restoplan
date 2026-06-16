import { useState, useEffect } from 'react'
import { api } from '../apiClient'

const TYPES = {
  oubli_arrivee: { l: "Je n'ai pas pointé mon arrivée", icon: '🟢' },
  oubli_depart: { l: "Je n'ai pas pointé mon départ", icon: '🔴' },
  heure_incorrecte: { l: "Mon heure pointée est incorrecte", icon: '✏️' },
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
    const data = await api.get(`/signalements?employe_id=${employe.id}`)
    setSignalements(data || [])
  }

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  async function soumettre() {
    if (!form.date) { showToast('Choisis une date'); return }
    setLoading(true)
    const result = await api.post('/signalements', {
      employe_id: employe.id, restaurant_id: employe.restaurant_id,
      date: form.date, type: form.type,
      heure_souhaitee: form.heure_souhaitee || null,
      message: form.message || null
    })
    setLoading(false)
    if (!result) { showToast('Erreur lors de l\'envoi'); return }
    showToast('✅ Signalement envoyé !')
    setModal(false)
    load()
  }

  const st = (statut) => ({
    en_attente: { bg: '#fff7ed', c: '#ea580c', bc: '#fed7aa', l: '⏳ En attente' },
    traite: { bg: '#f0fdf4', c: '#16a34a', bc: '#bbf7d0', l: '✅ Traité' },
    rejete: { bg: '#fef2f2', c: '#dc2626', bc: '#fecaca', l: '❌ Rejeté' }
  })[statut]

  const field = { width:'100%', padding:'9px 11px', borderRadius:10, border:'1.5px solid var(--border2)', background:'var(--bg)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box', display:'block' }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:800 }}>🔔 Signalements</div>
        <button onClick={() => setModal(true)} style={{ padding:'8px 16px', borderRadius:10, border:'none', background:'#E11D48', color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Signaler</button>
      </div>

      {signalements.length === 0 ? (
        <div style={{ textAlign:'center', padding:'32px 20px', background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>Aucun signalement</div>
        </div>
      ) : signalements.map(s => {
        const t = TYPES[s.type] || TYPES.autre
        const s2 = st(s.statut)
        return (
          <div key={s.id} style={{ background:'var(--surface)', borderRadius:14, border:`1px solid ${s.statut==='en_attente'?'#fed7aa':'var(--border)'}`, overflow:'hidden', marginBottom:10 }}>
            <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{t.l}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>
                  {new Date(s.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
                  {s.heure_souhaitee && <strong> · {s.heure_souhaitee}</strong>}
                </div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, background:s2.bg, color:s2.c, border:`1px solid ${s2.bc}`, flexShrink:0, whiteSpace:'nowrap' }}>{s2.l}</span>
            </div>
            {s.message && <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text2)', fontStyle:'italic' }}>"{s.message}"</div>}
            {s.commentaire_gerant && (
              <div style={{ padding:'10px 14px', borderTop:'1px solid #fecdd3', background:'#fff1f3' }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#E11D48', marginBottom:3 }}>💬 RÉPONSE DU RESPONSABLE</div>
                <div style={{ fontSize:13, color:'#E11D48' }}>{s.commentaire_gerant}</div>
              </div>
            )}
          </div>
        )
      })}

      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:199 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'var(--surface)', borderRadius:20, zIndex:200, width:'calc(100vw - 32px)', maxWidth:400, maxHeight:'85vh', overflowY:'auto', overflowX:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding:'18px 16px' }}>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:18 }}>⏱️ Corriger un pointage</div>

              {/* Type en premier — le plus important */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>TYPE DE PROBLÈME</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {Object.entries(TYPES).map(([k,v]) => (
                    <button key={k} onClick={() => setForm(f=>({...f,type:k}))}
                      style={{ padding:'10px 8px', borderRadius:10, border:`2px solid ${form.type===k?'#E11D48':'var(--border)'}`, background:form.type===k?'#fff1f3':'var(--bg)', cursor:'pointer', display:'flex', alignItems:'center', gap:8, textAlign:'left' }}>
                      <span style={{ fontSize:15 }}>{v.icon}</span>
                      <span style={{ fontSize:12, fontWeight:form.type===k?700:500, color:form.type===k?'#E11D48':'var(--text)' }}>{v.l}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Heure sur une ligne */}
              <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:6 }}>DATE</div>
                  <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}
                    style={{ width:'100%', padding:'9px 10px', borderRadius:10, border:'1.5px solid var(--border2)', background:'var(--bg)', fontSize:13, color:'var(--text)', outline:'none' }} />
                </div>
                {form.type !== 'autre' && (
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:6 }}>HEURE</div>
                    <input type="time" value={form.heure_souhaitee} onChange={e => setForm(f=>({...f,heure_souhaitee:e.target.value}))}
                      style={{ width:'100%', padding:'9px 10px', borderRadius:10, border:'1.5px solid var(--border2)', background:'var(--bg)', fontSize:13, color:'var(--text)', outline:'none' }} />
                  </div>
                )}
              </div>

              {/* Message */}
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:6 }}>MESSAGE (optionnel)</div>
                <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} placeholder="Expliquez le problème..."
                  style={{ ...field, resize:'none', height:70 }} />
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setModal(false)} style={{ flex:1, height:44, borderRadius:12, border:'1.5px solid var(--border)', background:'transparent', color:'var(--text2)', fontSize:14, fontWeight:600, cursor:'pointer' }}>Annuler</button>
                <button onClick={soumettre} disabled={loading} style={{ flex:2, height:44, borderRadius:12, border:'none', background:loading?'#99b8e0':'#E11D48', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <div style={{ position:'fixed', bottom:30, left:'50%', transform:'translateX(-50%)', background:'#111', color:'white', padding:'9px 20px', borderRadius:20, fontSize:13, fontWeight:600, zIndex:300, whiteSpace:'nowrap' }}>{toast}</div>}
    </div>
  )
}
