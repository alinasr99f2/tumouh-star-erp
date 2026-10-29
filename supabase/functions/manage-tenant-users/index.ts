import { createClient } from "@supabase/supabase-js";

// AQARY SMART - STAGING ONLY
// Tenant-scoped user creation. Requires the service-role-only SQL RPC.
// Do not deploy to production before staging security tests.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) {
      return json(500, { error: "Missing Supabase server configuration" });
    }

    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return json(401, { error: "Authentication required" });
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: verified, error: verificationError } = await admin.auth.getUser(
      authorization.slice(7),
    );
    if (verificationError || !verified.user) {
      return json(401, { error: "Invalid session" });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }
    if (!isObject(body) || body.action !== "create") {
      return json(400, { error: "Unsupported action" });
    }

    const tenantId = body.tenantId;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;
    const role = body.role;
    const requested = body.permissions;

    if (!isUuid(tenantId)) return json(400, { error: "Invalid tenant ID" });
    if (name.length < 2 || name.length > 150) return json(400, { error: "Invalid name" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json(400, { error: "Invalid email" });
    }
    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
      return json(400, { error: "Password must be 12-128 characters" });
    }
    if (role !== "manager" && role !== "employee") {
      return json(400, { error: "Only manager and employee roles are supported" });
    }
    if (!Array.isArray(requested) || requested.length > 200 ||
      requested.some((code) => typeof code !== "string" || code.length > 100)) {
      return json(400, { error: "Invalid permission list" });
    }
    const requestedCodes = [...new Set(requested as string[])];

    const { data: tenant, error: tenantError } = await admin
      .from("platform_tenants")
      .select("id, status")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenantError) return json(500, { error: "Unable to verify tenant" });
    if (tenant?.status !== "active") return json(403, { error: "Tenant is inactive" });

    const { data: platformOwner, error: ownerError } = await caller.rpc(
      "is_my_platform_system_owner",
    );
    if (ownerError) return json(500, { error: "Unable to verify platform owner" });

    const { data: actorMembership, error: membershipError } = await admin
      .from("tenant_memberships")
      .select("id, active")
      .eq("tenant_id", tenantId)
      .eq("user_id", verified.user.id)
      .maybeSingle();
    if (membershipError) return json(500, { error: "Unable to verify membership" });
    if (platformOwner !== true && actorMembership?.active !== true) {
      return json(403, { error: "No active tenant membership" });
    }

    const { data: permissionCatalog, error: catalogError } = await admin
      .from("permissions")
      .select("id, code");
    if (catalogError || !permissionCatalog) {
      return json(500, { error: "Unable to load permission catalog" });
    }
    const codeToId = new Map<string, number>(
      permissionCatalog.map((p) => [p.code as string, p.id as number]),
    );
    if (requestedCodes.some((code) => !codeToId.has(code))) {
      return json(400, { error: "Unknown permission code" });
    }

    if (platformOwner !== true) {
      const { data: actorGrants, error: grantsError } = await admin
        .from("tenant_membership_permissions")
        .select("permission_id")
        .eq("membership_id", actorMembership!.id);
      if (grantsError || !actorGrants) {
        return json(500, { error: "Unable to verify permission grants" });
      }
      const actorPermissionIds = new Set(actorGrants.map((p) => p.permission_id));
      if (!codeToId.has("users_add") ||
        !actorPermissionIds.has(codeToId.get("users_add"))) {
        return json(403, { error: "users_add permission required" });
      }
      if (requestedCodes.some((code) => !actorPermissionIds.has(codeToId.get(code)))) {
        return json(403, { error: "Cannot grant permissions you do not hold" });
      }
    }

    // Create a NEW Auth identity only. Existing email accounts must be linked
    // through a separate verified workflow; never link by email alone.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name },
    });
    if (createError || !created.user) {
      console.error("Auth creation failed", createError?.code);
      return json(409, { error: "Unable to create new Auth account; email may already exist" });
    }

    const newUserId = created.user.id;
    const { data: membershipId, error: rpcError } = await admin.rpc(
      "create_tenant_user_membership",
      {
        p_actor_user_id: verified.user.id,
        p_new_user_id: newUserId,
        p_tenant_id: tenantId,
        p_role: role,
        p_permission_codes: requestedCodes,
        p_is_platform_owner: platformOwner === true,
      },
    );

    if (rpcError || typeof membershipId !== "string") {
      // The membership + permissions RPC is transactional. If it fails,
      // remove only the Auth account that THIS request just created.
      // Never delete a pre-existing Auth account.
      const { error: cleanupError } = await admin.auth.admin.deleteUser(newUserId);
      if (cleanupError) {
        console.error("Manual reconciliation required", {
          authUserId: newUserId,
          rpcCode: rpcError?.code,
          cleanupCode: cleanupError.code,
        });
        return json(500, {
          error: "Partial creation requires administrator reconciliation",
          authUserId: newUserId,
        });
      }
      console.error("Membership creation failed; new Auth identity rolled back", rpcError?.code);
      return json(500, { error: "Unable to create tenant membership and permissions" });
    }

    return json(201, {
      success: true,
      tenantId,
      authUserId: newUserId,
      membershipId,
      emailVerificationRequired: true,
    });
  } catch (error) {
    console.error("manage-tenant-users error", error);
    return json(500, { error: "Unexpected server error" });
  }
});
