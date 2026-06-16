import { useState, useEffect } from 'react'
import { api } from '../apiClient'

const TYPE_CONFIG = {
  oubli_arrivee:   { l: 'Arrivée non pointée',  short: 'Arrivée',  c: '#16a34a', bg: '#f0fdf4', bc: '#bbf7d0', icon: '🟢' },
  oubli_depart:    { l: 'Départ non pointé',     short: 'Départ',   c: '#dc2626', bg: '#fef2f2', bc: '#fecaca', icon: '🔴' },
  heure_incorrecte:{ l: 'Heure incorrecte',      short: 'Heure',    c: '#2563EB', bg: '#eff6ff', bc: '#bfdbfe', icon: '✏️' },
  autre:           { l: 'Autre',                 short: 'Autre',    c: '#6b7280', bg: '#f3f4f6', bc: '#e5e7eb', icon: '❓' },
}
const STATUT_CONFIG = {
  en_attente: { l: 'En attente', c: '#ea580c', bg: '#fff7ed', bc: '#fed7aa' },
  traite:     { l: 'Appliqué',   c: '#16a34a', bg: '#f0fdf4', bc: '#bbf7d0' },
  rejete:     { l: 'Rejeté',     c: '#dc2626', bg: '#fef2f2', bc: '#fecaca' },
  archive:    { l: 'Archivé',    c: '#6b7280', bg: '#f3f4f6', bc: '#e5e7eb' },
}

