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
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users?.users?.find(u => u.email === email)
    let userId: string
    let finalEmpId = employe_id
    if(existingUser){
      throw new Error('Un compte avec cet email existe déjà')
    } else {
      let authData: any
      // Si pas de password → invitation par lien (l'employé définit son propre mdp)
      if(!password || password.trim() === ''){
        const { data: invData, error: invError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: (Deno.env.get('SITE_URL') || 'https://restoplan.vercel.app') + '/login'
        })
        if(invError) throw invError
        authData = invData
      } else {
        const { data: createData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email, password, email_confirm: true
        })
        if(authError) throw authError
        authData = createData
      }
      userId = authData.user.id
      if(skip_employe){
        // L'employé existe déjà dans la table — on crée juste le profil avec son employe_id
        await supabaseAdmin.from('profils').insert({
          user_id: userId,
          role: 'employe',
          employe_id: employe_id
        })
      } else {
        // Créer l'employé dans la table puis le profil
        if(!prenom||!nom||!restaurant_id) throw new Error('Champs manquants')
        const { data: emp, error: empError } = await supabaseAdmin
          .from('employes')
          .insert({ prenom, nom, email, role, restaurant_id })
          .select().single()
        if(empError) throw empError
        finalEmpId = emp.id
        await supabaseAdmin.from('profils').insert({
          user_id: userId,
          role: 'employe',
          employe_id: finalEmpId
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
