# Tenant Deletion Function - Summary and Next Steps

## Goal

Successfully implement and deploy a Supabase Edge Function (`delete-tenant`) that securely deletes all data associated with a specific tenant upon request, ensuring proper cleanup of database records and user authentication entries.

## Work Completed

1.  **Initial Function Creation:** Scaffolding for the `delete-tenant` function was created in `supabase/functions/delete-tenant/index.ts`.
2.  **Authentication Logic:** Added logic to verify the requesting user's authentication status using their JWT.
3.  **Tenant ID Retrieval:** Implemented logic to retrieve the `tenant_id` from the authenticated user's metadata.
4.  **Service Role Client:** Added creation of a Supabase client using the `SUPABASE_SERVICE_ROLE_KEY` for performing privileged delete operations.
5.  **Deletion Logic Implementation:**
    *   Created an array `tablesToDeleteFrom` to list tables requiring cleanup.
    *   Added initial tables like `tickets`, `ticket_comments`, `service_forms`, `user_profiles`.
    *   Identified and commented out an incorrect table name (`service_form_submissions`).
    *   Investigated related services (`ServiceCatalogSettings.tsx`, `ticketService.ts`) to find more relevant tables.
    *   Added `service_catalog_items` and `service_catalog_categories` (identified via `ServiceCatalogSettings.tsx`) to the deletion list.
    *   Identified `ticket_history` (via `ticketService.ts`) as another likely candidate for deletion.
    *   Added logic to delete users belonging to the tenant from the `auth.users` table using the admin API.
    *   Added logic to delete the main tenant record from the `tenants` table.
6.  **CORS Handling:**
    *   Initially used a shared `cors.ts` file.
    *   Encountered deployment errors related to file paths.
    *   Inlined necessary CORS headers directly into `delete-tenant/index.ts` to resolve path issues during deployment attempts.
7.  **Deployment Attempts & Troubleshooting:**
    *   Attempted deployment using the `mcp0_deploy_edge_function` tool multiple times.
    *   Consistently encountered a `TypeError: File URL path must be absolute` error, even with a minimal "Hello World" test function. This points to a potential issue with the tool or its interaction with the Windows environment.
    *   Attempted deployment via the standard Supabase CLI (`supabase functions deploy ...`).
    *   Encountered `'supabase' is not recognized` errors, indicating the CLI is not installed correctly or its location is not in the system's PATH environment variable.

## Current Status & Code (`supabase/functions/delete-tenant/index.ts`)

*   The function contains the core logic for authenticating the user, identifying the tenant, and deleting data.
*   CORS headers are inlined.
*   The `tablesToDeleteFrom` array currently includes:
    *   `tickets`
    *   `ticket_comments`
    *   `ticket_history`
    *   `service_forms`
    *   `service_catalog_items`
    *   `service_catalog_categories`
    *   `user_profiles`
*   Placeholders/comments exist for:
    *   The correct service form *submission* table (still needs identification).
    *   Consideration of the `service_catalog_forms` table (which uses `organization_id` instead of `tenant_id`).
    *   ~~The `ticket_history` table (recommended addition).~~

## Remaining Blockers

1.  **Supabase CLI Path:** The `supabase` command is not recognized in the terminal. The CLI installation path needs to be added to the Windows System PATH environment variable, or the CLI needs reinstallation ensuring the PATH is updated.
2.  **Form Submission Table Identification:** The exact table storing submitted service catalog form data needs to be identified. If submissions are simply stored within `tickets` or `ticket_history`, this might be resolved by ensuring those are deleted.
3.  **`service_catalog_forms` Handling:** A decision is needed on whether to delete from the `service_catalog_forms` table and, if so, how to modify the deletion query to use `organization_id` for that specific table.

## Required Next Steps

1.  **Fix Supabase CLI:** Manually add the Supabase CLI installation directory to the Windows System PATH environment variable or reinstall the CLI.
2.  **Update Code (`index.ts`):**
    *   ~~**Add `ticket_history`:** Add `'ticket_history'` to the `tablesToDeleteFrom` array.~~
    *   **Identify/Add Submission Table:** Find the correct table name for service form submissions and add it to the array (replacing the placeholder comment).
    *   **Handle `service_catalog_forms` (If Necessary):** If deleting from `service_catalog_forms` is required, add it to the array and modify the `for` loop to include conditional logic: `if (table === 'service_catalog_forms') { /* delete using organization_id */ } else { /* delete using tenant_id */ }`.
3.  **Verify Environment Variables:** Double-check in the Supabase Dashboard (Settings -> Functions -> `delete-tenant`) that `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and especially `SUPABASE_SERVICE_ROLE_KEY` are correctly set.
4.  **Deploy via CLI:** Once the CLI is working (Step 1) and the code is finalized (Step 2), open a terminal in `c:\\Users\\User\\Deskwise` and run:
    ```bash
    supabase login # If needed
    supabase link --project-ref rqibbynjnfycbuersldk # If needed
    supabase functions deploy delete-tenant --no-verify-jwt --project-ref rqibbynjnfycbuersldk
    ```
5.  **Test Thoroughly:** After successful deployment, test the tenant deletion feature in your application. Check function logs in the Supabase Dashboard for errors and verify that all expected data (including service catalog items, categories, tickets, history, user profiles, auth users, tenant record, and form submissions) has been deleted from the database for the test tenant.