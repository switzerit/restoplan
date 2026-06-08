import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { email, user_id } = await req.json()
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    let uid = user_id
    if(!uid && email) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === email)
      if(!user) throw new Error('Utilisateur non trouvé')
      uid = user.id
    }
    if(!uid) throw new Error('user_id ou email requis')
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid)
    if(error) throw error
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch(error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
