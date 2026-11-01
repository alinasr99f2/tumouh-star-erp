
export type WebAuthnCeremony =
  | "registration"
  | "authentication";

export type WebAuthnConfig = {
  rpID: string;
  rpName: string;
  origin: string;
  challengeTTLSeconds: number;
};

export function getWebAuthnConfig(): WebAuthnConfig {
  const rpID = Deno.env.get("WEBAUTHN_RP_ID");
  const origin = Deno.env.get("WEBAUTHN_ORIGIN");

  if (!rpID || !origin) {
    throw new Error(
      "WebAuthn RP ID or Origin is not configured",
    );
  }

  const parsedOrigin = new URL(origin);

  if (
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash ||
    parsedOrigin.username ||
    parsedOrigin.password
  ) {
    throw new Error("Invalid WebAuthn origin");
  }

  const isLocalhost =
    parsedOrigin.hostname === "localhost";

  if (
    parsedOrigin.protocol !== "https:" &&
    !(
      isLocalhost &&
      parsedOrigin.protocol === "http:"
    )
  ) {
    throw new Error(
      "WebAuthn requires a secure origin",
    );
  }

  if (
    parsedOrigin.hostname !== rpID &&
    !parsedOrigin.hostname.endsWith(`.${rpID}`)
  ) {
    throw new Error(
      "WebAuthn RP ID does not match origin",
    );
  }

  return {
    rpID,
    rpName: "AQARY SMART",
    origin: parsedOrigin.origin,
    challengeTTLSeconds: 300,
  };
}
