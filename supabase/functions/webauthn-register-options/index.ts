import { createClient } from "npm:@supabase/supabase-js@2.112.2";
import { generateRegistrationOptions } from "npm:@simplewebauthn/server@13.2.2";

import { getWebAuthnConfig } from "../_shared/webauthn-config.ts";
import {
  requireWebAuthnContext,
  WebAuthnAccessError,
} from "../_shared/webauthn-auth.ts";
import {
  getWebAuthnCorsHeaders,
  handleWebAuthnPreflight,
  isAllowedWebAuthnOrigin,
} from "../_shared/webauthn-cors.ts";

function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
): Response {
  const headers = getWebAuthnCorsHeaders(request);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (request: Request) => {
  try {
    const preflight = handleWebAuthnPreflight(request);
    if (preflight) return preflight;

    if (!isAllowedWebAuthnOrigin(request)) {
      return jsonResponse(request, { error: "Origin not allowed" }, 403);
    }

    if (request.method !== "POST") {
      return jsonResponse(request, { error: "Method not allowed" }, 405);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(request, { error: "Invalid JSON body" }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse(request, { error: "Invalid request body" }, 400);
    }

    const { tenantId, deviceId } = body as Record<string, unknown>;
    if (!isUuid(tenantId) || !isUuid(deviceId)) {
      return jsonResponse(request, { error: "Invalid tenantId or deviceId" }, 400);
    }

    const context = await requireWebAuthnContext(
      request,
      tenantId,
      deviceId,
      ["approved"],
    );

    const config = getWebAuthnConfig();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase server configuration is missing");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: credentials, error: credentialsError } = await adminClient
      .from("platform_webauthn_credentials")
      .select("credential_id")
      .eq("device_id", context.deviceId);

    if (credentialsError) {
      throw new Error("Failed to load existing credentials");
    }

    const options = await generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpID,
      userID: new TextEncoder().encode(context.user.id),
      userName: context.user.email ?? context.user.id,
      attestationType: "none",
      excludeCredentials: (credentials ?? []).map((credential) => ({
        id: credential.credential_id,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      timeout: config.challengeTTLSeconds * 1000,
    });

    const challengeHash = await sha256Hex(options.challenge);
    const expiresAt = new Date(
      Date.now() + config.challengeTTLSeconds * 1000,
    ).toISOString();

    const { error: insertError } = await adminClient
      .from("platform_webauthn_challenges")
      .insert({
        tenant_id: context.tenantId,
        user_id: context.user.id,
        device_id: context.deviceId,
        challenge_hash: challengeHash,
        ceremony_type: "registration",
        rp_id: config.rpID,
        origin: config.origin,
        expires_at: expiresAt,
      });

    if (insertError) {
      throw new Error("Failed to store registration challenge");
    }

    return jsonResponse(request, options);
  } catch (error) {
    if (error instanceof WebAuthnAccessError) {
      return jsonResponse(request, { error: error.message }, error.statusCode);
    }

    console.error("WebAuthn registration options failed:", error);
    return jsonResponse(request, { error: "Internal server error" }, 500);
  }
});
