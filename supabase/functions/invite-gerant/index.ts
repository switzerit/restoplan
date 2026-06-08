import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function logo() {
  return `
  <table cellpadding="0" cellspacing="0" style="margin:0 auto">
    <tr valign="bottom">
      <td style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:900;letter-spacing:-1px;color:#ffffff;line-height:1;padding-bottom:0">varman</td>
      <td style="padding-bottom:4px;padding-left:3px;line-height:1">
        <div style="width:9px;height:9px;background:#E11D48;border-radius:50%"></div>
      </td>
    </tr>
  </table>`
}

function badge(statut: string, trial_days: number) {
  if(statut==='active') return `<span style="background:#f0fdf4;color:#15803d;border:1px solid #86efac;border-radius:4px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Compte actif</span>`
  if(statut==='expired') return `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:4px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Accès suspendu</span>`
  return `<span style="background:#fff7ed;color:#c2410c;border:1px solid #fdba74;border-radius:4px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Essai ${trial_days} jours</span>`
}

function buildEmail(opts: {
  type: string, prenom: string, email: string,
  nomEtablissement: string, statut: string,
  trial_days: number, trial_end_at: string|null,
  inviteUrl: string|null, SITE_URL: string
}) {
  const { type, prenom, email, nomEtablissement, statut, trial_days, trial_end_at, inviteUrl, SITE_URL } = opts

  const endDate = trial_end_at
    ? new Date(trial_end_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})
    : null

  type Config = { titre: string; sousTitre: string; ctaText: string; ctaUrl: string; ctaColor: string; intro: string }
  
  const configs: Record<string, Config> = {
    invite: {
      titre: `Bienvenue sur Varman`,
      sousTitre: `Votre espace est prêt — créez votre mot de passe pour commencer.`,
      intro: `Bonjour ${prenom},<br><br>Votre espace de gestion d'équipe pour <strong>${nomEtablissement}</strong> vient d'être configuré sur Varman.<br><br>${statut==='active' ? 'Votre accès est activé sans limitation de durée.' : `Vous bénéficiez d'un essai gratuit de <strong>${trial_days} jours</strong> pour découvrir l'ensemble des fonctionnalités.`}<br><br>Cliquez sur le bouton ci-dessous pour définir votre mot de passe et accéder à votre tableau de bord.`,
      ctaText: 'Définir mon mot de passe',
      ctaUrl: inviteUrl || SITE_URL,
      ctaColor: '#E11D48'
    },
    trial_extended: {
      titre: `Votre accès a été prolongé`,
      sousTitre: endDate ? `Votre essai Varman est valide jusqu'au ${endDate}.` : `Votre période d'essai a été mise à jour.`,
      intro: `Bonjour ${prenom},<br><br>Nous avons prolongé votre accès Varman pour <strong>${nomEtablissement}</strong>.<br><br>${endDate ? `Votre période d'essai est désormais valide jusqu'au <strong>${endDate}</strong>.` : ''}<br><br>Profitez de cette période pour explorer l'ensemble des fonctionnalités de la plateforme.`,
      ctaText: 'Accéder à mon espace',
      ctaUrl: `${SITE_URL}/login`,
      ctaColor: '#E11D48'
    },
    activated: {
      titre: `Votre compte est activé`,
      sousTitre: `Accès complet et illimité à Varman.`,
      intro: `Bonjour ${prenom},<br><br>Votre abonnement Varman pour <strong>${nomEtablissement}</strong> est maintenant actif.<br><br>Vous bénéficiez d'un accès complet et illimité à toutes les fonctionnalités de la plateforme : planning, badgeage QR, présences en direct et export paie.<br><br>Merci de votre confiance.`,
      ctaText: 'Accéder à mon espace',
      ctaUrl: `${SITE_URL}/login`,
      ctaColor: '#15803d'
    },
    expired: {
      titre: `Votre période d'essai est terminée`,
      sousTitre: `Contactez-nous pour continuer à utiliser Varman.`,
      intro: `Bonjour ${prenom},<br><br>Votre période d'essai Varman pour <strong>${nomEtablissement}</strong> est arrivée à son terme.<br><br>Pour maintenir l'accès à votre espace et à vos données, contactez notre équipe afin de choisir la formule adaptée à votre activité.<br><br>Nous sommes disponibles pour répondre à vos questions.`,
      ctaText: 'Contacter SwitzerIT',
      ctaUrl: `${SITE_URL}/contact`,
      ctaColor: '#E11D48'
    }
  }

  const c = configs[type] || configs.invite

  const infoRows = [
    ['Adresse email', email],
    ...(endDate && statut !== 'active' ? [[`Fin d'essai`, endDate]] : []),
    ['Plateforme', `<a href="${SITE_URL}" style="color:#E11D48;text-decoration:none">${SITE_URL.replace('https://','')}</a>`],
  ]

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${c.titre}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;min-width:320px">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9">
<tr><td align="center" style="padding:48px 16px">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">

    <!-- HEADER -->
    <tr>
      <td style="background:#0C1A35;border-radius:12px 12px 0 0;padding:32px 48px;text-align:center">
        ${logo()}
        <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,.4);letter-spacing:.06em;text-transform:uppercase">Gestion d'équipe professionnelle</p>
      </td>
    </tr>

    <!-- BADGE -->
    <tr>
      <td style="background:#ffffff;padding:28px 48px 0;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
        ${badge(statut, trial_days)}
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="background:#ffffff;padding:20px 48px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">

        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0C1A35;letter-spacing:-.5px;line-height:1.25">${c.titre}</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.5">${c.sousTitre}</p>

        <div style="width:48px;height:2px;background:#E11D48;margin-bottom:24px;border-radius:1px"></div>

        <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.8">${c.intro}</p>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:36px">
          <tr>
            <td align="center" style="border-radius:8px;background:${c.ctaColor}">
              <a href="${c.ctaUrl}" target="_blank" style="display:inline-block;padding:15px 40px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-.2px">${c.ctaText} &rarr;</a>
            </td>
          </tr>
        </table>

        <!-- INFO TABLE -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px">
          <tr>
            <td colspan="2" style="background:#f8fafc;padding:12px 20px;border-bottom:1px solid #e2e8f0">
              <span style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase">Vos informations</span>
            </td>
          </tr>
          ${infoRows.map((row, i) => `
          <tr>
            <td style="padding:11px 20px;font-size:13px;color:#94a3b8;border-bottom:${i<infoRows.length-1?'1px solid #f1f5f9':'none'};width:140px;vertical-align:top">${row[0]}</td>
            <td style="padding:11px 20px;font-size:13px;color:#1e293b;font-weight:500;border-bottom:${i<infoRows.length-1?'1px solid #f1f5f9':'none'};vertical-align:top">${row[1]}</td>
          </tr>`).join('')}
        </table>

        <!-- SUPPORT -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
                Besoin d'aide ? L'équipe SwitzerIT est disponible du lundi au vendredi.<br>
                <a href="mailto:contact@switzerit.com" style="color:#E11D48;text-decoration:none;font-weight:600">contact@switzerit.com</a> &mdash; Réponse sous 24h ouvrées.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 48px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
                Cet email a été envoyé à <strong>${email}</strong> car un compte Varman a été créé à votre nom.<br>
                Si vous n'êtes pas à l'origine de cette action, ignorez ce message.
              </p>
            </td>
            <td align="right" style="vertical-align:top;white-space:nowrap;padding-left:16px">
              <p style="margin:0;font-size:12px;color:#cbd5e1">🇨🇭 Suisse</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:14px;border-top:1px solid #e2e8f0;margin-top:14px">
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <p style="margin:0;font-size:11px;color:#cbd5e1">
                © 2026 Varman by SwitzerIT &nbsp;&bull;&nbsp;
                <a href="${SITE_URL}/legal" style="color:#cbd5e1;text-decoration:none">CGU</a> &nbsp;&bull;&nbsp;
                <a href="${SITE_URL}/legal" style="color:#cbd5e1;text-decoration:none">Confidentialité</a> &nbsp;&bull;&nbsp;
                <a href="${SITE_URL}/contact" style="color:#cbd5e1;text-decoration:none">Contact</a>
              </p>
            </td>
          </tr>
        </table>
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
      invite: `Bienvenue sur Varman — Définissez votre mot de passe`,
      trial_extended: `Votre accès Varman a été prolongé`,
      activated: `Votre compte Varman est activé`,
      expired: `Votre période d'essai Varman est terminée`,
    }

    const html = buildEmail({ type, prenom, email, nomEtablissement, statut, trial_days, trial_end_at, inviteUrl, SITE_URL })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Varman <noreply@switzerit.com>',
        to: [email],
        subject: subjects[type] || subjects.invite,
        html
      })
    })

    if(!res.ok) throw new Error(await res.text())

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch(error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
