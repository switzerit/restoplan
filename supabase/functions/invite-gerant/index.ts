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

    // 1. Générer lien invitation Supabase
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: SITE_URL + '/login' }
    })
    if(linkError) throw linkError
    const inviteUrl = linkData.properties.action_link

    // 2. Envoyer email custom via Resend
    const trialText = statut === 'active'
      ? 'Votre compte est actif sans limitation de durée.'
      : `Votre période d'essai gratuit de ${trial_days} jours commence maintenant.`

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,'Inter',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);border:1px solid #e8eaf0">
    <div style="background:#0C1A35;padding:28px 32px;text-align:center">
      <span style="font-size:32px;font-weight:900;letter-spacing:-1px;color:white">varman</span><span style="display:inline-block;width:10px;height:10px;background:#E11D48;border-radius:50%;margin-left:2px;vertical-align:middle;margin-bottom:4px"></span>
    </div>
    <div style="padding:36px 32px">
      <h1 style="font-size:22px;font-weight:800;color:#0C1A35;margin:0 0 8px">Bienvenue sur Varman, ${prenom} !</h1>
      <p style="font-size:15px;color:#64748b;line-height:1.7;margin:0 0 24px">
        Votre espace de gestion d'équipe pour <strong>${restaurant_nom || entreprise}</strong> est prêt.<br>${trialText}
      </p>
      <a href="${inviteUrl}" style="display:block;text-align:center;background:#E11D48;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;margin-bottom:24px">
        Créer mon mot de passe →
      </a>
      <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:8px">VOS ACCÈS</div>
        <div style="font-size:14px;color:#0C1A35;margin-bottom:4px">📧 Email : <strong>${email}</strong></div>
        <div style="font-size:14px;color:#64748b">🔑 Mot de passe : à définir via le lien ci-dessus</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 12px;border-radius:20px">🇨🇭 Suisse</span>
        <span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 12px;border-radius:20px">🔒 RGPD</span>
        <span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 12px;border-radius:20px">⚡ Support 24h</span>
      </div>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="font-size:12px;color:#94a3b8;margin:0">© 2026 Varman by SwitzerIT · <a href="${SITE_URL}" style="color:#E11D48;text-decoration:none">varman</a></p>
    </div>
  </div>
</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Varman <noreply@switzerit.com>',
        to: [email],
        subject: `Bienvenue sur Varman — Créez votre mot de passe`,
        html
      })
    })
    if(!resendRes.ok) {
      const err = await resendRes.text()
      throw new Error('Resend error: ' + err)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch(error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
