
import {
  getWebAuthnConfig,
} from "./webauthn-config.ts";

export function getWebAuthnCorsHeaders(
  request: Request,
): Headers {
  const { origin: allowedOrigin } =
    getWebAuthnConfig();

  const requestOrigin = request.headers.get("Origin");

  const headers = new Headers({
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Cache-Control": "no-store",
  });

  if (requestOrigin === allowedOrigin) {
    headers.set(
      "Access-Control-Allow-Origin",
      allowedOrigin,
    );
  }

  return headers;
}

export function handleWebAuthnPreflight(
  request: Request,
): Response | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  const headers = getWebAuthnCorsHeaders(request);

  if (
    request.headers.get("Origin") !==
    getWebAuthnConfig().origin
  ) {
    return new Response(null, {
      status: 403,
      headers,
    });
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

export function isAllowedWebAuthnOrigin(
  request: Request,
): boolean {
  const requestOrigin = request.headers.get("Origin");

  // Non-browser requests may omit Origin.
  // Authentication and authorization are still mandatory.
  return (
    requestOrigin === null ||
    requestOrigin === getWebAuthnConfig().origin
  );
}
