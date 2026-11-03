
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
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
  return new Response(JSON.stringify(body), { status, headers });
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

function decodeBase64Url(
  value: string,
): Uint8Array {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded = normalized.padEnd(
    Math.ceil(normalized.length / 4) * 4,
    "=",
  );

  return Uint8Array.from(
    atob(padded),
    (char) => char.charCodeAt(0),
  );
}

function decodeBytea(
  value: string,
): Uint8Array {
  if (value.startsWith("\\x")) {
    const hex = value.slice(2);

    if (
      hex.length % 2 !== 0 ||
      !/^[0-9a-fA-F]*$/.test(hex)
    ) {
      throw new Error("Invalid public key encoding");
    }

    return Uint8Array.from(
      hex.match(/.{2}/g) ?? [],
      (part) => parseInt(part, 16),
    );
  }

  throw new Error("Unsupported public key encoding");
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
      | AuthenticationResponseJSON
      | undefined;

    if (
      typeof tenantId !== "string" ||
      typeof deviceId !== "string" ||
      !response ||
      typeof response !== "object" ||
      typeof response.id !== "string" ||
      typeof response.response?.clientDataJSON !== "string" ||
      typeof response.response?.authenticatorData !== "string" ||
      typeof response.response?.signature !== "string"
    ) {
      return jsonResponse(request, 
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

    // Find the credential belonging to this device.
    const { data: credential, error: credentialError } =
      await adminClient
        .from("platform_webauthn_credentials")
        .select(
          "credential_id, public_key, sign_count, transports",
        )
        .eq("device_id", context.deviceId)
        .eq("credential_id", response.id)
        .maybeSingle();

    if (credentialError) {
      throw new Error(
        "Failed to load WebAuthn credential",
      );
    }

    if (!credential) {
      return jsonResponse(request, 
        { error: "Credential not registered for device" },
        403,
      );
    }

    // Extract untrusted challenge for lookup.
    const clientData = JSON.parse(
      new TextDecoder().decode(
        decodeBase64Url(
          response.response.clientDataJSON,
        ),
      ),
    );

    const challenge = clientData?.challenge;

    if (typeof challenge !== "string") {
      return jsonResponse(request, 
        { error: "Invalid challenge" },
        400,
      );
    }

    const challengeHash = await sha256Hex(challenge);

    const { data: storedChallenge, error: challengeError } =
      await adminClient
        .from("platform_webauthn_challenges")
        .select("id")
        .eq("challenge_hash", challengeHash)
        .eq("tenant_id", context.tenantId)
        .eq("user_id", context.user.id)
        .eq("device_id", context.deviceId)
        .eq("ceremony_type", "authentication")
        .eq("rp_id", config.rpID)
        .eq("origin", config.origin)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

    if (challengeError) {
      throw new Error(
        "Failed to validate authentication challenge",
      );
    }

    if (!storedChallenge) {
      return jsonResponse(request, 
        { error: "Challenge expired or already consumed" },
        403,
      );
    }

    const verification =
      await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: config.origin,
        expectedRPID: config.rpID,
        requireUserVerification: true,
        credential: {
          id: credential.credential_id,
          publicKey: new Uint8Array(
            decodeBytea(credential.public_key),
          ),

          counter: Number(credential.sign_count),
          transports: credential.transports ?? [],
        },
      });

    if (!verification.verified) {
      return jsonResponse(request, 
        { error: "Invalid WebAuthn signature" },
        403,
      );
    }

    const { data: finalized, error: finalizeError } =
      await adminClient.rpc(
        "finalize_webauthn_authentication",
        {
          p_challenge_hash: challengeHash,
          p_tenant_id: context.tenantId,
          p_user_id: context.user.id,
          p_device_id: context.deviceId,
          p_rp_id: config.rpID,
          p_origin: config.origin,
          p_credential_id: credential.credential_id,
          p_new_sign_count:
            verification.authenticationInfo.newCounter,
        },
      );

    if (finalizeError || finalized !== true) {
      console.error(
        "WebAuthn authentication finalization failed:",
        finalizeError,
      );

      return jsonResponse(request, 
        { error: "Authentication could not be finalized" },
        409,
      );
    }

    return jsonResponse(request, {
      verified: true,
    });
  } catch (error) {
    if (error instanceof WebAuthnAccessError) {
      return jsonResponse(request, 
        { error: error.message },
        error.statusCode,
      );
    }

    console.error(
      "WebAuthn authentication failed:",
      error,
    );

    return jsonResponse(request, 
      { error: "WebAuthn authentication failed" },
      400,
    );
  }
});