function ini(p, n) { return ((p?.[0]||'')+(n?.[0]||'')).toUpperCase() }
function fmtDate(s) {
  if (!s) return '—'
  const str = typeof s === 'string' ? s : s.toISOString().split('T')[0]
  return new Date(str+'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtDateLong(s) {
  if (!s) return '—'
  const str = typeof s === 'string' ? s : s.toISOString().split('T')[0]
  return new Date(str+'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const FILTRES = [
  { id: 'en_attente', l: 'En attente' },
  { id: 'traite',     l: 'Appliquées' },
  { id: 'rejete',     l: 'Rejetées'   },
  { id: 'tous',       l: 'Toutes'     },
]

export default function SignalementsGerant({ restaurant, employes }) {
  const [items, setItems]       = useState([])
  const [filtre, setFiltre]     = useState('en_attente')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [commentaire, setCommentaire] = useState('')
  const [loading, setLoading]   = useState(false)
  const [toast, setToast]       = useState('')

  useEffect(() => { if (restaurant) load() }, [restaurant?.id])

  async function load() {
    const data = await api.get(`/signalements?restaurant_id=${restaurant.id}`)
    setItems(data || [])
  }

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  function openModal(s) {
    setSelected(s)
    setCommentaire(s.commentaire_gerant || '')
  }

  function closeModal() { setSelected(null); setCommentaire('') }

  async function appliquer(s) {
    let heure_type = null
    if (s.type === 'heure_incorrecte') {
      heure_type = window.confirm('Corriger l\'heure d\'arrivée ?\n(Annuler = heure de départ)') ? 'arrivee' : 'depart'
    }
    setLoading(true)
    await api.post(`/signalements/${s.id}/appliquer`, { commentaire_gerant: commentaire || null, heure_type })
    setLoading(false)
    showToast('Correction appliquée')
    closeModal(); load()
  }

  async function traiter(statut) {
    setLoading(true)
    await api.put(`/signalements/${selected.id}`, { statut, commentaire_gerant: commentaire || null })
    setLoading(false)
    showToast(statut === 'rejete' ? 'Demande rejetée' : statut === 'en_attente' ? 'Demande rouverte' : 'Marqué traité')
    closeModal(); load()
  }

  async function archiver(id) {
    await api.put(`/signalements/${id}`, { statut: 'archive', commentaire_gerant: null })
    showToast('Archivé')
    closeModal(); load()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement cette correction ?')) return
    await api.delete(`/signalements/${id}`)
    showToast('Supprimé')
    closeModal(); load()
  }

  const counts = {
    en_attente: items.filter(s => s.statut === 'en_attente').length,
    traite:     items.filter(s => s.statut === 'traite').length,
    rejete:     items.filter(s => s.statut === 'rejete').length,
  }

  const filtered = items.filter(s => {
    if (filtre !== 'tous' && s.statut !== filtre) return false
    if (filtre === 'tous' && s.statut === 'archive') return false
    if (search) {
      const q = search.toLowerCase()
      return (s.prenom+' '+s.nom).toLowerCase().includes(q)
    }
    return true
  })

  const inp = { width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid var(--border2)', background:'var(--bg)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Barre de recherche */}
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--text3)', pointerEvents:'none' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un employé..."
          style={{ ...inp, paddingLeft:36 }} />
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
        {FILTRES.map(f => {
          const count = counts[f.id]
          const active = filtre === f.id
          return (
            <button key={f.id} onClick={() => setFiltre(f.id)}
              style={{ flexShrink:0, padding:'7px 14px', borderRadius:20, border:`1.5px solid ${active?'#E11D48':'var(--border)'}`,
                background: active ? '#E11D48' : 'var(--surface)',
                color: active ? 'white' : 'var(--text2)',
                fontSize:12, fontWeight:active?700:500, cursor:'pointer',
                display:'flex', alignItems:'center', gap:6, transition:'all .15s' }}>
              {f.l}
              {count > 0 && f.id !== 'tous' && (
                <span style={{ background: active ? 'rgba(255,255,255,.3)' : '#E11D48', color: active ? 'white' : 'white',
                  borderRadius:20, padding:'1px 6px', fontSize:10, fontWeight:800 }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 20px', background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text2)' }}>
            {filtre === 'en_attente' ? 'Aucune correction en attente' : 'Aucune correction'}
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Les demandes de vos employés apparaîtront ici</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(s => {
            const tc = TYPE_CONFIG[s.type] || TYPE_CONFIG.autre
            const sc = STATUT_CONFIG[s.statut] || STATUT_CONFIG.en_attente
            return (
              <div key={s.id} onClick={() => openModal(s)}
                style={{ background:'var(--surface)', borderRadius:14, border:`1.5px solid ${s.statut==='en_attente'?tc.bc:'var(--border)'}`,
                  cursor:'pointer', overflow:'hidden', transition:'box-shadow .15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  {/* Avatar */}
                  <div style={{ width:40, height:40, borderRadius:'50%', background:tc.bg, color:tc.c,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0, border:`1.5px solid ${tc.bc}` }}>
                    {ini(s.prenom, s.nom)}
                  </div>
                  {/* Infos */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{s.prenom} {s.nom}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20,
                        background:tc.bg, color:tc.c, border:`1px solid ${tc.bc}` }}>
                        {tc.icon} {tc.short}
                      </span>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>
                        {fmtDate(s.date)}{s.heure_souhaitee && ` · ${s.heure_souhaitee}`}
                      </span>
                    </div>
                  </div>
                  {/* Statut */}
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20,
                    background:sc.bg, color:sc.c, border:`1px solid ${sc.bc}`, flexShrink:0, whiteSpace:'nowrap' }}>
                    {sc.l}
                  </span>
                </div>
                {s.message && (
                  <div style={{ padding:'8px 16px', borderTop:'1px solid var(--border)', background:'var(--bg)',
                    fontSize:12, color:'var(--text2)', fontStyle:'italic' }}>"{s.message}"</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (() => {
        const tc = TYPE_CONFIG[selected.type] || TYPE_CONFIG.autre
        const sc = STATUT_CONFIG[selected.statut] || STATUT_CONFIG.en_attente
        return (
          <div onClick={closeModal} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
            backdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300,
            padding:'0' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:'var(--surface)', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:520,
                maxHeight:'90vh', overflowY:'auto', boxShadow:'0 -4px 40px rgba(0,0,0,.2)',
                padding:'0 0 32px 0' }}>

              {/* Handle */}
              <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
                <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)' }}/>
              </div>

              {/* Header */}
              <div style={{ padding:'12px 20px 16px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:tc.bg, color:tc.c,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, border:`2px solid ${tc.bc}` }}>
                    {ini(selected.prenom, selected.nom)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800 }}>{selected.prenom} {selected.nom}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{selected.role || ''}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => archiver(selected.id)}
                      style={{ padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text2)', fontSize:12, cursor:'pointer' }}
                      title="Archiver">🗂️</button>
                    <button onClick={() => supprimer(selected.id)}
                      style={{ padding:'7px 10px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:12, cursor:'pointer' }}
                      title="Supprimer">🗑️</button>
                    <button onClick={closeModal}
                      style={{ padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text2)', fontSize:12, cursor:'pointer' }}>✕</button>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>

                {/* Type + date + heure */}
                <div style={{ background:tc.bg, border:`1.5px solid ${tc.bc}`, borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:18 }}>{tc.icon}</span>
                    <span style={{ fontSize:14, fontWeight:800, color:tc.c }}>{tc.l}</span>
                    <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
                      background:sc.bg, color:sc.c, border:`1px solid ${sc.bc}` }}>{sc.l}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)' }}>
                    📅 {fmtDateLong(selected.date)}
                  </div>
                  {selected.heure_souhaitee && (
                    <div style={{ fontSize:15, fontWeight:800, color:tc.c, marginTop:6 }}>
                      🕐 {selected.heure_souhaitee}
                    </div>
                  )}
                </div>

                {/* Message employé */}
                {selected.message && (
                  <div style={{ background:'var(--bg)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', marginBottom:4 }}>MESSAGE DE L'EMPLOYÉ</div>
                    <div style={{ fontSize:13, color:'var(--text)', fontStyle:'italic' }}>"{selected.message}"</div>
                  </div>
                )}

                {/* Réponse gérant */}
                {selected.commentaire_gerant && (
                  <div style={{ background:'#fff1f3', borderRadius:10, padding:'12px 14px', border:'1px solid #fecdd3' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#E11D48', marginBottom:4 }}>VOTRE RÉPONSE</div>
                    <div style={{ fontSize:13, color:'#E11D48' }}>{selected.commentaire_gerant}</div>
                  </div>
                )}

                {/* Actions si en attente */}
                {selected.statut === 'en_attente' && (
                  <>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:6 }}>RÉPONSE À L'EMPLOYÉ (optionnel)</div>
                      <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                        placeholder="Ex : Pointage corrigé, merci de vérifier"
                        style={{ ...inp, resize:'none', height:70, fontFamily:'var(--font)' }} />
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {(selected.type==='oubli_arrivee'||selected.type==='oubli_depart'||selected.type==='heure_incorrecte') && selected.heure_souhaitee && (
                        <button onClick={() => appliquer(selected)} disabled={loading}
                          style={{ width:'100%', height:50, borderRadius:12, border:'none', background:'#2563EB',
                            color:'white', fontSize:14, fontWeight:800, cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?.7:1 }}>
                          ⚡ Appliquer la correction · {selected.heure_souhaitee}
                        </button>
                      )}
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => traiter('rejete')} disabled={loading}
                          style={{ flex:1, height:44, borderRadius:11, border:'1.5px solid #fecaca',
                            background:'#fef2f2', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                          Rejeter
                        </button>
                        <button onClick={() => traiter('traite')} disabled={loading}
                          style={{ flex:2, height:44, borderRadius:11, border:'none',
                            background:'#16a34a', color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                          Marquer traité
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions si déjà traité */}
                {selected.statut !== 'en_attente' && (
                  <button onClick={() => traiter('en_attente')}
                    style={{ width:'100%', height:44, borderRadius:11, border:'1.5px solid #fed7aa',
                      background:'#fff7ed', color:'#ea580c', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    ↩️ Rouvrir la demande
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background:'#111', color:'white', padding:'10px 20px', borderRadius:20,
          fontSize:13, fontWeight:600, zIndex:400, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,.3)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
