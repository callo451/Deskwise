// supabase/functions/delete-tenant/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inlined CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict this to your frontend domain in production!
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST for the function and OPTIONS for preflight
};

console.log('Delete Tenant function booting up...');

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create Supabase client for user authentication
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Get the authenticated user and their tenant_id
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth Error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Assuming user metadata contains tenant_id. Adjust if stored differently.
    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
        console.error('Tenant ID missing for user:', user.id);
        return new Response(JSON.stringify({ error: 'Unauthorized: Tenant ID not found for user' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403, // Forbidden might be more appropriate than Unauthorized
        });
    }

     // OPTIONAL: Add role check here if necessary (e.g., ensure user is tenant admin)
     /*
     const { data: profile, error: profileError } = await userSupabaseClient
      .from('user_profiles') // Or your profiles table
      .select('role')
      .eq('user_id', user.id)
      .single();
     
     if (profileError || !profile || profile.role !== 'admin') { // Adjust role check as needed
       console.error('Permission Denied:', profileError || 'User not admin');
       return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 403,
       });
     }
     */

    console.log(`Initiating deletion for tenant ID: ${tenantId} by user: ${user.id}`);

    // 3. Create Supabase client with SERVICE ROLE for deletion operations
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Perform deletion logic (order matters due to foreign key constraints)
    console.log(`Deleting related data for tenant: ${tenantId}...`);
    // IMPORTANT: Update this list with ALL tables related to a tenant!
    const tablesToDeleteFrom = [
      'tickets', 'ticket_comments', // Example ticket tables
      'ticket_history', // Added based on ticketService.ts review
      // 'service_form_submissions', // REMOVED: Still need to find the actual submission table!
      'service_forms', 'service_catalog_items', 'service_catalog_categories', // Added SC definition tables
      'user_profiles', // Profiles linked to users in the tenant
      // TODO: Add ALL other tables that have a tenant_id or related foreign key
      // TODO: Consider 'service_catalog_forms' - it uses 'organization_id'. If needed, add it and modify the query below to use .eq('organization_id', tenantId) for that table.
    ];

    for (const table of tablesToDeleteFrom) {
       console.log(`Deleting from ${table}...`);
       // Use RLS bypass with service role if needed, but delete with where clause is typical
       const { error: deleteError } = await adminSupabaseClient
         .from(table)
         .delete()
         .eq('tenant_id', tenantId); // Assuming 'tenant_id' column exists in these tables

       if (deleteError) {
         console.error(`Error deleting from ${table}:`, deleteError);
         return new Response(JSON.stringify({ error: `Failed to delete data from ${table}: ${deleteError.message}` }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: 500,
         });
       }
    }

    // b. Delete users belonging to the tenant (Auth Schema)
    console.log(`Deleting users for tenant: ${tenantId}...`);
    // Listing all users and filtering is inefficient but often necessary if filtering by metadata isn't directly supported.
    // Consider alternative approaches if performance is critical (e.g., storing user IDs in the tenant table).
    const { data: listUsersData, error: usersError } = await adminSupabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Adjust perPage as needed, handle pagination if > 1000 users per tenant expected
    });

    if (usersError) {
        console.error('Error listing users:', usersError);
        return new Response(JSON.stringify({ error: `Failed to list users: ${usersError.message}` }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: 500,
         });
    }

    // Filter users belonging to the target tenant based on metadata
    const usersToDelete = listUsersData.users.filter(u => u.user_metadata?.tenant_id === tenantId);

    for (const tenantUser of usersToDelete) {
        console.log(`Deleting user: ${tenantUser.id}`);
        const { error: deleteUserError } = await adminSupabaseClient.auth.admin.deleteUser(tenantUser.id);
        if (deleteUserError) {
            console.error(`Error deleting user ${tenantUser.id}:`, deleteUserError);
            // Log and continue might orphan data; stopping is safer.
            return new Response(JSON.stringify({ error: `Failed to delete user ${tenantUser.id}: ${deleteUserError.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            });
        }
    }

    // c. Delete the tenant record itself (from your 'tenants' table)
    console.log(`Deleting tenant record: ${tenantId}...`);
    const { error: deleteTenantError } = await adminSupabaseClient
      .from('tenants') // Assuming 'tenants' table
      .delete()
      .eq('id', tenantId); // Assuming 'id' is the primary key

    if (deleteTenantError) {
      console.error('Error deleting tenant record:', deleteTenantError);
      return new Response(JSON.stringify({ error: `Failed to delete tenant record: ${deleteTenantError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Tenant ${tenantId} deleted successfully.`);

    // 5. Return success response
    return new Response(JSON.stringify({ message: 'Tenant deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected Error:', error);
    // Ensure error is stringified properly
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
