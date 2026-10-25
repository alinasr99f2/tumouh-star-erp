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


type RpcError = { message: string; code?: string; details?: string; hint?: string };
type RpcResult = { data: unknown; error: RpcError | null };
type RpcClient = {
  rpc: (functionName: string, args?: Record<string, unknown>) => PromiseLike<RpcResult>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const ACTIVITY_TABLES = [
  ["expense_excel_import_batches", "created_by"],
  ["residential_bookings", "created_by"],
  ["residential_booking_payments", "created_by"],
  ["residential_charges", "created_by"],
  ["residential_charge_payments", "created_by"],
  ["residential_rent_receipts", "created_by"],
  ["residential_rooms", "created_by"],
  ["residential_room_contracts", "created_by"],
  ["residential_room_bookings", "created_by"],
  ["residential_room_booking_payments", "created_by"],
  ["residential_room_charges", "created_by"],
  ["residential_room_charge_payments", "created_by"],
  ["residential_room_receipts", "created_by"],
  ["activity_logs", "user_id"],
  ["accounts", "created_by"],
  ["building_apartments", "created_by"],
  ["building_state", "created_by"],
  ["building_transactions", "created_by"],
  ["buildings", "created_by"],
  ["categories", "created_by"],
  ["expense_items", "created_by"],
  ["expense_stages", "created_by"],
  ["expenses", "created_by"],
  ["funding", "created_by"],
  ["payment_methods", "created_by"],
  ["project_material_plans", "created_by"],
  ["project_material_usage", "created_by"],
  ["project_villas", "created_by"],
  ["projects", "created_by"],
  ["residential_apartments", "created_by"],
  ["residential_contracts", "created_by"],
  ["residential_tenants", "created_by"],
  ["suppliers", "created_by"],
  ["tenant_leases", "created_by"],
  ["tenants", "created_by"],
  ["building_state_backup_20261012", "created_by"],
  ["building_state_backup_before_number_fix_20261012", "created_by"],
] as const;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

async function releaseLease(
  admin: unknown,
  operationId: string,
  leaseToken: string,
  message: string,
) {
  const { error } = await (admin as unknown as RpcClient).rpc("release_user_deactivation_lease", {
    p_operation_id: operationId,
    p_lease_token: leaseToken,
    p_error: message,
  });
  if (error) {
    console.error("Unable to release deactivation lease:", {
      operationId,
      message: error.message,
      code: error.code,
    });
    return false;
  }
  return true;
}

async function recordProgress(
  admin: unknown,
  operationId: string,
  leaseToken: string,
  appDisabled: boolean,
  authBanned: boolean,
  errorMessage: string | null,
) {
  const { data, error } = await (admin as unknown as RpcClient).rpc("update_user_deactivation_progress", {
    p_operation_id: operationId,
    p_lease_token: leaseToken,
    p_app_disabled: appDisabled,
    p_auth_banned: authBanned,
    p_error: errorMessage,
  });
  if (error) {
    console.error("Unable to record deactivation progress:", {
      operationId,
      message: error.message,
      code: error.code,
    });
    return { ok: false, status: null as string | null };
  }
  return { ok: true, status: typeof data === "string" ? data : null };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) {
      return json(500, { error: "Missing server configuration" });
    }

    const bearer = request.headers.get("Authorization") ?? "";
    if (!bearer.startsWith("Bearer ")) {
      return json(401, { error: "Authentication required" });
    }
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
      .select("id, role, active, permissions, auth_user_id, email")
      .eq("auth_user_id", verified.user.id)
      .maybeSingle();
    if (actorError) {
      console.error("Unable to load acting user:", actorError.message, actorError.code);
      return json(500, { error: "Unable to verify account status; check Edge Function logs" });
    }
    if (!actor) return json(403, { error: "Account not registered" });
    if (actor.auth_user_id !== verified.user.id) return json(403, { error: "Account identity mismatch" });
    if (actor.active !== true) return json(403, { error: "Account disabled" });

    const isOwner = verified.user.id === OWNER_AUTH_ID &&
      verified.user.email?.trim().toLowerCase() === OWNER_EMAIL;

    // Check the canonical permission record, while preserving the existing
    // JSON permission format used by the current UI.
    let hasDeletePermission = actor.permissions?.users_delete === true ||
      actor.permissions?.["users.delete"] === true;
    if (!hasDeletePermission && !isOwner) {
      const { data: permission, error: permissionError } = await admin.from("permissions")
        .select("id")
        .eq("code", "users.delete")
        .maybeSingle();
      if (permissionError) {
        console.error("Unable to load users.delete permission:", permissionError.message);
        return json(500, { error: "Unable to verify delete permission" });
      }
      if (permission) {
        const { data: userPermission, error: userPermissionError } = await admin
          .from("user_permissions")
          .select("user_id")
          .eq("user_id", verified.user.id)
          .eq("permission_id", permission.id)
          .maybeSingle();
        if (userPermissionError) {
          console.error("Unable to verify users.delete assignment:", userPermissionError.message);
          return json(500, { error: "Unable to verify delete permission" });
        }
        hasDeletePermission = !!userPermission;
      }
    }
    if (!isOwner && !hasDeletePermission) {
      return json(403, { error: "Permission denied" });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }
    const targetId = (body as { targetUserId?: unknown } | null)?.targetUserId;
    if (typeof targetId !== "number" || !Number.isSafeInteger(targetId) || targetId < 1) {
      return json(400, { error: "Invalid user ID" });
    }

    const { data: target, error: targetError } = await admin.from("users")
      .select("id, role, email, auth_user_id, active")
      .eq("id", targetId)
      .maybeSingle();
    if (targetError) {
      console.error("Unable to load target user:", targetError.message);
      return json(500, { error: "Unable to verify target user" });
    }
    if (!target) return json(404, { error: "User not found" });
    if (target.id === 1 || target.id === actor.id || target.auth_user_id === OWNER_AUTH_ID ||
        target.email?.trim().toLowerCase() === OWNER_EMAIL ||
        target.role === "مسؤول النظام") {
      return json(403, { error: "Protected account" });
    }
    if (!target.auth_user_id) {
      return json(409, { error: "Auth identity not linked; manual review required" });
    }

    // A global Auth ban affects every company. This endpoint only supports
    // targets with at most one tenant membership; multi-company removal needs
    // a separate company-scoped workflow.
    const { data: targetMemberships, error: targetMembershipError } = await admin
      .from("tenant_memberships")
      .select("tenant_id, role, active")
      .eq("user_id", target.auth_user_id);
    if (targetMembershipError || !targetMemberships) {
      console.error("Unable to verify target memberships:", targetMembershipError);
      return json(500, { error: "Unable to verify target company memberships" });
    }
    if (targetMemberships.length > 1) {
      return json(409, {
        error: "Account belongs to multiple companies; use company-scoped deactivation",
      });
    }

    let actorTenantId: string | null = null;
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
      actorTenantId = activeActorMemberships[0].tenant_id;
      const actorTenantRole = activeActorMemberships[0].role;
      if (!["owner", "admin"].includes(actorTenantRole)) {
        return json(403, { error: "Only company owners and administrators can deactivate users" });
      }
      if (targetMemberships.length !== 1 || targetMemberships[0].active !== true ||
          targetMemberships[0].tenant_id !== actorTenantId) {
        return json(403, { error: "Target is not exclusively in your active company" });
      }
      const { data: tenant, error: tenantError } = await admin.from("platform_tenants")
        .select("id, status")
        .eq("id", actorTenantId)
        .maybeSingle();
      if (tenantError || !tenant || tenant.status !== "active") {
        return json(403, { error: "Company is not active or could not be verified" });
      }
      if (target.role === "مدير النظام" || ["owner", "admin"].includes(targetMemberships[0].role)) {
        return json(403, { error: "Protected company administrator" });
      }
    }

    // Inspect all known history/reference tables. Any uncertainty blocks this
    // global deactivation because the audit/reference inventory is conservative.
    let hasActivity = false;
    for (const [table, column] of ACTIVITY_TABLES) {
      const { count, error } = await admin.from(table)
        .select(column, { count: "exact", head: true })
        .eq(column, target.auth_user_id);
      if (error || count === null) {
        console.error(`Unable to inspect ${table}.${column}:`, error ?? "null count");
        return json(409, {
          error: "Historical activity inspection incomplete; manual review required",
        });
      }
      if (count > 0) {
        hasActivity = true;
        break;
      }
    }

    // This RPC atomically creates or safely reclaims a released partial-failure
    // operation and returns both operation ID and lease token. Expired leases
    // are not reclaimed automatically.
    const { data: operationData, error: beginError } = await (admin as unknown as RpcClient).rpc(
      "begin_claim_user_deactivation",
      {
        p_actor_auth_user_id: verified.user.id,
        p_target_user_id: target.id,
        p_tenant_id: actorTenantId,
      },
    );
    if (beginError || !isRecord(operationData) ||
        typeof operationData.operation_id !== "string" ||
        typeof operationData.lease_token !== "string") {
      console.error("Unable to begin/claim deactivation:", beginError);
      const code = beginError?.code;
      const message = beginError?.message ?? "";
      if (
        code === "23505" ||
        message.includes("Open operation") ||
        message.includes("active or unreconciled lease") ||
        message.includes("Pending operation") ||
        message.includes("already exists")
      ) {
        return json(409, {
          error: "An open or unreconciled deactivation operation exists; manual review or safe recovery is required",
        });
      }
      if (
        message.includes("permission") ||
        message.includes("membership") ||
        message.includes("Tenant is required") ||
        message.includes("Actor account")
      ) {
        return json(403, { error: "Current actor authorization could not be verified" });
      }
      return json(500, { error: "Unable to register and claim deactivation operation" });
    }
    const operationId = operationData.operation_id;
    const leaseToken = operationData.lease_token;

    // Disable application access first. The operation is recorded before either
    // irreversible access change, and every result is written to the ledger.
    const { error: disableError } = await admin.from("users")
      .update({ active: false })
      .eq("id", target.id);
    if (disableError) {
      const message = `Unable to disable database account: ${disableError.message}`;
      await recordProgress(admin, operationId, leaseToken, false, false, message);
      await releaseLease(admin, operationId, leaseToken, message);
      return json(500, {
        error: "Unable to disable database account; operation recorded for review",
        operationId,
      });
    }

    const { error: banError } = await admin.auth.admin.updateUserById(target.auth_user_id, {
      ban_duration: "876000h",
    });
    if (banError) {
      const message = `Database account disabled, but Auth ban failed: ${banError.message}`;
      const progress = await recordProgress(admin, operationId, leaseToken, true, false, message);
      const released = await releaseLease(admin, operationId, leaseToken, message);
      return json(500, {
        error: "Database account disabled, but Auth ban failed; review required",
        operationId,
        ledgerUpdated: progress.ok,
        leaseReleased: released,
      });
    }

    const progress = await recordProgress(admin, operationId, leaseToken, true, true, null);
    if (!progress.ok || progress.status !== "completed") {
      // The Auth ban may have succeeded even if the ledger update failed. Do not
      // claim completion; leave a visible error and require reconciliation.
      const released = await releaseLease(
        admin,
        operationId,
        leaseToken,
        "Both access changes were requested, but completion could not be confirmed in the operation ledger",
      );
      return json(500, {
        error: "Access changes were applied, but operation completion could not be confirmed; manual review required",
        operationId,
        leaseReleased: released,
      });
    }

    // Do not permanently delete the user or historical records. This endpoint
    // only deactivates application access and bans Auth, with a retained ledger.
    return json(200, {
      success: true,
      action: "deactivated",
      operationId,
      hasHistoricalActivity: hasActivity,
    });
  } catch (error) {
    console.error("manage-user-removal failed:", error);
    return json(500, { error: "Unexpected server error" });
  }
});
