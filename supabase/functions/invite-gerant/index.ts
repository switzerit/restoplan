import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { email, prenom, nom, entreprise, restaurant_nom, trial_days, statut } = await req.json()
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://restoplan.vercel.app'
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: SITE_URL + '/login' }
    })
    if(linkError) throw linkError
    const inviteUrl = linkData.properties.action_link

    const trialBadge = statut === 'active'
      ? `<span style="background:#f0fdf4;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">✅ Compte actif</span>`
      : `<span style="background:#fff7ed;color:#ea580c;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">⏳ Essai gratuit ${trial_days} jours</span>`

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bienvenue sur Varman</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:540px;margin:48px auto;padding:0 16px">

    <!-- Header -->
    <div style="background:#0C1A35;border-radius:16px 16px 0 0;padding:32px;text-align:center">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto">
        <tr>
          <td style="font-size:36px;font-weight:900;letter-spacing:-1.5px;color:white;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">varman</td>
          <td style="width:12px;height:12px;background:#E11D48;border-radius:50%;vertical-align:bottom;padding-bottom:6px"></td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="background:white;padding:40px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
      <div style="margin-bottom:24px">${trialBadge}</div>

      <h1 style="font-size:24px;font-weight:800;color:#0C1A35;margin:0 0 12px;line-height:1.2">
        Bienvenue, ${prenom} 👋
      </h1>
      <p style="font-size:15px;color:#64748b;line-height:1.75;margin:0 0 32px">
        Votre espace <strong style="color:#0C1A35">${restaurant_nom || entreprise}</strong> est prêt sur Varman.<br>
        ${statut === 'active' ? 'Votre compte est actif sans limitation de durée.' : `Vous disposez de <strong style="color:#ea580c">${trial_days} jours d'essai gratuit</strong> pour découvrir toutes les fonctionnalités.`}
      </p>

      <a href="${inviteUrl}" style="display:block;text-align:center;background:#E11D48;color:white;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:-0.3px;margin-bottom:32px">
        Créer mon mot de passe →
      </a>

      <!-- Infos accès -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:32px">
        <div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.08em;margin-bottom:14px">VOS INFORMATIONS DE CONNEXION</div>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#64748b;width:120px">📧 Email</td>
            <td style="padding:6px 0;font-size:14px;font-weight:700;color:#0C1A35">${email}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#64748b">🔑 Mot de passe</td>
            <td style="padding:6px 0;font-size:14px;color:#64748b">À définir via le lien</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#64748b">🌐 Accès</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#E11D48"><a href="${SITE_URL}" style="color:#E11D48;text-decoration:none">${SITE_URL.replace('https://','')}</a></td>
          </tr>
        </table>
      </div>

      <!-- Fonctionnalités -->
      <div style="margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.08em;margin-bottom:14px">CE QUI VOUS ATTEND</div>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${[['📅','Planning d\'équipe','Créez et publiez les plannings'],['📱','Badgeage QR','Pointage en 2 secondes'],['⏱️','Présences en direct','Dashboard temps réel'],['📄','Export paie','Rapports prêts pour votre comptable']].map(([icon,title,desc])=>`
          <tr>
            <td style="padding:8px 0;vertical-align:top;width:36px">
              <span style="font-size:20px">${icon}</span>
            </td>
            <td style="padding:8px 0;vertical-align:top">
              <div style="font-size:13px;font-weight:700;color:#0C1A35">${title}</div>
              <div style="font-size:12px;color:#94a3b8">${desc}</div>
            </td>
          </tr>`).join('')}
        </table>
      </div>

      <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0">
        Une question ? Répondez à cet email ou contactez-nous sur <a href="${SITE_URL}/contact" style="color:#E11D48;text-decoration:none">varman.app/contact</a>.<br>
        Notre équipe SwitzerIT vous répond sous 24h.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center">
      <p style="font-size:12px;color:#94a3b8;margin:0">
        © 2026 <strong>Varman</strong> by SwitzerIT · Suisse &nbsp;·&nbsp;
        <a href="${SITE_URL}/legal" style="color:#94a3b8;text-decoration:none">CGU</a> &nbsp;·&nbsp;
        <a href="${SITE_URL}/contact" style="color:#94a3b8;text-decoration:none">Contact</a>
      </p>
    </div>

  </div>
</body>
</html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Varman <noreply@switzerit.com>',
        to: [email],
        subject: `Bienvenue sur Varman, ${prenom} — Créez votre mot de passe`,
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
