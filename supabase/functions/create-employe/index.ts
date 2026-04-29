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
    if(!email||!password) throw new Error('Email et mot de passe requis')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users?.users?.find(u => u.email === email)

    let userId: string
    let finalEmpId = employe_id

    if(existingUser){
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password })
      if(error) throw error
      userId = existingUser.id
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true
      })
      if(authError) throw authError
      userId = authData.user.id

      if(!skip_employe){
        if(!prenom||!nom||!restaurant_id) throw new Error('Champs manquants')
        const { data: emp, error: empError } = await supabaseAdmin
          .from('employes')
          .insert({ prenom, nom, email, role, restaurant_id })
          .select().single()
        if(empError) throw empError
        finalEmpId = emp.id
      }

      if(!finalEmpId) throw new Error('employe_id manquant')

      await supabaseAdmin.from('profils').insert({
        user_id: userId,
        role: 'employe',
        employe_id: finalEmpId
      })
    }

    return new Response(JSON.stringify({ success: true, employe_id: finalEmpId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

