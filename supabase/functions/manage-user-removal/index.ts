// Supabase Edge Function: manage-user-removal
// Keep the service-role key on the server. Deploy with JWT verification enabled.
// REVIEW BUILD ONLY: test in staging before replacing the production function.
import { createClient } from "@supabase/supabase-js";

const OWNER_AUTH_ID = "efd4f725-d34a-4438-bc15-8ee410c9d5a9";
const OWNER_EMAIL = "alinasr99f@gmail.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ACTIVITY_TABLES = [
  ["activity_logs", "user_id"], ["accounts", "created_by"],
  ["building_apartments", "created_by"], ["building_state", "created_by"],
  ["building_transactions", "created_by"], ["buildings", "created_by"],
  ["categories", "created_by"], ["expense_items", "created_by"],
  ["expense_stages", "created_by"], ["expenses", "created_by"],
  ["funding", "created_by"], ["payment_methods", "created_by"],
  ["project_material_plans", "created_by"], ["project_material_usage", "created_by"],
  ["project_villas", "created_by"], ["projects", "created_by"],
  ["residential_apartments", "created_by"], ["residential_contracts", "created_by"],
  ["residential_tenants", "created_by"], ["suppliers", "created_by"],
  ["tenant_leases", "created_by"], ["tenants", "created_by"],
  ["building_state_backup_20261012", "created_by"],
  ["building_state_backup_before_number_fix_20261012", "created_by"],
] as const;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) return json(500, { error: "Missing server configuration" });

    const bearer = request.headers.get("Authorization") ?? "";
    if (!bearer.startsWith("Bearer ")) return json(401, { error: "Authentication required" });
    const token = bearer.slice(7);
    const authClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: verified, error: verifyError } = await authClient.auth.getUser(token);
    if (verifyError || !verified.user) return json(401, { error: "Invalid session" });

    const admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: actor, error: actorError } = await admin.from("users")
      .select("id, role, active, permissions, auth_user_id")
      .eq("auth_user_id", verified.user.id).maybeSingle();
    if (actorError) {
      console.error("Unable to load acting user:", actorError.message, actorError.code);
      return json(500, { error: "Unable to verify account status; check Edge Function logs" });
    }
    if (!actor) return json(403, { error: "Account not registered" });
    if (actor.auth_user_id !== verified.user.id) return json(403, { error: "Account identity mismatch" });
    if (actor.active !== true) return json(403, { error: "Account disabled" });
    const isOwner = verified.user.id === OWNER_AUTH_ID &&
      verified.user.email?.trim().toLowerCase() === OWNER_EMAIL;
    if (!isOwner && actor.permissions?.users_delete !== true) {
      return json(403, { error: "Permission denied" });
    }

    let body: unknown;
    try { body = await request.json(); }
    catch { return json(400, { error: "Invalid JSON" }); }
    const targetId = (body as { targetUserId?: unknown } | null)?.targetUserId;
    if (typeof targetId !== "number" || !Number.isSafeInteger(targetId) || targetId < 1) {
      return json(400, { error: "Invalid user ID" });
    }

    const { data: target, error: targetError } = await admin.from("users")
      .select("id, role, email, auth_user_id, active")
      .eq("id", targetId).maybeSingle();
    if (targetError || !target) return json(404, { error: "User not found" });
    if (target.id === 1 || target.id === actor.id || target.auth_user_id === OWNER_AUTH_ID ||
        target.email?.trim().toLowerCase() === OWNER_EMAIL || target.role === "مسؤول النظام") {
      return json(403, { error: "Protected account" });
    }
    if (!target.auth_user_id) {
      return json(409, { error: "Auth identity not linked; manual review required" });
    }

    // Tenant authorization is server-side. Never trust a tenant ID from the request.
    // Platform owner may administer across tenants; everyone else must have exactly
    // one active membership and the target must belong exclusively to that tenant.
    // A globally disabled/banned Auth identity affects ALL tenants, so reject any
    // target with multiple memberships (even inactive ones) pending a tenant-scoped
    // deactivation design.
    if (!isOwner) {
      const { data: actorMemberships, error: actorMembershipError } = await admin
        .from("tenant_memberships")
        .select("tenant_id, role, active")
        .eq("user_id", verified.user.id);
      if (actorMembershipError || !actorMemberships) {
        console.error("Unable to verify actor memberships:", actorMembershipError);
        return json(500, { error: "Unable to verify company membership" });
      }
      const activeActorMemberships = actorMemberships.filter((m) => m.active === true);
      if (activeActorMemberships.length !== 1) {
        return json(403, { error: "Exactly one active company membership is required" });
      }
      const actorTenantId = activeActorMemberships[0].tenant_id;

      const { data: targetMemberships, error: targetMembershipError } = await admin
        .from("tenant_memberships")
        .select("tenant_id, role, active")
        .eq("user_id", target.auth_user_id);
      if (targetMembershipError || !targetMemberships) {
        console.error("Unable to verify target memberships:", targetMembershipError);
        return json(500, { error: "Unable to verify target company" });
      }
      if (targetMemberships.length !== 1 ||
          targetMemberships[0].active !== true ||
          targetMemberships[0].tenant_id !== actorTenantId) {
        return json(403, { error: "Target is not exclusively in your active company" });
      }

      const { data: tenant, error: tenantError } = await admin
        .from("platform_tenants")
        .select("id, status")
        .eq("id", actorTenantId)
        .maybeSingle();
      if (tenantError || !tenant || tenant.status !== "active") {
        return json(403, { error: "Company is not active or could not be verified" });
      }

      // Company administrators cannot disable another system administrator,
      // nor the company's owner membership. Only the central platform owner can.
      if (target.role === "مدير النظام" || targetMemberships[0].role === "owner") {
        return json(403, { error: "Protected company administrator" });
      }
    }

    // Check every known history/reference table. An error must never permit deletion.
    let hasActivityOrUncertainty = false;
    let inspectionUncertain = false;
    for (const [table, column] of ACTIVITY_TABLES) {
      const { count, error } = await admin.from(table)
        .select(column, { count: "exact", head: true })
        .eq(column, target.auth_user_id);
      if (error) {
        console.error(`Unable to inspect ${table}.${column}:`, JSON.stringify({ message: error.message, code: error.code, details: error.details, hint: error.hint }));
        hasActivityOrUncertainty = true;
        inspectionUncertain = true;
        break;
      }
      if (count === null) {
        console.error(`Unable to inspect ${table}.${column}: count returned null without an error`);
        hasActivityOrUncertainty = true;
        inspectionUncertain = true;
        break;
      }
      if (count > 0) {
        hasActivityOrUncertainty = true;
        break;
      }
    }

    // Disable app access first, even if Auth later fails. Never claim success on partial failure.
    const { error: disableError } = await admin.from("users")
      .update({ active: false }).eq("id", target.id);
    if (disableError) return json(500, { error: "Unable to disable database account" });

    const { error: banError } = await admin.auth.admin.updateUserById(target.auth_user_id, {
      ban_duration: "876000h",
    });
    if (banError) {
      console.error("Unable to ban Auth user:", banError.message);
      return json(500, { error: "Database account disabled, but Auth ban failed; review required" });
    }

    // Safety gate: historical activity tracking is not yet comprehensive.
    // Never permanently delete an account until server-side auditing is complete.
    // Existing access records are retained for possible review and reactivation.
    return json(200, {
      success: true,
      action: "deactivated",
      reason: inspectionUncertain
        ? "inspection_incomplete"
        : hasActivityOrUncertainty
          ? "activity_found"
          : "audit_not_ready",
    });
  } catch (error) {
    console.error("manage-user-removal failed:", error);
    return json(500, { error: "Unexpected server error" });
  }
});
