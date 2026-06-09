import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sendEmail(resendKey: string, to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Varman <noreply@switzerit.com>', to: [to], subject, html })
  })
}

function emailHtml(titre: string, badge: string, intro: string, ctaUrl: string, ctaText: string, email: string, restoNom: string, siteUrl: string) {
  const infoRows = [
    ['Email', email],
    ...(restoNom ? [['Établissement', restoNom]] : []),
    ['Application', siteUrl.replace('https://','')],
  ]
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
  <tr>
    <td align="center" style="background:#0C1A35;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr valign="bottom">
        <td style="font-size:32px;font-weight:900;letter-spacing:-1px;color:#ffffff">varman</td>
        <td style="padding-bottom:4px;padding-left:3px"><div style="width:9px;height:9px;background:#E11D48;border-radius:50%"></div></td>
      </tr></table>
      <p style="margin:10px 0 0;font-size:11px;color:rgba(255,255,255,.4);letter-spacing:.08em;text-transform:uppercase">Gestion d'équipe professionnelle</p>
    </td>
  </tr>
  <tr>
    <td style="background:#ffffff;padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px"><tr>
        <td style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;border-radius:4px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase">${badge}</td>
      </tr></table>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0C1A35;letter-spacing:-.5px">${titre}</h1>
      <div style="width:40px;height:2px;background:#E11D48;margin:16px 0;border-radius:1px"></div>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.8">${intro}</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px">
        <tr><td align="center" style="background:#E11D48;border-radius:8px">
          <a href="${ctaUrl}" style="display:block;padding:15px 40px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${ctaText} &rarr;</a>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px">
        <tr><td colspan="2" style="background:#f8fafc;padding:12px 20px;border-bottom:1px solid #e2e8f0">
          <span style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase">Vos informations</span>
        </td></tr>
        ${infoRows.map(([label, val], i) => `
        <tr>
          <td style="padding:10px 20px;font-size:13px;color:#94a3b8;border-bottom:${i<infoRows.length-1?'1px solid #f1f5f9':'none'};width:130px;vertical-align:top">${label}</td>
          <td style="padding:10px 20px;font-size:13px;color:#1e293b;font-weight:500;border-bottom:${i<infoRows.length-1?'1px solid #f1f5f9':'none'};vertical-align:top">${val}</td>
        </tr>`).join('')}
      </table>
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px">
        <tr><td style="padding:14px 20px">
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
            Une question ? Contactez votre responsable ou notre équipe :<br>
            <a href="mailto:contact@switzerit.com" style="color:#E11D48;text-decoration:none;font-weight:600">contact@switzerit.com</a>
          </p>
        </td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td><p style="margin:0;font-size:12px;color:#94a3b8">Cet email a été envoyé à <strong>${email}</strong>.<br>${ctaText.includes('initi') ? "Si vous n\'avez pas demandé cette réinitialisation, ignorez-le." : "Si vous n\'attendiez pas cet email, ignorez-le."}</p></td>
          <td align="right"><p style="margin:0;font-size:12px;color:#cbd5e1">🇨🇭 Suisse</p></td>
        </tr>
        <tr><td colspan="2" style="padding-top:12px;border-top:1px solid #e2e8f0;margin-top:12px"></td></tr>
        <tr><td colspan="2"><p style="margin:0;font-size:11px;color:#cbd5e1">© 2026 Varman by SwitzerIT &nbsp;&bull;&nbsp; <a href="${siteUrl}/legal" style="color:#cbd5e1;text-decoration:none">CGU</a> &nbsp;&bull;&nbsp; <a href="${siteUrl}/contact" style="color:#cbd5e1;text-decoration:none">Contact</a></p></td></tr>
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
    const { prenom, nom, email, password, role, restaurant_id, skip_employe, employe_id } = await req.json()
    if(!email) throw new Error('Email requis')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://varman.ch'
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!

    // Vérifier si l'utilisateur existe déjà
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users?.users?.find(u => u.email === email)

    if(existingUser) {
      // Utilisateur existant → envoyer lien reset ou invitation selon connexion
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery', email,
        options: { redirectTo: SITE_URL + '/login' }
      })

      if(linkData) {
        // Récupérer infos employé
        let prenomEmp = '', gerantNom = '', restoNom = '', dejaConnecte = false
        if(employe_id) {
          const { data: emp2 } = await supabaseAdmin.from('employes')
            .select('prenom,nom,derniere_connexion,restaurant_id').eq('id', employe_id).single()
          prenomEmp = emp2?.prenom || ''
          dejaConnecte = !!emp2?.derniere_connexion
          if(emp2?.restaurant_id) {
            const { data: resto } = await supabaseAdmin.from('restaurants')
              .select('nom,gerant_id').eq('id', emp2.restaurant_id).single()
            restoNom = resto?.nom || ''
            if(resto?.gerant_id) {
              const { data: g } = await supabaseAdmin.from('gerants')
                .select('prenom,nom').eq('user_id', resto.gerant_id).single()
              if(g) gerantNom = (g.prenom || '') + (g.nom ? ' ' + g.nom : '')
            }
          }
        }

        if(dejaConnecte) {
          // A déjà utilisé l'app → email reset password
          await sendEmail(RESEND_KEY, email,
            'Réinitialisation de votre mot de passe Varman',
            emailHtml(
              `Réinitialisation 🔑`,
              'Réinitialisation de mot de passe',
              `Bonjour${prenomEmp ? ' ' + prenomEmp : ''},<br>Vous avez demandé à réinitialiser votre mot de passe Varman.<br>Cliquez ci-dessous pour choisir un nouveau mot de passe.`,
              linkData.properties.action_link,
              'Réinitialiser mon mot de passe',
              email, restoNom, SITE_URL
            )
          )
        } else {
          // Jamais connecté → même email que l'invitation initiale
          await sendEmail(RESEND_KEY, email,
            `Bienvenue sur Varman${prenomEmp ? ', ' + prenomEmp : ''} — Créez votre mot de passe`,
            emailHtml(
              `Bienvenue${prenomEmp ? ', ' + prenomEmp : ''} 👋`,
              'Invitation employé',
              `${gerantNom ? '<strong>' + gerantNom + '</strong> vous a ajouté sur Varman.' : 'Vous avez été ajouté sur Varman.'}<br>Définissez votre mot de passe pour accéder à votre planning, vos horaires et pointages.`,
              linkData.properties.action_link,
              'Créer mon mot de passe',
              email, restoNom, SITE_URL
            )
          )
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Nouvel utilisateur → créer le compte
    let userId: string
    let finalEmpId = employe_id
    const tempPassword = password && password.trim() !== '' ? password : 'VarmanTmp2026!'
    const { data: createData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true
    })
    if(authError) throw authError
    userId = createData.user.id

    if(skip_employe) {
      await supabaseAdmin.from('profils').insert({ user_id: userId, role: 'employe', employe_id })
    } else {
      if(!prenom || !nom || !restaurant_id) throw new Error('Champs manquants')
      const { data: emp, error: empError } = await supabaseAdmin
        .from('employes').insert({ prenom, nom, email, role, restaurant_id }).select().single()
      if(empError) throw empError
      finalEmpId = emp.id
      await supabaseAdmin.from('profils').insert({ user_id: userId, role: 'employe', employe_id: finalEmpId })
    }

    // Envoyer email invitation si pas de vrai mot de passe ET c'est un employé (pas un gérant)
    if(!password || password.trim() === '') {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery', email,
        options: { redirectTo: SITE_URL + '/login' }
      })

      if(linkData) {
        let prenomEmp = prenom || '', gerantNom = '', restoNom = ''
        const rid = restaurant_id || (finalEmpId ? (await supabaseAdmin.from('employes').select('restaurant_id').eq('id', finalEmpId).single()).data?.restaurant_id : null)
        if(rid) {
          const { data: resto } = await supabaseAdmin.from('restaurants').select('nom,gerant_id').eq('id', rid).single()
          restoNom = resto?.nom || ''
          if(resto?.gerant_id) {
            const { data: g } = await supabaseAdmin.from('gerants').select('prenom,nom').eq('user_id', resto.gerant_id).single()
            if(g) gerantNom = (g.prenom || '') + (g.nom ? ' ' + g.nom : '')
          }
        }

        await sendEmail(RESEND_KEY, email,
          `Bienvenue sur Varman${prenomEmp ? ', ' + prenomEmp : ''} — Créez votre mot de passe`,
          emailHtml(
            `Bienvenue${prenomEmp ? ', ' + prenomEmp : ''} 👋`,
            'Invitation employé',
            `${gerantNom ? '<strong>' + gerantNom + '</strong> vous a ajouté sur Varman.' : 'Vous avez été ajouté sur Varman.'}<br>Définissez votre mot de passe pour accéder à votre planning, vos horaires et pointages.`,
            linkData.properties.action_link,
            'Créer mon mot de passe',
            email, restoNom, SITE_URL
          )
        )
      }
    }

    return new Response(JSON.stringify({ success: true, employe_id: finalEmpId, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
