
import {
  createClient,
  type User,
} from "npm:@supabase/supabase-js@2.112.2";

type DeviceStatus =
  | "pending"
  | "approved"
  | "blocked"
  | "revoked";

export type WebAuthnContext = {
  user: User;
  tenantId: string;
  deviceId: string;
  deviceStatus: DeviceStatus;
};

export class WebAuthnAccessError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 403,
  ) {
    super(message);
    this.name = "WebAuthnAccessError";
  }
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export async function requireWebAuthnContext(
  request: Request,
  tenantId: string,
  deviceId: string,
  allowedStatuses: DeviceStatus[],
): Promise<WebAuthnContext> {
  const authorization = request.headers.get(
    "Authorization",
  );

  if (
    !authorization ||
    !/^Bearer\s+\S+$/i.test(authorization)
  ) {
    throw new WebAuthnAccessError(
      "Missing authentication token",
      401,
    );
  }

  if (!tenantId || !deviceId) {
    throw new WebAuthnAccessError(
      "Tenant ID and device ID are required",
      400,
    );
  }

  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
  const serviceRoleKey = getRequiredEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
  );

  const token = authorization.replace(
    /^Bearer\s+/i,
    "",
  );

  const authClient = createClient(
    supabaseUrl,
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    throw new WebAuthnAccessError(
      "Invalid or expired authentication token",
      401,
    );
  }

  // Server-only client.
  // Never expose the service role key to the browser.
  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data: membership, error: membershipError } =
    await adminClient
      .from("tenant_memberships")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

  if (membershipError) {
    throw new Error(
      "Failed to validate tenant membership",
    );
  }

  if (!membership) {
    throw new WebAuthnAccessError(
      "User is not an active tenant member",
    );
  }

  const { data: tenant, error: tenantError } =
    await adminClient
      .from("platform_tenants")
      .select("id, status")
      .eq("id", tenantId)
      .maybeSingle();

  if (tenantError) {
    throw new Error(
      "Failed to validate tenant",
    );
  }

  if (!tenant || tenant.status !== "active") {
    throw new WebAuthnAccessError(
      "Tenant is not active",
    );
  }


  // Validate active tenant subscription.
  // Check subscription dates on the server.

  const now = Date.now();

  const {
    data: subscriptions,
    error: subscriptionError,
  } = await adminClient
    .from("platform_subscriptions")
    .select("id, starts_at, ends_at")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (subscriptionError) {
    console.error(
      "WebAuthn subscription validation error:",
      subscriptionError,
    );

    throw new Error(
      "Failed to validate tenant subscription",
    );
  }

  const hasValidSubscription = (
    subscriptions ?? []
  ).some((subscription) => {
    const startsAt = subscription.starts_at
      ? Date.parse(subscription.starts_at)
      : null;

    const endsAt = subscription.ends_at
      ? Date.parse(subscription.ends_at)
      : null;

    return (
      (startsAt === null ||
        (Number.isFinite(startsAt) && startsAt <= now)) &&
      (endsAt === null ||
        (Number.isFinite(endsAt) && endsAt > now))
    );
  });

  if (!hasValidSubscription) {
    throw new WebAuthnAccessError(
      "Tenant has no currently valid subscription",
    );
  }


  const { data: device, error: deviceError } =
    await adminClient
      .from("platform_devices")
      .select("id, status")
      .eq("id", deviceId)
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

  if (deviceError) {
    throw new Error(
      "Failed to validate device",
    );
  }

  if (!device) {
    throw new WebAuthnAccessError(
      "Device does not belong to this user",
    );
  }

  if (
    !allowedStatuses.includes(
      device.status as DeviceStatus,
    )
  ) {
    throw new WebAuthnAccessError(
      "Device status does not allow this operation",
    );
  }

  return {
    user,
    tenantId,
    deviceId,
    deviceStatus: device.status as DeviceStatus,
  };
}
