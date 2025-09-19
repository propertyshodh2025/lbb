import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, first_name, last_name, role } = await req.json();

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Email, password, and role are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create the user in Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
      user_metadata: { first_name, last_name }, // Store in user_metadata for handle_new_user trigger
    });

    if (userError) {
      console.error('Error creating auth user:', userError);
      return new Response(JSON.stringify({ error: userError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // The handle_new_user trigger will create the basic profile.
    // Now, update the role for the newly created profile.
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ role, first_name, last_name }) // Update with provided first_name, last_name, and role
      .eq('id', userData.user.id);

    if (profileUpdateError) {
      console.error('Error updating profile role:', profileUpdateError);
      // Even if profile update fails, the user is created, so we might want to log and proceed or revert
      return new Response(JSON.stringify({ error: `User created, but failed to set role: ${profileUpdateError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'User created successfully', userId: userData.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});