import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = 're_bkoZ4YVx_3oo5UBZnLzD4EskMVFUCTjnp'
const FROM = 'Kronvo <noreply@switzerit.com>'

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Erreur envoi email')
  return data
}

function templateConge(type: string, statut: string, dateDebut: string, dateFin: string, jours: number, commentaire: string, prenom: string) {
  const TYPES: Record<string,string> = {
    conge_paye:'Congé payé 🏖️', rtt:'RTT ⏰', maladie:'Arrêt maladie 🏥', sans_solde:'Sans solde 📋', autre:'Autre 📝'
  }
  const isAccepte = statut === 'accepte'
  const isAnnule = statut === 'annule'
  const color = isAccepte ? '#16a34a' : isAnnule ? '#6b7280' : '#dc2626'
  const bg = isAccepte ? '#f0fdf4' : isAnnule ? '#f3f4f6' : '#fef2f2'
  const emoji = isAccepte ? '✅' : isAnnule ? '🚫' : '❌'
  const label = isAccepte ? 'Acceptée' : isAnnule ? 'Annulée' : 'Refusée'

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:520px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#0071e3,#5856d6);padding:32px;text-align:center">
    <div style="font-size:36px;margin-bottom:8px">📅</div>
    <div style="color:white;font-size:22px;font-weight:800">Kronvo</div>
    <div style="color:rgba(255,255,255,.7);font-size:13px;margin-top:4px">Gestion des plannings</div>
  </div>
  <div style="padding:32px">
    <div style="font-size:18px;font-weight:700;color:#1d1d1f;margin-bottom:6px">Bonjour ${prenom} 👋</div>
    <div style="font-size:14px;color:#6e6e73;margin-bottom:24px">Votre demande de congé a été traitée.</div>
    <div style="background:${bg};border:2px solid ${color};border-radius:14px;padding:20px;margin-bottom:20px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">${emoji}</div>
      <div style="font-size:18px;font-weight:800;color:${color}">${label}</div>
      <div style="font-size:13px;color:#6e6e73;margin-top:4px">${TYPES[type] || type}</div>
    </div>
    <div style="background:#f5f5f7;border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:12px;color:#6e6e73">Du</span>
        <span style="font-size:13px;font-weight:600;color:#1d1d1f">${new Date(dateDebut+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:12px;color:#6e6e73">Au</span>
        <span style="font-size:13px;font-weight:600;color:#1d1d1f">${new Date(dateFin+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:12px;color:#6e6e73">Durée</span>
        <span style="font-size:13px;font-weight:700;color:#0071e3">${jours} jour${jours>1?'s':''}</span>
      </div>
    </div>
    ${commentaire ? `<div style="background:#f0f7ff;border:1px solid #d0e8ff;border-radius:10px;padding:14px;margin-bottom:16px"><div style="font-size:11px;font-weight:700;color:#0071e3;margin-bottom:4px">COMMENTAIRE DU GÉRANT</div><div style="font-size:13px;color:#1d1d1f">${commentaire}</div></div>` : ''}
    <div style="text-align:center;margin-top:24px">
      <div style="font-size:12px;color:#aeaeb2">Connectez-vous à Kronvo pour voir tous vos congés</div>
    </div>
  </div>
  <div style="background:#f5f5f7;padding:16px;text-align:center">
    <div style="font-size:11px;color:#aeaeb2">© 2026 Kronvo by SwitzerIT · noreply@switzerit.com</div>
  </div>
</div>
</body></html>`
}

function templateInvitation(prenom: string, nom: string, email: string, password: string, restoNom: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:520px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#0071e3,#5856d6);padding:32px;text-align:center">
    <div style="font-size:36px;margin-bottom:8px">🎉</div>
    <div style="color:white;font-size:22px;font-weight:800">Kronvo</div>
    <div style="color:rgba(255,255,255,.7);font-size:13px;margin-top:4px">Votre compte a été créé</div>
  </div>
  <div style="padding:32px">
    <div style="font-size:18px;font-weight:700;color:#1d1d1f;margin-bottom:6px">Bonjour ${prenom} ${nom} 👋</div>
    <div style="font-size:14px;color:#6e6e73;margin-bottom:24px">Votre gérant chez <strong>${restoNom}</strong> vous a créé un compte Kronvo.</div>
    <div style="background:#f0f7ff;border:2px solid #d0e8ff;border-radius:14px;padding:20px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:#0071e3;margin-bottom:12px">VOS IDENTIFIANTS</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:12px;color:#6e6e73">Email</span>
        <span style="font-size:13px;font-weight:600;color:#1d1d1f">${email}</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:12px;color:#6e6e73">Mot de passe</span>
        <span style="font-size:13px;font-weight:700;color:#0071e3;background:white;padding:3px 10px;border-radius:8px;border:1px solid #d0e8ff">${password}</span>
      </div>
    </div>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;margin-bottom:20px;font-size:12px;color:#ea580c">
      ⚠️ Pensez à changer votre mot de passe après votre première connexion.
    </div>
    <div style="text-align:center">
      <a href="${Deno.env.get('SITE_URL')||'https://varman.ch'}/login" style="display:inline-block;background:linear-gradient(135deg,#0071e3,#5856d6);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700">
        Se connecter →
      </a>
    </div>
  </div>
  <div style="background:#f5f5f7;padding:16px;text-align:center">
    <div style="font-size:11px;color:#aeaeb2">© 2026 Kronvo by SwitzerIT · noreply@switzerit.com</div>
  </div>
</div>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json()
    const { type } = body

    if (type === 'conge') {
      const { to, prenom, type_conge, statut, date_debut, date_fin, jours, commentaire } = body
      const subject = statut === 'accepte' ? '✅ Congé accepté' : statut === 'annule' ? '🚫 Congé annulé' : '❌ Congé refusé'
      const html = templateConge(type_conge, statut, date_debut, date_fin, jours, commentaire||'', prenom)
      await sendEmail(to, subject, html)
    }

    if (type === 'invitation') {
      const { to, prenom, nom, email, password, resto_nom } = body
      const subject = `🎉 Bienvenue sur Kronvo — ${resto_nom}`
      const html = templateInvitation(prenom, nom, email, password, resto_nom)
      await sendEmail(to, subject, html)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
