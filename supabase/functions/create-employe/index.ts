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

function emailHtml(titre: string, intro: string, ctaUrl: string, ctaText: string) {
  return `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:40px auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#0C1A35">varman</span>
      <span style="width:8px;height:8px;background:#E11D48;border-radius:50%;display:inline-block;margin-left:2px;vertical-align:middle"></span>
    </div>
    <h2 style="color:#0C1A35;margin-bottom:12px">${titre}</h2>
    <p style="color:#64748b;line-height:1.7;margin-bottom:28px">${intro}</p>
    <a href="${ctaUrl}" style="display:block;text-align:center;background:#E11D48;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;margin-bottom:16px">${ctaText}</a>
    <p style="color:#94a3b8;font-size:12px;text-align:center">Ce lien expire dans 24h.</p>
  </div>`
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
              'Réinitialisation de mot de passe',
              `Bonjour${prenomEmp ? ' ' + prenomEmp : ''},<br>Cliquez ci-dessous pour réinitialiser votre mot de passe Varman.`,
              linkData.properties.action_link,
              'Réinitialiser mon mot de passe →'
            )
          )
        } else {
          // Jamais connecté → même email que l'invitation initiale
          await sendEmail(RESEND_KEY, email,
            `Bienvenue sur Varman${prenomEmp ? ', ' + prenomEmp : ''} — Créez votre mot de passe`,
            emailHtml(
              `Bienvenue${prenomEmp ? ', ' + prenomEmp : ''} 👋`,
              `${gerantNom ? '<strong>' + gerantNom + '</strong> vous a ajouté sur Varman.' : 'Vous avez été ajouté sur Varman.'}<br>${restoNom ? 'Établissement : <strong>' + restoNom + '</strong><br>' : ''}Définissez votre mot de passe pour accéder à votre planning.`,
              linkData.properties.action_link,
              'Créer mon mot de passe →'
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

    // Envoyer email invitation si pas de vrai mot de passe
    if(!password || password.trim() === '' || password === 'VarmanTmp2026!') {
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
            `${gerantNom ? '<strong>' + gerantNom + '</strong> vous a ajouté sur Varman.' : 'Vous avez été ajouté sur Varman.'}<br>${restoNom ? 'Établissement : <strong>' + restoNom + '</strong><br>' : ''}Définissez votre mot de passe pour accéder à votre planning.`,
            linkData.properties.action_link,
            'Créer mon mot de passe →'
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
