import { createClient } from "npm:@supabase/supabase-js@2.112.2";

import {
  generateAuthenticationOptions,
} from "npm:@simplewebauthn/server@13.2.2";

import {
  getWebAuthnConfig,
} from "../_shared/webauthn-config.ts";

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

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes,
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request: Request) => {
  try {
    const preflight = handleWebAuthnPreflight(request);
    if (preflight) {
      return preflight;
    }

    if (!isAllowedWebAuthnOrigin(request)) {
      return jsonResponse(
        request,
        { error: "Origin not allowed" },
        403,
      );
    }

    if (request.method !== "POST") {
      return jsonResponse(
        request,
        { error: "Method not allowed" },
        405,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        request,
        { error: "Invalid JSON request" },
        400,
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse(
        request,
        { error: "Invalid request" },
        400,
      );
    }

    const { tenantId, deviceId } = body as Record<string, unknown>;

    if (
      typeof tenantId !== "string" ||
      !tenantId.trim() ||
      typeof deviceId !== "string" ||
      !deviceId.trim()
    ) {
      return jsonResponse(
        request,
        { error: "Invalid request" },
        400,
      );
    }

    const context = await requireWebAuthnContext(
      request,
      tenantId,
      deviceId,
      ["approved"],
    );

    const config = getWebAuthnConfig();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: credentials, error: credentialsError } =
      await adminClient
        .from("platform_webauthn_credentials")
        .select("credential_id")
        .eq("device_id", context.deviceId);

    if (credentialsError) {
      throw new Error("Failed to load WebAuthn credentials");
    }

    if (!credentials || credentials.length === 0) {
      return jsonResponse(
        request,
        { error: "No registered credential for device" },
        404,
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: config.rpID,
      allowCredentials: credentials.map((credential) => ({
        id: credential.credential_id,
      })),
      userVerification: "required",
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
        ceremony_type: "authentication",
        rp_id: config.rpID,
        origin: config.origin,
        expires_at: expiresAt,
      });

    if (insertError) {
      throw new Error("Failed to store authentication challenge");
    }

    return jsonResponse(request, options);
  } catch (error) {
    if (error instanceof WebAuthnAccessError) {
      return jsonResponse(
        request,
        { error: error.message },
        error.statusCode,
      );
    }

    console.error("WebAuthn authentication options failed:", error);

    return jsonResponse(
      request,
      { error: "Internal server error" },
      500,
    );
  }
});
