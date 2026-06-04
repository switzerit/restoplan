import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function buildEmail(type: string, prenom: string, email: string, nomEtablissement: string, statut: string, trial_days: number, trial_end_at: string|null, inviteUrl: string|null, SITE_URL: string) {
  const badge = statut==='active'
    ? `<td style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700">✅ Compte actif</td>`
    : statut==='expired'
    ? `<td style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700">❌ Compte expiré</td>`
    : `<td style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700">⏳ Essai gratuit ${trial_days} jours</td>`

  const endDate = trial_end_at ? new Date(trial_end_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) : null

  let titre = ''
  let message = ''
  let ctaHtml = ''

  if(type === 'invite') {
    titre = `Bienvenue sur Varman, ${prenom} 👋`
    message = `Votre espace <strong style="color:#0C1A35">${nomEtablissement}</strong> est prêt sur Varman.<br>
      ${statut==='active' ? 'Votre compte est actif sans limitation de durée.' : `Vous disposez de <strong style="color:#ea580c">${trial_days} jours d'essai gratuit</strong> pour découvrir toutes les fonctionnalités.`}`
    ctaHtml = `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px">
      <tr><td align="center" style="background:#E11D48;border-radius:12px">
        <a href="${inviteUrl}" style="display:block;padding:16px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none">Créer mon mot de passe →</a>
      </td></tr></table>`
  } else if(type === 'trial_extended') {
    titre = `Bonne nouvelle, ${prenom} ! ⏰`
    message = `Votre accès Varman pour <strong style="color:#0C1A35">${nomEtablissement}</strong> a été prolongé.
      ${endDate ? `<br>Votre essai est maintenant valide jusqu'au <strong style="color:#ea580c">${endDate}</strong>.` : ''}`
    ctaHtml = `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px">
      <tr><td align="center" style="background:#E11D48;border-radius:12px">
        <a href="${SITE_URL}/login" style="display:block;padding:16px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none">Accéder à mon espace →</a>
      </td></tr></table>`
  } else if(type === 'activated') {
    titre = `Votre compte est activé, ${prenom} ! 🎉`
    message = `Votre abonnement Varman pour <strong style="color:#0C1A35">${nomEtablissement}</strong> est maintenant actif sans limitation de durée.<br>Merci de votre confiance !`
    ctaHtml = `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px">
      <tr><td align="center" style="background:#16a34a;border-radius:12px">
        <a href="${SITE_URL}/login" style="display:block;padding:16px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none">Accéder à mon espace →</a>
      </td></tr></table>`
  } else if(type === 'expired') {
    titre = `Votre essai est terminé, ${prenom}`
    message = `Votre période d'essai Varman pour <strong style="color:#0C1A35">${nomEtablissement}</strong> est arrivée à son terme.<br>
      Contactez-nous pour continuer à utiliser Varman et garder accès à vos données.`
    ctaHtml = `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px">
      <tr><td align="center" style="background:#E11D48;border-radius:12px">
        <a href="${SITE_URL}/contact" style="display:block;padding:16px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none">Contacter SwitzerIT →</a>
      </td></tr></table>`
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
  <tr>
    <td align="center" style="background:#0C1A35;border-radius:16px 16px 0 0;padding:28px 40px">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:34px;font-weight:900;letter-spacing:-1.5px;color:#ffffff">varman</td>
        <td style="width:11px;height:11px;background:#E11D48;border-radius:50%;vertical-align:bottom;padding-bottom:5px;padding-left:2px"></td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
      <table cellpadding="0" cellspacing="0" style="margin-bottom:24px"><tr>${badge}</tr></table>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0C1A35;line-height:1.2">${titre}</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.75">${message}</p>
      ${ctaHtml}
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px">
        <tr><td style="padding:16px 20px 8px"><p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.08em">VOS INFORMATIONS</p></td></tr>
        <tr><td style="padding:0 20px 16px">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;width:120px">📧 Email</td>
              <td style="padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0C1A35">${email}</td>
            </tr>
            ${endDate && statut!=='active' ? `<tr>
              <td style="padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b">📅 Fin d'essai</td>
              <td style="padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#ea580c">${endDate}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:7px 0;font-size:13px;color:#64748b">🌐 Application</td>
              <td style="padding:7px 0"><a href="${SITE_URL}" style="font-size:13px;font-weight:600;color:#E11D48;text-decoration:none">${SITE_URL.replace('https://','')}</a></td>
            </tr>
          </table>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff1f3;border:1px solid #fecdd3;border-radius:10px">
        <tr><td style="padding:14px 20px">
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
            💬 Une question ? <a href="mailto:contact@switzerit.com" style="color:#E11D48;text-decoration:none;font-weight:600">contact@switzerit.com</a> — Réponse sous 24h.
          </p>
        </td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">© 2026 <strong>Varman</strong> by SwitzerIT · <a href="${SITE_URL}/legal" style="color:#94a3b8;text-decoration:none">CGU</a> · <a href="${SITE_URL}/contact" style="color:#94a3b8;text-decoration:none">Contact</a> · 🇨🇭 Suisse</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { email, prenom, nom, entreprise, restaurant_nom, trial_days, statut, type = 'invite', trial_end_at } = await req.json()
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://restoplan.vercel.app'
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
    const nomEtablissement = restaurant_nom || entreprise || 'votre établissement'

    let inviteUrl = null
    if(type === 'invite') {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery', email,
        options: { redirectTo: SITE_URL + '/login' }
      })
      if(linkError) throw linkError
      inviteUrl = linkData.properties.action_link
    }

    const subjects: Record<string,string> = {
      invite: `Bienvenue sur Varman, ${prenom} — Créez votre mot de passe`,
      trial_extended: `Votre essai Varman a été prolongé ✅`,
      activated: `Votre compte Varman est activé 🎉`,
      expired: `Votre essai Varman est terminé`,
    }

    const html = buildEmail(type, prenom, email, nomEtablissement, statut, trial_days, trial_end_at, inviteUrl, SITE_URL)

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Varman <noreply@switzerit.com>',
        to: [email],
        subject: subjects[type] || subjects.invite,
        html
      })
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch(error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
