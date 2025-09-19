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

    // Parse query parameters
    const url = new URL(req.url);
    const roleFilter = url.searchParams.get('role');
    const sortBy = url.searchParams.get('sortBy'); // e.g., 'first_name', 'email', 'role'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'; // 'asc' or 'desc'

    // Fetch all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error listing auth users:', authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Fetch profiles, applying role filter if present
    let profilesQuery = supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, role, avatar_url'); // Include avatar_url for consistency

    if (roleFilter && roleFilter !== 'all') {
      profilesQuery = profilesQuery.eq('role', roleFilter);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(JSON.stringify({ error: profilesError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Map profiles by ID for easy lookup
    const profilesMap = new Map(profiles.map(p => [p.id, p]));

    // Combine auth user data with profile data
    let usersWithProfiles = authUsers.users.map(authUser => {
      const profile = profilesMap.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        role: profile?.role || 'client', // Default role if not found in profile
        avatar_url: profile?.avatar_url || null,
      };
    });

    // Apply sorting
    if (sortBy) {
      usersWithProfiles.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortBy === 'email') {
          valA = a.email?.toLowerCase() || '';
          valB = b.email?.toLowerCase() || '';
        } else if (sortBy === 'first_name') {
          valA = a.first_name?.toLowerCase() || '';
          valB = b.first_name?.toLowerCase() || '';
        } else if (sortBy === 'last_name') {
          valA = a.last_name?.toLowerCase() || '';
          valB = b.last_name?.toLowerCase() || '';
        } else if (sortBy === 'role') {
          valA = a.role?.toLowerCase() || '';
          valB = b.role?.toLowerCase() || '';
        } else {
          return 0; // No valid sortBy, maintain original order
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return new Response(JSON.stringify(usersWithProfiles), {
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