import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = {
  oubli_arrivee: { l: "Oubli d'arrivée", icon: '🕐' },
  oubli_depart: { l: "Oubli de départ", icon: '🕐' },
  heure_incorrecte: { l: "Heure incorrecte", icon: '✏️' },
  autre: { l: "Autre", icon: '❓' }
}

const inp = { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid var(--border2)', background:'var(--bg)', fontSize:14, color:'var(--text)', outline:'none' }

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
    if (error) { showToast('Erreur'); return }
    showToast('✅ Signalement envoyé !')
    setModal(false)
    load()
  }

  const st = (statut) => ({
    en_attente: { bg: '#fff7ed', c: '#ea580c', bc: '#fed7aa', l: '⏳ En attente' },
    traite: { bg: '#f0fdf4', c: '#16a34a', bc: '#bbf7d0', l: '✅ Traité' },
    rejete: { bg: '#fef2f2', c: '#dc2626', bc: '#fecaca', l: '❌ Rejeté' }
  })[statut]

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:800 }}>🔔 Signalements</div>
        <button onClick={() => setModal(true)} style={{ padding:'8px 14px', borderRadius:10, border:'none', background:'#0066cc', color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Signaler</button>
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
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{t.l}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>
                  {new Date(s.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
                  {s.heure_souhaitee && <strong> · {s.heure_souhaitee}</strong>}
                </div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, background:s2.bg, color:s2.c, border:`1px solid ${s2.bc}`, flexShrink:0 }}>{s2.l}</span>
            </div>
            {s.message && <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text2)', fontStyle:'italic' }}>"{s.message}"</div>}
            {s.commentaire_gerant && (
              <div style={{ padding:'10px 14px', borderTop:'1px solid #d0e8ff', background:'#f0f7ff', display:'flex', gap:8 }}>
                <span>💬</span>
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:'#0066cc', marginBottom:2 }}>RÉPONSE DU RESPONSABLE</div>
                  <div style={{ fontSize:12, color:'#0066cc' }}>{s.commentaire_gerant}</div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', backdropFilter:'blur(4px)', zIndex:199 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'var(--surface)', borderRadius:18, padding:'20px 18px', zIndex:200, width:'min(90vw,400px)', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>🔔 Signaler une erreur</div>

            {/* Date + heure sur une ligne */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text2)', marginBottom:5 }}>DATE</label>
                <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} style={inp} />
              </div>
              {form.type !== 'autre' && (
                <div>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text2)', marginBottom:5 }}>HEURE CORRECTE</label>
                  <input type="time" value={form.heure_souhaitee} onChange={e => setForm(f=>({...f,heure_souhaitee:e.target.value}))} style={inp} />
                </div>
              )}
            </div>

            {/* Type — grille 2x2 compacte */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>TYPE</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {Object.entries(TYPES).map(([k,v]) => (
                  <div key={k} onClick={() => setForm(f=>({...f,type:k}))}
                    style={{ padding:'10px 12px', borderRadius:10, border:`2px solid ${form.type===k?'#0066cc':'var(--border)'}`, background:form.type===k?'#f0f7ff':'var(--bg)', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>{v.icon}</span>
                    <span style={{ fontSize:12, fontWeight:form.type===k?700:500, color:form.type===k?'#0066cc':'var(--text)', lineHeight:1.2 }}>{v.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text2)', marginBottom:5 }}>MESSAGE (optionnel)</label>
              <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} placeholder="Détails..."
                style={{ ...inp, resize:'none', height:65 }} />
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setModal(false)} style={{ flex:1, height:42, borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text2)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
              <button onClick={soumettre} disabled={loading} style={{ flex:2, height:42, borderRadius:12, border:'none', background:loading?'#ccc':'#0066cc', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                {loading?'Envoi...':'Envoyer'}
              </button>
            </div>
          </div>
        </>
      )}

      {toast && <div style={{ position:'fixed', bottom:30, left:'50%', transform:'translateX(-50%)', background:'#111', color:'white', padding:'9px 20px', borderRadius:20, fontSize:13, fontWeight:600, zIndex:300, whiteSpace:'nowrap' }}>{toast}</div>}
    </div>
  )
}
