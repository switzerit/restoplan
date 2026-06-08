import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://restoplan.vercel.app'
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!

    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users?.users?.find(u => u.email === email)
    if(existingUser) return new Response(JSON.stringify({ error: 'EMAIL_EXISTS' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

    let userId: string
    let finalEmpId = employe_id

    // Créer le compte avec mot de passe temporaire ou fourni
    const tempPassword = password && password.trim() !== '' ? password : 'VarmanTmp2026!'
    const { data: createData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true
    })
    if(authError) throw authError
    userId = createData.user.id

    if(skip_employe) {
      await supabaseAdmin.from('profils').insert({ user_id: userId, role: 'employe', employe_id })
    } else {
      if(!prenom||!nom||!restaurant_id) throw new Error('Champs manquants')
      const { data: emp, error: empError } = await supabaseAdmin
        .from('employes').insert({ prenom, nom, email, role, restaurant_id }).select().single()
      if(empError) throw empError
      finalEmpId = emp.id
      await supabaseAdmin.from('profils').insert({ user_id: userId, role: 'employe', employe_id: finalEmpId })
    }

    // Générer lien reset password et envoyer via Resend - seulement pour les employés (pas les gérants)
    if((!password || password.trim() === '' || password === 'VarmanTmp2026!') && !skip_employe) {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery', email,
        options: { redirectTo: SITE_URL + '/login' }
      })
      if(!linkError && linkData) {
        const inviteUrl = linkData.properties.action_link
        // Récupérer infos restaurant
        let restoNom = ''
        if(restaurant_id) {
          const { data: resto } = await supabaseAdmin.from('restaurants').select('nom').eq('id', restaurant_id).single()
          restoNom = resto?.nom || ''
        } else if(employe_id) {
          const { data: emp } = await supabaseAdmin.from('employes').select('restaurant_id').eq('id', employe_id).single()
          if(emp?.restaurant_id) {
            const { data: resto } = await supabaseAdmin.from('restaurants').select('nom').eq('id', emp.restaurant_id).single()
            restoNom = resto?.nom || ''
          }
        }

        const html = `<!DOCTYPE html>
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
      <p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,.4);letter-spacing:.06em;text-transform:uppercase">Gestion d'équipe professionnelle</p>
    </td>
  </tr>
  <tr>
    <td style="background:#ffffff;padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
      <span style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;border-radius:4px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Invitation employé</span>
      <h1 style="margin:20px 0 8px;font-size:24px;font-weight:700;color:#0C1A35;letter-spacing:-.5px">
        Bienvenue${prenom ? ', '+prenom : ''} 👋
      </h1>
      <p style="margin:0 0 8px;font-size:14px;color:#94a3b8">Votre espace employé est prêt.</p>
      <div style="width:40px;height:2px;background:#E11D48;margin:16px 0;border-radius:1px"></div>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.8">
        ${restoNom ? `<strong>${restoNom}</strong> vous a ajouté sur Varman.` : 'Vous avez été ajouté sur Varman.'}<br>
        Définissez votre mot de passe pour accéder à votre planning, vos horaires et pointages.
      </p>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px">
        <tr><td align="center" style="background:#E11D48;border-radius:8px">
          <a href="${inviteUrl}" style="display:block;padding:15px 40px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">Créer mon mot de passe &rarr;</a>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px">
        <tr><td style="padding:12px 20px 8px"><span style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase">Vos informations</span></td></tr>
        <tr><td style="padding:0 20px">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#94a3b8;width:120px">Email</td>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#1e293b">${email}</td>
            </tr>
            ${restoNom ? `<tr>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#94a3b8">Établissement</td>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#1e293b">${restoNom}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#94a3b8">Application</td>
              <td style="padding:8px 0"><a href="${SITE_URL}" style="font-size:13px;font-weight:600;color:#E11D48;text-decoration:none">${SITE_URL.replace('https://','')}</a></td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 20px 12px"></td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px">
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
            Une question ? Contactez votre responsable ou notre équipe :<br>
            <a href="mailto:contact@switzerit.com" style="color:#E11D48;text-decoration:none;font-weight:600">contact@switzerit.com</a>
          </p>
        </td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:18px 40px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td><p style="margin:0;font-size:12px;color:#94a3b8">Cet email a été envoyé à <strong>${email}</strong>.<br>Si vous n'attendiez pas cet email, ignorez-le.</p></td>
          <td align="right"><p style="margin:0;font-size:12px;color:#cbd5e1">🇨🇭 Suisse</p></td>
        </tr>
        <tr><td colspan="2" style="padding-top:12px;border-top:1px solid #e2e8f0;margin-top:12px"></td></tr>
        <tr><td colspan="2"><p style="margin:0;font-size:11px;color:#cbd5e1">© 2026 Varman by SwitzerIT &nbsp;&bull;&nbsp; <a href="${SITE_URL}/legal" style="color:#cbd5e1;text-decoration:none">CGU</a> &nbsp;&bull;&nbsp; <a href="${SITE_URL}/contact" style="color:#cbd5e1;text-decoration:none">Contact</a></p></td></tr>
      </table>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Varman <noreply@switzerit.com>',
            to: [email],
            subject: `${restoNom ? restoNom + ' — ' : ''}Votre invitation Varman`,
            html
          })
        })
      }
    }

    return new Response(JSON.stringify({ success: true, employe_id: finalEmpId, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
