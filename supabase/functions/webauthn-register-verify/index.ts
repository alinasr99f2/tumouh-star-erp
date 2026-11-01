
import { createClient } from "@supabase/supabase-js";
import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";

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

async function sha256Hex(
  value: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes,
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

    const body = await request.json();

    const tenantId = body?.tenantId;
    const deviceId = body?.deviceId;
    const response = body?.response as
      | RegistrationResponseJSON
      | undefined;

    if (
      typeof tenantId !== "string" ||
      typeof deviceId !== "string" ||
      !response ||
      typeof response !== "object" ||
      !response.response ||
      typeof response.response.clientDataJSON !== "string" ||
      typeof response.id !== "string"
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

    // Extract the original challenge from clientDataJSON.
    // This value is untrusted until cryptographic
    // verification succeeds.
    const clientDataBytes = Uint8Array.from(
      atob(
        response.response.clientDataJSON
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(
            Math.ceil(
              response.response.clientDataJSON.length / 4,
            ) * 4,
            "=",
          ),
      ),
      (char) => char.charCodeAt(0),
    );

    const clientData = JSON.parse(
      new TextDecoder().decode(clientDataBytes),
    );

    const challenge = clientData?.challenge;

    if (typeof challenge !== "string") {
      return jsonResponse(
        request,
        { error: "Invalid WebAuthn challenge" },
        400,
      );
    }

    const challengeHash = await sha256Hex(challenge);

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

    const { data: storedChallenge, error: challengeError } =
      await adminClient
        .from("platform_webauthn_challenges")
        .select("id")
        .eq("challenge_hash", challengeHash)
        .eq("tenant_id", context.tenantId)
        .eq("user_id", context.user.id)
        .eq("device_id", context.deviceId)
        .eq("ceremony_type", "registration")
        .eq("rp_id", config.rpID)
        .eq("origin", config.origin)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

    if (challengeError) {
      throw new Error(
        "Failed to validate registration challenge",
      );
    }

    if (!storedChallenge) {
      return jsonResponse(
        request,
        { error: "Challenge expired or unavailable" },
        403,
      );
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
    });

    if (
      !verification.verified ||
      !verification.registrationInfo
    ) {
      return jsonResponse(
        request,
        { error: "WebAuthn verification failed" },
        403,
      );
    }

    const info = verification.registrationInfo;

    const credentialId = info.credential.id;
    const publicKeyHex = bytesToHex(
      info.credential.publicKey,
    );

    // PostgreSQL bytea accepts the \x hexadecimal format.
    const publicKeyBytea = `\\x${publicKeyHex}`;

    const { data: credentialRecordId, error: finalizeError } =
      await adminClient.rpc(
        "finalize_webauthn_registration",
        {
          p_challenge_hash: challengeHash,
          p_tenant_id: context.tenantId,
          p_user_id: context.user.id,
          p_device_id: context.deviceId,
          p_rp_id: config.rpID,
          p_origin: config.origin,
          p_credential_id: credentialId,
          p_public_key: publicKeyBytea,
          p_sign_count: info.credential.counter,
          p_transports:
            response.response.transports ?? [],
          p_aaguid: info.aaguid || null,
          p_backup_eligible:
            info.credentialDeviceType === "multiDevice",
          p_backup_state: info.credentialBackedUp,
        },
      );

    if (finalizeError) {
      console.error(
        "WebAuthn registration finalization failed:",
        finalizeError,
      );

      return jsonResponse(
        request,
        { error: "Unable to complete registration" },
        409,
      );
    }

    return jsonResponse(request, {
      verified: true,
      credentialRecordId,
    });
  } catch (error) {
    if (error instanceof WebAuthnAccessError) {
      return jsonResponse(
        request,
        { error: error.message },
        error.statusCode,
      );
    }

    console.error(
      "WebAuthn registration verification failed:",
      error,
    );

    return jsonResponse(
        request,
      { error: "WebAuthn registration failed" },
      400,
    );
  }
});
