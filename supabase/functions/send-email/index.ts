import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = 're_bkoZ4YVx_3oo5UBZnLzD4EskMVFUCTjnp'
const FROM = 'Varman <noreply@switzerit.com>'

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

function logo() {
  return `
  <table cellpadding="0" cellspacing="0" style="margin:0 auto">
    <tr valign="bottom">
      <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:32px;font-weight:900;letter-spacing:-1px;color:#ffffff;line-height:1">varman</td>
      <td style="padding-bottom:4px;padding-left:3px;line-height:1">
        <div style="width:9px;height:9px;background:#E11D48;border-radius:50%"></div>
      </td>
    </tr>
  </table>`
}

function templateConge(type: string, statut: string, dateDebut: string, dateFin: string, jours: number, commentaire: string, prenom: string) {
  const TYPES: Record<string,string> = {
    conge_paye:'Congé payé', rtt:'RTT', maladie:'Arrêt maladie', sans_solde:'Sans solde', autre:'Autre'
  }
  const isAccepte = statut === 'accepte'
  const isAnnule = statut === 'annule'
  const color = isAccepte ? '#16a34a' : isAnnule ? '#6b7280' : '#dc2626'
  const bg = isAccepte ? '#f0fdf4' : isAnnule ? '#f3f4f6' : '#fef2f2'
  const border = isAccepte ? '#86efac' : isAnnule ? '#d1d5db' : '#fca5a5'
  const label = isAccepte ? 'Acceptée' : isAnnule ? 'Annulée' : 'Refusée'
  const subjectLabel = isAccepte ? 'accepté' : isAnnule ? 'annulé' : 'refusé'

  const d1 = new Date(dateDebut+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})
  const d2 = new Date(dateFin+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Demande de congé ${subjectLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
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
        <span style="background:${bg};color:${color};border:1px solid ${border};border-radius:4px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Congé ${subjectLabel}</span>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="background:#ffffff;padding:20px 48px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0C1A35;letter-spacing:-.5px;line-height:1.25">Demande de congé ${subjectLabel}</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.5">${TYPES[type] || type} — ${jours} jour${jours>1?'s':''}</p>
        <div style="width:48px;height:2px;background:#E11D48;margin-bottom:24px;border-radius:1px"></div>
        <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.8">Bonjour ${prenom},<br><br>Votre demande de congé a été <strong>${subjectLabel}e</strong> par votre responsable.</p>

        <!-- DATES -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px">
          <tr>
            <td colspan="2" style="background:#f8fafc;padding:12px 20px;border-bottom:1px solid #e2e8f0">
              <span style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase">Détails de la demande</span>
            </td>
          </tr>
          <tr>
            <td style="padding:11px 20px;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;width:140px">Type</td>
            <td style="padding:11px 20px;font-size:13px;color:#1e293b;font-weight:500;border-bottom:1px solid #f1f5f9">${TYPES[type] || type}</td>
          </tr>
          <tr>
            <td style="padding:11px 20px;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;width:140px">Du</td>
            <td style="padding:11px 20px;font-size:13px;color:#1e293b;font-weight:500;border-bottom:1px solid #f1f5f9">${d1}</td>
          </tr>
          <tr>
            <td style="padding:11px 20px;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;width:140px">Au</td>
            <td style="padding:11px 20px;font-size:13px;color:#1e293b;font-weight:500;border-bottom:1px solid #f1f5f9">${d2}</td>
          </tr>
          <tr>
            <td style="padding:11px 20px;font-size:13px;color:#94a3b8;width:140px">Durée</td>
            <td style="padding:11px 20px;font-size:13px;color:#1e293b;font-weight:700">${jours} jour${jours>1?'s':''}</td>
          </tr>
        </table>

        ${commentaire ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px">
          <tr>
            <td style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px">
              <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase">Commentaire du responsable</p>
              <p style="margin:0;font-size:13px;color:#1e293b;line-height:1.6">${commentaire}</p>
            </td>
          </tr>
        </table>` : ''}

        <!-- SUPPORT -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
                Une question ? Contactez votre responsable ou notre équipe :<br>
                <a href="mailto:contact@switzerit.com" style="color:#E11D48;text-decoration:none;font-weight:600">contact@switzerit.com</a>
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
            <td><p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">Cet email a été envoyé automatiquement suite à une action sur votre compte Varman.</p></td>
            <td align="right" style="vertical-align:top;white-space:nowrap;padding-left:16px"><p style="margin:0;font-size:12px;color:#cbd5e1">🇨🇭 Suisse</p></td>
          </tr>
          <tr><td colspan="2" style="padding-top:14px;border-top:1px solid #e2e8f0"></td></tr>
          <tr>
            <td colspan="2"><p style="margin:0;font-size:11px;color:#cbd5e1">© 2026 Varman by SwitzerIT &nbsp;&bull;&nbsp; <a href="https://varman.ch/legal" style="color:#cbd5e1;text-decoration:none">CGU</a> &nbsp;&bull;&nbsp; <a href="https://varman.ch/contact" style="color:#cbd5e1;text-decoration:none">Contact</a></p></td>
          </tr>
        </table>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json()
    const { type } = body

    if (type === 'conge') {
      const { to, prenom, type_conge, statut, date_debut, date_fin, jours, commentaire } = body
      const label = statut === 'accepte' ? 'accepté' : statut === 'annule' ? 'annulé' : 'refusé'
      const subject = `Votre congé a été ${label} — Varman`
      const html = templateConge(type_conge, statut, date_debut, date_fin, jours, commentaire||'', prenom)
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
